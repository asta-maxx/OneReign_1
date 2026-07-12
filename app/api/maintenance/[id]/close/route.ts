import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateVehicleStatus } from "@/lib/vehicleStatus";
import { jsonError } from "@/lib/apiHelpers";

/**
 * PATCH /api/maintenance/:id/close
 * Close a maintenance record: set status "Closed" and stamp closedAt.
 *
 * On close, transition the vehicle back to "Available" via the centralised
 * updateVehicleStatus() — UNLESS the vehicle is currently "Retired", which must
 * never be overridden (a vehicle can be retired while in the shop).
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } } // Next.js 14 App Router: sync params.
) {
  const { id } = params;
  if (!id) return jsonError("maintenance id is required", 400);

  try {
    // Close the record AND revert the vehicle to "Available" in ONE transaction,
    // so the record's Closed state and the status flip commit together. We re-read
    // within the tx and reject double-closes so closedAt is stamped only once.
    const log = await prisma.$transaction(async (tx) => {
      const existing = await tx.maintenanceLog.findUnique({
        where: { id },
        select: { id: true, status: true, vehicleId: true },
      });
      if (!existing) throw new HttpError("Maintenance record not found", 404);
      if (existing.status === "Closed") {
        throw new HttpError("Maintenance record is already closed", 409);
      }

      const updated = await tx.maintenanceLog.update({
        where: { id },
        data: { status: "Closed", closedAt: new Date() },
      });

      // Revert to "Available" unless the vehicle is Retired — a vehicle can be
      // retired while in the shop, and Retired must never be overridden. We skip
      // the call when Retired rather than let the engine throw (which would abort
      // the close). The engine also guards Retired atomically as a backstop.
      const vehicle = await tx.vehicle.findUnique({
        where: { id: existing.vehicleId },
        select: { status: true },
      });
      if (vehicle && vehicle.status !== "Retired") {
        await updateVehicleStatus(existing.vehicleId, "Available", { tx });
      }

      return updated;
    });

    return NextResponse.json(log);
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.message, err.status);
    console.error("PATCH /api/maintenance/:id/close failed", err);
    return jsonError("Internal server error", 500);
  }
}

class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}
