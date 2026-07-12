/**
 * app/api/trips/route.ts
 * POST /api/trips  → createTrip
 * GET  /api/trips  → listTrips
 *
 * Rule: NO business logic here. This file only parses the request,
 * calls the appropriate lib/ function, and shapes the HTTP response.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createTrip,
  listTrips,
  CreateTripInput,
  TripStatus,
} from "@/lib/trip";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function errResponse(errors: string[], status: number) {
  return NextResponse.json({ success: false, errors }, { status });
}

const ALLOWED_TRIP_STATUSES: readonly TripStatus[] = [
  "Draft",
  "Dispatched",
  "Completed",
  "Cancelled",
];

// ─── POST /api/trips ──────────────────────────────────────────────────────────

// Delegates to: createTrip (lib/trip.ts)
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errResponse(["Invalid JSON body"], 400);
  }

  const { vehicleId, driverId, cargoWeight, distance, revenue, region } =
    (body ?? {}) as Record<string, unknown>;

  // Minimal shape validation: required fields present.
  if (typeof vehicleId !== "string" || vehicleId.trim().length === 0) {
    return errResponse(["`vehicleId` is required"], 400);
  }
  if (typeof driverId !== "string" || driverId.trim().length === 0) {
    return errResponse(["`driverId` is required"], 400);
  }

  const input: CreateTripInput = {
    vehicleId,
    driverId,
    ...(cargoWeight !== undefined && { cargoWeight: Number(cargoWeight) }),
    ...(distance !== undefined && { distance: Number(distance) }),
    ...(revenue !== undefined && { revenue: Number(revenue) }),
    ...(region !== undefined &&
      typeof region === "string" && { region }),
  };

  try {
    const result = await createTrip(input);
    if (!result.success) {
      // createTrip returns { success: false, errors } for validation failures.
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("POST /api/trips error", err);
    return errResponse(["Internal server error"], 500);
  }
}

// ─── GET /api/trips ───────────────────────────────────────────────────────────

// Delegates to: listTrips (lib/trip.ts)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const statusParam = searchParams.get("status") ?? undefined;

  // Validate ?status= if provided.
  if (
    statusParam !== undefined &&
    !(ALLOWED_TRIP_STATUSES as string[]).includes(statusParam)
  ) {
    return errResponse(
      [
        `Invalid status "${statusParam}". Allowed: ${ALLOWED_TRIP_STATUSES.join(", ")}`,
      ],
      400
    );
  }

  try {
    const trips = await listTrips({
      status: statusParam as TripStatus | undefined,
    });
    return NextResponse.json({ success: true, data: trips });
  } catch (err: unknown) {
    console.error("GET /api/trips error", err);
    return errResponse(["Internal server error"], 500);
  }
}
