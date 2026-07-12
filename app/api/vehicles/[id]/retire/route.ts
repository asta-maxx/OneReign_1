import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateVehicleStatus } from "@/lib/statusTransitions";
import { isIllegalTransition, isRecordNotFound, jsonError } from "@/lib/apiHelpers";

/**
 * POST /api/vehicles/:id/retire
 * Retire a vehicle via the centralised status engine.
 *
 * The engine validates against its legal-transition map, so retiring is only
 * allowed from "Available" or "In Shop". An "On Trip" vehicle (or an already
 * "Retired" one) yields an illegal-transition error -> 409. Retired is terminal.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } } // Next.js 14 App Router: sync params.
) {
  const { id } = params;
  if (!id) return jsonError("vehicle id is required", 400);

  try {
    // Engine takes a tx client; wrap the single call in a transaction.
    const vehicle = await prisma.$transaction((tx) =>
      updateVehicleStatus(tx, id, "Retired")
    );
    return NextResponse.json(vehicle);
  } catch (err) {
    if (isRecordNotFound(err)) return jsonError("Vehicle not found", 404);
    if (isIllegalTransition(err)) return jsonError((err as Error).message, 409);
    console.error("POST /api/vehicles/:id/retire failed", err);
    return jsonError("Internal server error", 500);
  }
}
