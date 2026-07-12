import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFuelEfficiency, getOperationalCost } from "@/lib/operationalCost";
import { jsonError } from "@/lib/apiHelpers";

/**
 * GET /api/vehicles/:id/operational-cost
 * Returns the operational cost breakdown and fuel efficiency for a vehicle.
 * These feed the ROI report, so both aggregates are returned together.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } } // Next.js 14 App Router: sync params.
) {
  const { id } = params;
  if (!id) return jsonError("vehicle id is required", 400);

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!vehicle) return jsonError("Vehicle not found", 404);

  const [cost, efficiency] = await Promise.all([
    getOperationalCost(id),
    getFuelEfficiency(id),
  ]);

  return NextResponse.json({ ...cost, efficiency });
}
