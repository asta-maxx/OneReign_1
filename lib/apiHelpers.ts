import { NextResponse } from "next/server";

/** Small shared helpers for the Maintenance / Fuel / Expense API routes. */

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Returns true if `value` is a finite number strictly greater than `min`. */
export function isNumberGreaterThan(value: unknown, min: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > min;
}

/** Returns true if `value` is a finite number >= `min`. */
export function isNumberAtLeast(value: unknown, min: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min;
}

/**
 * Parses an incoming date value (ISO string or timestamp) and validates it is a
 * real date that is NOT in the future. Returns the Date on success or null on
 * invalid/future input.
 */
export function parseNonFutureDate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getTime() > Date.now()) return null;
  return date;
}
