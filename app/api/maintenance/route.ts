import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Centralised, teammate-owned status engine. This module MUST route every
// vehicle-status change through this function and never write Vehicle.status
// directly, so that the Trip and Maintenance modules cannot fight over the field.
import { updateVehicleStatus } from "@/lib/vehicleStatus";
import { jsonError } from "@/lib/apiHelpers";

/**
 * POST /api/maintenance
 * Create a maintenance record for a vehicle.
 *
 * Body: { vehicleId: string, description: string, status?: "Active" }
 *
 * Rules:
 *  - Reject if the vehicle is "Retired" (retired vehicles can't enter the shop).
 *  - Reject if the vehicle already has an OPEN (Active) maintenance record
 *    (see open question about multiple-open records in docs/operational-module.md
 *    — enforced here as the safe default; relax if the schema/product allows it).
 *  - On creation with status "Active", transition the vehicle to "In Shop" via
 *    the centralised updateVehicleStatus().
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { vehicleId, description, status } = (body ?? {}) as {
    vehicleId?: unknown;
    description?: unknown;
    status?: unknown;
  };

  if (typeof vehicleId !== "string" || vehicleId.length === 0) {
    return jsonError("vehicleId is required", 400);
  }
  if (typeof description !== "string" || description.trim().length === 0) {
    return jsonError("description is required", 400);
  }
  // Only "Active" maintenance records can be created; a record is never born
  // "Closed". Default to "Active" when omitted.
  const requestedStatus = status === undefined ? "Active" : status;
  if (requestedStatus !== "Active") {
    return jsonError('status, if provided, must be "Active"', 400);
  }

  try {
    // The precondition checks + the record insert are done in one transaction so
    // that the "not retired" / "no existing open record" guards are evaluated
    // against a consistent snapshot and the insert can't interleave with another
    // maintenance-create for the same vehicle.
    //
    // The maintenance-record write AND the "In Shop" status flip run in ONE
    // transaction: updateVehicleStatus() accepts the tx client, so either both
    // commit or neither does — no window where the record exists but the vehicle
    // isn't yet "In Shop". The status write itself is an atomic conditional
    // UPDATE inside the engine, so it's also race-proof against a concurrent trip
    // dispatch. See docs/operational-module.md → "Concurrency".
    const log = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: vehicleId },
        select: { id: true, status: true },
      });
      if (!vehicle) {
        throw new HttpError("Vehicle not found", 404);
      }
      if (vehicle.status === "Retired") {
        throw new HttpError("Retired vehicles cannot enter maintenance", 409);
      }

      const openRecord = await tx.maintenanceLog.findFirst({
        where: { vehicleId, status: "Active" },
        select: { id: true },
      });
      if (openRecord) {
        throw new HttpError(
          "Vehicle already has an open maintenance record",
          409
        );
      }

      const created = await tx.maintenanceLog.create({
        data: { vehicleId, description, status: "Active" },
      });

      // Route the status change through the centralised engine, in-transaction.
      await updateVehicleStatus(vehicleId, "In Shop", { tx });

      return created;
    });

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.message, err.status);
    console.error("POST /api/maintenance failed", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * GET /api/maintenance?vehicleId=...
 * List maintenance history for a vehicle, newest first.
 */
export async function GET(req: NextRequest) {
  const vehicleId = req.nextUrl.searchParams.get("vehicleId");
  if (!vehicleId) {
    return jsonError("vehicleId query parameter is required", 400);
  }

  const logs = await prisma.maintenanceLog.findMany({
    where: { vehicleId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(logs);
}

/** Lightweight typed error so transaction callbacks can signal HTTP status. */
class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}
