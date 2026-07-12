import { prisma } from "@/lib/prisma";

/**
 * Operational cost & fuel-efficiency aggregation.
 *
 * This is the "must be exactly correct" core that feeds the ROI report, so the
 * formulas are documented inline for quick verification by a reviewer.
 *
 * SCHEMA ASSUMPTIONS (to reconcile with the teammate's Prisma schema — see
 * docs/operational-module.md):
 *  - FuelLog:  { vehicleId, liters: Float(>0), cost: Float, date: DateTime }
 *  - Expense:  { vehicleId, type: "Toll"|"Maintenance"|"Other", amount: Float, date }
 *  - Trip:     { vehicleId, status: "Completed" (among others), distance: Float }
 *
 * These match the Prisma schema (prisma/schema.prisma) and the frontend contract
 * (lib/types.ts). Money is Float there, but `toNumber` also tolerates Decimal so
 * this stays correct if the columns are ever tightened to Decimal.
 */

// Prisma `_sum` returns `null` when there are no matching rows. Normalise to a
// plain number, treating the empty/no-rows case as 0. Also tolerates Decimal
// (which implements valueOf()/toString()) in case money columns are tightened.
function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export interface OperationalCost {
  vehicleId: string;
  fuelCost: number; // Σ FuelLog.cost
  maintenanceCost: number; // Σ Expense.amount WHERE type = "maintenance"
  totalCost: number; // fuelCost + maintenanceCost
}

/**
 * getOperationalCost(vehicleId)
 *
 *   fuelCost        = Σ over all FuelLog rows for this vehicle of `cost`
 *   maintenanceCost = Σ over all Expense rows for this vehicle where
 *                     `type = "Maintenance"` of `amount`
 *   totalCost       = fuelCost + maintenanceCost
 *
 * NOTE on maintenance cost source of truth: maintenance cost is taken ONLY from
 * Expense(type="maintenance"). MaintenanceLog currently has no `cost` column in
 * my assumed schema, so there is no risk of double-counting. If the teammate
 * adds a cost field to MaintenanceLog, we must pick a single source of truth
 * (e.g. creating a maintenance Expense row when a log is closed) — flagged as an
 * open question in docs/operational-module.md.
 */
export async function getOperationalCost(
  vehicleId: string
): Promise<OperationalCost> {
  const [fuelAgg, maintenanceAgg] = await Promise.all([
    prisma.fuelLog.aggregate({
      where: { vehicleId },
      _sum: { cost: true },
    }),
    prisma.expense.aggregate({
      where: { vehicleId, type: "Maintenance" },
      _sum: { amount: true },
    }),
  ]);

  const fuelCost = toNumber(fuelAgg._sum.cost);
  const maintenanceCost = toNumber(maintenanceAgg._sum.amount);

  return {
    vehicleId,
    fuelCost,
    maintenanceCost,
    totalCost: fuelCost + maintenanceCost,
  };
}

export interface FuelEfficiency {
  vehicleId: string;
  totalDistance: number; // Σ distance of Completed trips
  totalLitersUsed: number; // Σ FuelLog.liters
  // distance-per-litre (e.g. km/L). `null` when no fuel has been logged, to
  // avoid a divide-by-zero — callers must treat null as "not computable yet".
  fuelEfficiency: number | null;
}

/**
 * getFuelEfficiency(vehicleId)
 *
 *   fuelEfficiency = totalDistanceTravelled / totalLitersUsed
 *
 *   totalDistanceTravelled = Σ Trip.distance for this vehicle's COMPLETED trips
 *                            (in-flight/draft/cancelled trips are excluded — only
 *                            completed trips represent distance actually driven)
 *   totalLitersUsed        = Σ FuelLog.liters for this vehicle
 *
 * EDGE CASE — zero fuel logs: if totalLitersUsed === 0 we return `null` rather
 * than dividing by zero (which would yield Infinity/NaN and corrupt the ROI
 * report). Unit is whatever unit `Trip.distance` is stored in per litre.
 */
export async function getFuelEfficiency(
  vehicleId: string
): Promise<FuelEfficiency> {
  const [tripAgg, fuelAgg] = await Promise.all([
    prisma.trip.aggregate({
      where: { vehicleId, status: "Completed" },
      _sum: { distance: true },
    }),
    prisma.fuelLog.aggregate({
      where: { vehicleId },
      _sum: { liters: true },
    }),
  ]);

  const totalDistance = toNumber(tripAgg._sum.distance);
  const totalLitersUsed = toNumber(fuelAgg._sum.liters);

  return {
    vehicleId,
    totalDistance,
    totalLitersUsed,
    fuelEfficiency: totalLitersUsed > 0 ? totalDistance / totalLitersUsed : null,
  };
}
