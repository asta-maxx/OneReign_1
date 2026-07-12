import { NextResponse } from "next/server";

/** Small shared helpers for the Maintenance / Fuel / Expense API routes. */

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * The teammate's status engine (lib/statusTransitions.ts) throws a plain Error
 * "Illegal vehicle transition: <from> -> <to>" when a move isn't in its legal
 * map. Detect it so routes can map it to a 409 instead of a generic 500.
 */
export function isIllegalTransition(err: unknown): err is Error {
  return err instanceof Error && err.message.startsWith("Illegal vehicle transition");
}

/**
 * findUniqueOrThrow (used by the status engine) throws a Prisma error with code
 * "P2025" when the row doesn't exist. Duck-typed so we don't import Prisma here.
 */
export function isRecordNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "P2025"
  );
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
