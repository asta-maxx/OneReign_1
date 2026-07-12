/**
 * app/api/drivers/available/route.ts
 * GET /api/drivers/available  → listAvailableDriversForDispatch
 *
 * Helper route for the trip-creation UI.  Returns only drivers who are
 * status=Available AND have a non-expired license.
 *
 * Rule: NO business logic here. This file only parses the request,
 * calls the appropriate lib/ function, and shapes the HTTP response.
 */

import { NextResponse } from "next/server";
import { listAvailableDriversForDispatch } from "@/lib/trip";

// ─── GET /api/drivers/available ───────────────────────────────────────────────

// Delegates to: listAvailableDriversForDispatch (lib/trip.ts)
export async function GET() {
  try {
    const drivers = await listAvailableDriversForDispatch();
    return NextResponse.json({ success: true, data: drivers });
  } catch (err: unknown) {
    console.error("GET /api/drivers/available error", err);
    return NextResponse.json(
      { success: false, errors: ["Internal server error"] },
      { status: 500 }
    );
  }
}
