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
    // Close the record inside a transaction. We re-read within the tx and reject
    // double-closes so closedAt is only ever stamped once.
    const log = await prisma.$transaction(async (tx) => {
      const existing = await tx.maintenanceLog.findUnique({
        where: { id },
        select: { id: true, status: true, vehicleId: true },
      });
      if (!existing) throw new HttpError("Maintenance record not found", 404);
      if (existing.status === "Closed") {
        throw new HttpError("Maintenance record is already closed", 409);
      }

      return tx.maintenanceLog.update({
        where: { id },
        data: { status: "Closed", closedAt: new Date() },
      });
    });

    // Decide whether to revert the vehicle to "Available". We read the CURRENT
    // vehicle status and skip the transition if it's "Retired".
    //
    // NOTE: this check-then-set is best-effort. The definitive "never override
    // Retired" rule should also be enforced inside updateVehicleStatus() so it
    // holds even if the vehicle is retired concurrently between this read and the
    // status write. See docs/operational-module.md → "Concurrency".
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: log.vehicleId },
      select: { status: true },
    });
    if (vehicle && vehicle.status !== "Retired") {
      await updateVehicleStatus(log.vehicleId, "Available");
    }

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
