// Pure, DB-free calculation helpers.
//
// The bug-prone bits of the operational-cost/ROI logic are the divide-by-zero
// ratios and the expense-type casing. They're isolated here so they can be
// unit-tested without a database (see lib/calc.test.ts), and reused by the
// aggregation functions and routes so there's a single source of truth.

export const EXPENSE_TYPES = ["Toll", "Maintenance", "Other"] as const;
export type ExpenseType = (typeof EXPENSE_TYPES)[number];

/** Accept any casing, return the canonical capitalised type, or null if unknown. */
export function normalizeExpenseType(value: unknown): ExpenseType | null {
  if (typeof value !== "string") return null;
  return (
    EXPENSE_TYPES.find((t) => t.toLowerCase() === value.toLowerCase()) ?? null
  );
}

/**
 * Prisma `_sum` returns `null` when there are no matching rows. Normalise to a
 * plain number, treating the empty/no-rows case as 0. Also tolerates Decimal
 * (which implements valueOf()/toString()) in case money columns are tightened.
 */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

/** distance / litres, or null when litres <= 0 (avoids divide-by-zero). */
export function computeFuelEfficiency(
  totalDistance: number,
  totalLiters: number
): number | null {
  return totalLiters > 0 ? totalDistance / totalLiters : null;
}

/** netProfit / acquisitionCost, or null when acquisitionCost <= 0. */
export function computeRoi(
  netProfit: number,
  acquisitionCost: number
): number | null {
  return acquisitionCost > 0 ? netProfit / acquisitionCost : null;
}
