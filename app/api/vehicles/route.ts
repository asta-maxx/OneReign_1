import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/apiHelpers";

/**
 * GET /api/vehicles
 * List vehicles for the fleet. Supports optional ?status= and ?type= filters
 * (used by the dashboard's dynamic filtering). Consumed by
 * maintenanceClient.getVehicles().
 */
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const type = req.nextUrl.searchParams.get("type") ?? undefined;

  const vehicles = await prisma.vehicle.findMany({
    where: { status, type },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(vehicles);
}

/**
 * POST /api/vehicles
 * Register a vehicle. Minimal validation; new vehicles start "Available".
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { regNumber, name, type, maxLoadCapacity, odometer, acquisitionCost } =
    (body ?? {}) as Record<string, unknown>;

  if (typeof regNumber !== "string" || regNumber.trim().length === 0) {
    return jsonError("regNumber is required", 400);
  }
  if (typeof name !== "string" || name.trim().length === 0) {
    return jsonError("name is required", 400);
  }
  if (typeof type !== "string" || type.trim().length === 0) {
    return jsonError("type is required", 400);
  }

  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        regNumber,
        name,
        type,
        maxLoadCapacity: Number(maxLoadCapacity) || 0,
        odometer: Number(odometer) || 0,
        acquisitionCost: Number(acquisitionCost) || 0,
        status: "Available",
      },
    });
    return NextResponse.json(vehicle, { status: 201 });
  } catch (err: unknown) {
    // Unique constraint on regNumber.
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return jsonError("A vehicle with that regNumber already exists", 409);
    }
    console.error("POST /api/vehicles failed", err);
    return jsonError("Internal server error", 500);
  }
}
