import { NextRequest, NextResponse } from "next/server";
import { updateVehicleStatus, VehicleStatusError } from "@/lib/vehicleStatus";
import { jsonError } from "@/lib/apiHelpers";

/**
 * POST /api/vehicles/:id/retire
 * Retire a vehicle. Routes through the centralised status engine (retiring is
 * allowed from any state and is idempotent). Retired is terminal — once retired,
 * other transitions are refused by the engine.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } } // Next.js 14 App Router: sync params.
) {
  const { id } = params;
  if (!id) return jsonError("vehicle id is required", 400);

  try {
    const vehicle = await updateVehicleStatus(id, "Retired");
    return NextResponse.json(vehicle);
  } catch (err) {
    if (err instanceof VehicleStatusError && err.code === "NOT_FOUND") {
      return jsonError("Vehicle not found", 404);
    }
    console.error("POST /api/vehicles/:id/retire failed", err);
    return jsonError("Internal server error", 500);
  }
}
