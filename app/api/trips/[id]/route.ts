/**
 * app/api/trips/[id]/route.ts
 * GET /api/trips/[id]  → getTrip (single trip with vehicle + driver)
 *
 * Rule: NO business logic here. This file only parses the request,
 * calls the appropriate lib/ function, and shapes the HTTP response.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function errResponse(errors: string[], status: number) {
  return NextResponse.json({ success: false, errors }, { status });
}

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/trips/[id] ──────────────────────────────────────────────────────

// Delegates to: prisma.trip.findUnique with vehicle + driver include
// (No lib wrapper exists for a single-trip fetch; the thin DB call is acceptable here.)
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  if (!id || id.trim().length === 0) {
    return errResponse(["Trip id is required"], 400);
  }

  try {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      return errResponse(["Trip not found"], 404);
    }

    return NextResponse.json({ success: true, data: trip });
  } catch (err: unknown) {
    console.error(`GET /api/trips/${id} error`, err);
    return errResponse(["Internal server error"], 500);
  }
}
