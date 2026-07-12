/**
 * app/api/vehicles/available/route.ts
 * GET /api/vehicles/available  → listAvailableVehiclesForDispatch
 *
 * Helper route for the trip-creation UI.  Returns only vehicles with
 * status=Available (excludes In Shop, On Trip, Retired).
 *
 * Rule: NO business logic here. This file only parses the request,
 * calls the appropriate lib/ function, and shapes the HTTP response.
 */

import { NextResponse } from "next/server";
import { listAvailableVehiclesForDispatch } from "@/lib/trip";

// ─── GET /api/vehicles/available ──────────────────────────────────────────────

// Delegates to: listAvailableVehiclesForDispatch (lib/trip.ts)
export async function GET() {
  try {
    const vehicles = await listAvailableVehiclesForDispatch();
    return NextResponse.json({ success: true, data: vehicles });
  } catch (err: unknown) {
    console.error("GET /api/vehicles/available error", err);
    return NextResponse.json(
      { success: false, errors: ["Internal server error"] },
      { status: 500 }
    );
  }
}
