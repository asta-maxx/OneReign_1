/**
 * app/api/drivers/[id]/route.ts
 * GET    /api/drivers/[id]  → getDriver
 * PATCH  /api/drivers/[id]  → updateDriver   (status rejected with 400)
 * DELETE /api/drivers/[id]  → deleteDriver
 *
 * Rule: NO business logic here. This file only parses the request,
 * calls the appropriate lib/ function, and shapes the HTTP response.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDriver, updateDriver, deleteDriver } from "@/lib/driver";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function errResponse(errors: string[], status: number) {
  return NextResponse.json({ success: false, errors }, { status });
}

/** Detect Prisma P2025 "record not found". */
function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "P2025"
  );
}

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/drivers/[id] ────────────────────────────────────────────────────

// Delegates to: getDriver (lib/driver.ts)
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  if (!id || id.trim().length === 0) {
    return errResponse(["Driver id is required"], 400);
  }

  try {
    const driver = await getDriver(id);
    return NextResponse.json({ success: true, data: driver });
  } catch (err: unknown) {
    if (isNotFound(err)) {
      return errResponse(["Driver not found"], 404);
    }
    console.error(`GET /api/drivers/${id} error`, err);
    return errResponse(["Internal server error"], 500);
  }
}

// ─── PATCH /api/drivers/[id] ──────────────────────────────────────────────────

// Delegates to: updateDriver (lib/driver.ts)
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  if (!id || id.trim().length === 0) {
    return errResponse(["Driver id is required"], 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errResponse(["Invalid JSON body"], 400);
  }

  const payload = (body ?? {}) as Record<string, unknown>;

  // Guard: status must never be changed through this route.
  // All status transitions go through the dispatch/complete/cancel flow.
  if ("status" in payload && payload.status !== undefined) {
    return NextResponse.json(
      {
        success: false,
        errors: [
          "Changing driver status directly is not allowed through this endpoint. " +
            "Status changes happen automatically when you dispatch, complete, or cancel a trip. " +
            "Use POST /api/trips/[id]/dispatch, /complete, or /cancel instead.",
        ],
      },
      { status: 400 }
    );
  }

  try {
    const driver = await updateDriver(id, {
      ...(typeof payload.name === "string" && { name: payload.name }),
      ...(typeof payload.licenseNumber === "string" && {
        licenseNumber: payload.licenseNumber,
      }),
      ...(typeof payload.licenseCategory === "string" && {
        licenseCategory: payload.licenseCategory,
      }),
      ...(payload.licenseExpiry != null && {
        licenseExpiry: payload.licenseExpiry as string,
      }),
      ...(payload.safetyScore !== undefined && {
        safetyScore: Number(payload.safetyScore),
      }),
    });
    return NextResponse.json({ success: true, data: driver });
  } catch (err: unknown) {
    if (isNotFound(err)) {
      return errResponse(["Driver not found"], 404);
    }
    const message = err instanceof Error ? err.message : "";
    if (message.startsWith("[driver]")) {
      return errResponse([message], 400);
    }
    console.error(`PATCH /api/drivers/${id} error`, err);
    return errResponse(["Internal server error"], 500);
  }
}

// ─── DELETE /api/drivers/[id] ─────────────────────────────────────────────────

// Delegates to: deleteDriver (lib/driver.ts)
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  if (!id || id.trim().length === 0) {
    return errResponse(["Driver id is required"], 400);
  }

  try {
    const driver = await deleteDriver(id);
    return NextResponse.json({ success: true, data: driver });
  } catch (err: unknown) {
    if (isNotFound(err)) {
      return errResponse(["Driver not found"], 404);
    }
    // FK violation — driver has active trips.
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: unknown }).code === "P2003"
    ) {
      return errResponse(
        ["Cannot delete driver with existing trips. Cancel or complete the trips first."],
        409
      );
    }
    console.error(`DELETE /api/drivers/${id} error`, err);
    return errResponse(["Internal server error"], 500);
  }
}
