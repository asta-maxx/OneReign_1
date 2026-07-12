import { Prisma, Vehicle } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Centralised vehicle-status engine.
 *
 * This is the ONE place `Vehicle.status` is ever written. The Trip module and
 * the Maintenance module both call this instead of updating the column
 * themselves, so the two features can't race each other into an inconsistent
 * state. (See README → "centralisation of status transitions".)
 */

export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";

const VALID_STATUSES: readonly VehicleStatus[] = [
  "Available",
  "On Trip",
  "In Shop",
  "Retired",
];

export class VehicleStatusError extends Error {
  constructor(message: string, public code: "NOT_FOUND" | "RETIRED" | "INVALID") {
    super(message);
    this.name = "VehicleStatusError";
  }
}

/**
 * Optional Prisma transaction client, so callers that write other rows in the
 * same transaction can have the status change participate atomically.
 */
type Db = Prisma.TransactionClient | typeof prisma;

/**
 * updateVehicleStatus(vehicleId, newStatus)
 *
 * Rules enforced centrally:
 *  - `newStatus` must be a known status.
 *  - A "Retired" vehicle is terminal: it can never be moved to another status
 *    (retiring itself is idempotent). This makes the "never override Retired"
 *    requirement hold regardless of which caller asks, even under concurrency.
 *
 * Concurrency: the transition is a single atomic `UPDATE ... WHERE` guarded by
 * the current status, so two concurrent callers (e.g. maintenance-create vs.
 * trip-dispatch) cannot both "win" against a Retired vehicle — the SQL WHERE
 * clause is evaluated atomically by the database, not in application code.
 *
 * @returns the vehicle after the (attempted) transition.
 * @throws VehicleStatusError on unknown vehicle, invalid status, or an attempt
 *         to move a Retired vehicle.
 */
export async function updateVehicleStatus(
  vehicleId: string,
  newStatus: VehicleStatus,
  options?: { tx?: Prisma.TransactionClient }
): Promise<Vehicle> {
  if (!VALID_STATUSES.includes(newStatus)) {
    throw new VehicleStatusError(`Unknown vehicle status: ${newStatus}`, "INVALID");
  }

  const db: Db = options?.tx ?? prisma;

  // Retiring is always allowed (from any state). Any other target must NOT touch
  // a vehicle that is currently "Retired" — encoded directly in the WHERE clause
  // so the guard is atomic at the database level.
  const where: Prisma.VehicleWhereInput =
    newStatus === "Retired"
      ? { id: vehicleId }
      : { id: vehicleId, status: { not: "Retired" } };

  const { count } = await db.vehicle.updateMany({
    where,
    data: { status: newStatus },
  });

  if (count === 0) {
    // Either the vehicle doesn't exist, or it's Retired and we refused to move it.
    const existing = await db.vehicle.findUnique({ where: { id: vehicleId } });
    if (!existing) {
      throw new VehicleStatusError("Vehicle not found", "NOT_FOUND");
    }
    if (existing.status === "Retired") {
      throw new VehicleStatusError(
        "Vehicle is Retired; status cannot be changed",
        "RETIRED"
      );
    }
    // Shouldn't happen, but return the current row rather than lie about success.
    return existing;
  }

  // updateMany doesn't return the row, so read it back for the caller.
  return db.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
}
