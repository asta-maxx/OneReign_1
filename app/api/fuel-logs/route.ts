import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isNumberAtLeast,
  isNumberGreaterThan,
  jsonError,
  parseNonFutureDate,
} from "@/lib/apiHelpers";

/**
 * POST /api/fuel-logs
 * Record a fuel purchase for a vehicle.
 *
 * Body: { vehicleId: string, liters: number, cost: number, date: string|number }
 * Validation: liters > 0, cost >= 0, date not in the future.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { vehicleId, liters, cost, date } = (body ?? {}) as {
    vehicleId?: unknown;
    liters?: unknown;
    cost?: unknown;
    date?: unknown;
  };

  if (typeof vehicleId !== "string" || vehicleId.length === 0) {
    return jsonError("vehicleId is required", 400);
  }
  if (!isNumberGreaterThan(liters, 0)) {
    return jsonError("liters must be a number greater than 0", 400);
  }
  if (!isNumberAtLeast(cost, 0)) {
    return jsonError("cost must be a number greater than or equal to 0", 400);
  }
  const parsedDate = parseNonFutureDate(date);
  if (!parsedDate) {
    return jsonError("date must be a valid date that is not in the future", 400);
  }

  // Ensure the referenced vehicle exists (clearer 404 than a raw FK error).
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true },
  });
  if (!vehicle) return jsonError("Vehicle not found", 404);

  const log = await prisma.fuelLog.create({
    data: { vehicleId, liters, cost, date: parsedDate },
  });
  return NextResponse.json(log, { status: 201 });
}

/**
 * GET /api/fuel-logs?vehicleId=...
 * List fuel logs for a vehicle, newest first.
 */
export async function GET(req: NextRequest) {
  const vehicleId = req.nextUrl.searchParams.get("vehicleId");
  if (!vehicleId) {
    return jsonError("vehicleId query parameter is required", 400);
  }

  const logs = await prisma.fuelLog.findMany({
    where: { vehicleId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(logs);
}
