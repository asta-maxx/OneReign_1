/**
 * lib/statusTransitions.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared status-transition engine — Person 2 owns this file.
 *
 * Person 3 (Maintenance module): import and call these functions instead of
 * writing your own vehicle/driver status update logic. See the JSDoc on each
 * function for the exact call signature.
 *
 * Both functions require a Prisma *transaction* client (`tx`) as their first
 * argument so that vehicle + driver + trip status changes issued by dispatch /
 * complete / cancel are committed (or rolled back) atomically. Do NOT pass the
 * global `prisma` singleton here — wrap your own call in
 * `prisma.$transaction(async (tx) => { … })` and thread `tx` through.
 *
 * Example (Maintenance module):
 *   await prisma.$transaction(async (tx) => {
 *     await updateVehicleStatus(tx, vehicle.id, "In Shop");
 *     await tx.maintenanceLog.create({ data: { … } });
 *   });
 */

import { Prisma, Vehicle, Driver } from "@prisma/client";

// ─── Status types ─────────────────────────────────────────────────────────────
// Export these so other modules can reference the allowed literals without
// copy-pasting magic strings. The values are plain strings (not Prisma enums)
// because Prisma's enum identifiers can't contain spaces — see schema.prisma.

/** Allowed values for Vehicle.status — must match schema.prisma comment exactly. */
export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";

/** Allowed values for Driver.status — must match schema.prisma comment exactly. */
export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";

// ─── Legal transition maps ────────────────────────────────────────────────────

/**
 * Adjacency list of legal Vehicle status transitions.
 * "Retired" maps to an empty array — it is a terminal state.
 */
const VEHICLE_TRANSITIONS: Readonly<Record<VehicleStatus, readonly VehicleStatus[]>> = {
  Available: ["On Trip", "In Shop", "Retired"],
  "On Trip": ["Available", "In Shop"],
  "In Shop": ["Available", "Retired"],
  Retired: [],
} as const;

/**
 * Adjacency list of legal Driver status transitions.
 * "Suspended" can only move back to "Available" (e.g. after review).
 */
const DRIVER_TRANSITIONS: Readonly<Record<DriverStatus, readonly DriverStatus[]>> = {
  Available: ["On Trip", "Off Duty", "Suspended"],
  "On Trip": ["Available"],
  "Off Duty": ["Available", "Suspended"],
  Suspended: ["Available"],
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Narrow an arbitrary string coming from the DB into a VehicleStatus literal. */
function asVehicleStatus(raw: string, context: string): VehicleStatus {
  if (raw in VEHICLE_TRANSITIONS) return raw as VehicleStatus;
  throw new Error(`[statusTransitions] Vehicle ${context} has unrecognised status in DB: "${raw}"`);
}

/** Narrow an arbitrary string coming from the DB into a DriverStatus literal. */
function asDriverStatus(raw: string, context: string): DriverStatus {
  if (raw in DRIVER_TRANSITIONS) return raw as DriverStatus;
  throw new Error(`[statusTransitions] Driver ${context} has unrecognised status in DB: "${raw}"`);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * updateVehicleStatus — validate and apply a Vehicle status transition atomically.
 *
 * Usage (inside an existing Prisma transaction):
 *   const updated = await updateVehicleStatus(tx, vehicleId, "On Trip");
 *
 * Usage (wrapping your own transaction):
 *   const updated = await prisma.$transaction(async (tx) =>
 *     updateVehicleStatus(tx, vehicleId, "In Shop")
 *   );
 *
 * @param tx        - Prisma transaction client (NOT the global prisma singleton).
 * @param vehicleId - ID of the vehicle to update.
 * @param newStatus - Target status. Must be a legal next state for the current one.
 * @returns         The updated Vehicle row.
 * @throws Error    "Illegal vehicle transition: <from> -> <to>" if the move is not
 *                  in the legal-transitions map, or if the vehicle is not found.
 */
export async function updateVehicleStatus(
  tx: Prisma.TransactionClient,
  vehicleId: string,
  newStatus: VehicleStatus
): Promise<Vehicle> {
  const vehicle = await tx.vehicle.findUniqueOrThrow({
    where: { id: vehicleId },
  });

  const currentStatus = asVehicleStatus(vehicle.status, vehicleId);
  const allowed = VEHICLE_TRANSITIONS[currentStatus];

  if (!(allowed as readonly string[]).includes(newStatus)) {
    throw new Error(
      `Illegal vehicle transition: ${currentStatus} -> ${newStatus}` +
      ` (vehicle ${vehicleId}; allowed: [${allowed.join(", ") || "none — terminal state"}])`
    );
  }

  return tx.vehicle.update({
    where: { id: vehicleId },
    data: { status: newStatus },
  });
}

/**
 * updateDriverStatus — validate and apply a Driver status transition atomically.
 *
 * Usage (inside an existing Prisma transaction):
 *   const updated = await updateDriverStatus(tx, driverId, "On Trip");
 *
 * Usage (wrapping your own transaction):
 *   const updated = await prisma.$transaction(async (tx) =>
 *     updateDriverStatus(tx, driverId, "Off Duty")
 *   );
 *
 * @param tx       - Prisma transaction client (NOT the global prisma singleton).
 * @param driverId - ID of the driver to update.
 * @param newStatus - Target status. Must be a legal next state for the current one.
 * @returns        The updated Driver row.
 * @throws Error   "Illegal driver transition: <from> -> <to>" if the move is not
 *                 in the legal-transitions map, or if the driver is not found.
 */
export async function updateDriverStatus(
  tx: Prisma.TransactionClient,
  driverId: string,
  newStatus: DriverStatus
): Promise<Driver> {
  const driver = await tx.driver.findUniqueOrThrow({
    where: { id: driverId },
  });

  const currentStatus = asDriverStatus(driver.status, driverId);
  const allowed = DRIVER_TRANSITIONS[currentStatus];

  if (!(allowed as readonly string[]).includes(newStatus)) {
    throw new Error(
      `Illegal driver transition: ${currentStatus} -> ${newStatus}` +
      ` (driver ${driverId}; allowed: [${allowed.join(", ")}])`
    );
  }

  return tx.driver.update({
    where: { id: driverId },
    data: { status: newStatus },
  });
}
