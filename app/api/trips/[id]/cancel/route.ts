/**
 * app/api/trips/[id]/cancel/route.ts
 * POST /api/trips/[id]/cancel  → cancelTrip
 *
 * Rule: NO business logic here. This file only parses the request,
 * calls the appropriate lib/ function, and shapes the HTTP response.
 */

import { NextRequest, NextResponse } from "next/server";
import { cancelTrip } from "@/lib/trip";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function errResponse(errors: string[], status: number) {
  return NextResponse.json({ success: false, errors }, { status });
}

type RouteContext = { params: Promise<{ id: string }> };

// ─── POST /api/trips/[id]/cancel ─────────────────────────────────────────────

// Delegates to: cancelTrip (lib/trip.ts)
export async function POST(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  if (!id || id.trim().length === 0) {
    return errResponse(["Trip id is required"], 400);
  }

  try {
    const result = await cancelTrip(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: unknown) {
    console.error(`POST /api/trips/${id}/cancel error`, err);
    return errResponse(["Internal server error"], 500);
  }
}
