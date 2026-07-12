import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVehicleROI } from "@/lib/roi";
import { jsonError } from "@/lib/apiHelpers";

/**
 * GET /api/vehicles/:id/roi
 * Return revenue, operational cost, net profit and ROI for one vehicle.
 * See lib/roi.ts for the formula and the revenue-model assumption.
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

  const roi = await getVehicleROI(id);
  return NextResponse.json(roi);
}
