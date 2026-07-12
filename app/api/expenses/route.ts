import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isNumberAtLeast, jsonError, parseNonFutureDate } from "@/lib/apiHelpers";
// Canonical casing ("Toll" | "Maintenance" | "Other") matches lib/types.ts;
// getOperationalCost filters on "Maintenance" so these MUST stay in sync.
import { EXPENSE_TYPES, normalizeExpenseType } from "@/lib/calc";

/**
 * POST /api/expenses
 * Record an expense against a vehicle.
 *
 * Body: { vehicleId: string, type: "Toll"|"Maintenance"|"Other" (any casing),
 *         amount: number, date: string|number }
 * Validation: type in the allowed set, amount >= 0, date not in the future.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { vehicleId, type, amount, date } = (body ?? {}) as {
    vehicleId?: unknown;
    type?: unknown;
    amount?: unknown;
    date?: unknown;
  };

  if (typeof vehicleId !== "string" || vehicleId.length === 0) {
    return jsonError("vehicleId is required", 400);
  }
  const normalizedType = normalizeExpenseType(type);
  if (!normalizedType) {
    return jsonError(
      `type must be one of: ${EXPENSE_TYPES.join(", ")}`,
      400
    );
  }
  if (!isNumberAtLeast(amount, 0)) {
    return jsonError("amount must be a number greater than or equal to 0", 400);
  }
  const parsedDate = parseNonFutureDate(date);
  if (!parsedDate) {
    return jsonError("date must be a valid date that is not in the future", 400);
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true },
  });
  if (!vehicle) return jsonError("Vehicle not found", 404);

  const expense = await prisma.expense.create({
    data: { vehicleId, type: normalizedType, amount, date: parsedDate },
  });
  return NextResponse.json(expense, { status: 201 });
}

/**
 * GET /api/expenses?vehicleId=...
 * List expenses for a vehicle, newest first.
 */
export async function GET(req: NextRequest) {
  const vehicleId = req.nextUrl.searchParams.get("vehicleId");
  if (!vehicleId) {
    return jsonError("vehicleId query parameter is required", 400);
  }

  const expenses = await prisma.expense.findMany({
    where: { vehicleId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}
