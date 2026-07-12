/**
 * app/api/drivers/route.ts
 * POST /api/drivers  → createDriver
 * GET  /api/drivers  → listDrivers
 *
 * Rule: NO business logic here. This file only parses the request,
 * calls the appropriate lib/ function, and shapes the HTTP response.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createDriver,
  listDrivers,
  CreateDriverInput,
} from "@/lib/driver";
import { DriverStatus } from "@/lib/statusTransitions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Consistent { success: false, errors } + status code. */
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

// ─── Allowed DriverStatus literals (mirrors lib/statusTransitions.ts) ─────────
const ALLOWED_DRIVER_STATUSES: readonly DriverStatus[] = [
  "Available",
  "On Trip",
  "Off Duty",
  "Suspended",
];

// ─── POST /api/drivers ────────────────────────────────────────────────────────

// Delegates to: createDriver (lib/driver.ts)
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errResponse(["Invalid JSON body"], 400);
  }

  const {
    name,
    licenseNumber,
    licenseCategory,
    licenseExpiry,
    safetyScore,
    status,
  } = (body ?? {}) as Record<string, unknown>;

  // Thin shape validation — required fields present and correct primitive type.
  if (typeof name !== "string" || name.trim().length === 0) {
    return errResponse(["`name` is required"], 400);
  }
  if (typeof licenseNumber !== "string" || licenseNumber.trim().length === 0) {
    return errResponse(["`licenseNumber` is required"], 400);
  }
  if (
    typeof licenseCategory !== "string" ||
    licenseCategory.trim().length === 0
  ) {
    return errResponse(["`licenseCategory` is required"], 400);
  }
  if (licenseExpiry == null) {
    return errResponse(["`licenseExpiry` is required"], 400);
  }

  const input: CreateDriverInput = {
    name,
    licenseNumber,
    licenseCategory,
    licenseExpiry: licenseExpiry as string,
    ...(safetyScore !== undefined && { safetyScore: Number(safetyScore) }),
    ...(status !== undefined && { status: status as DriverStatus }),
  };

  try {
    const driver = await createDriver(input);
    return NextResponse.json({ success: true, data: driver }, { status: 201 });
  } catch (err: unknown) {
    if (isNotFound(err)) {
      return errResponse(["Driver not found"], 404);
    }
    const message = err instanceof Error ? err.message : "";
    // Surface lib validation errors (invalid category, bad date, etc.) as 400.
    if (message.startsWith("[driver]")) {
      return errResponse([message], 400);
    }
    console.error("POST /api/drivers error", err);
    return errResponse(["Internal server error"], 500);
  }
}

// ─── GET /api/drivers ─────────────────────────────────────────────────────────

// Delegates to: listDrivers (lib/driver.ts)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const statusParam = searchParams.get("status") ?? undefined;
  const excludeExpiredParam = searchParams.get("excludeExpiredLicense");

  // Validate ?status= if provided.
  if (
    statusParam !== undefined &&
    !(ALLOWED_DRIVER_STATUSES as string[]).includes(statusParam)
  ) {
    return errResponse(
      [
        `Invalid status "${statusParam}". Allowed: ${ALLOWED_DRIVER_STATUSES.join(", ")}`,
      ],
      400
    );
  }

  try {
    const drivers = await listDrivers({
      status: statusParam as DriverStatus | undefined,
      excludeExpiredLicense: excludeExpiredParam === "true",
    });
    return NextResponse.json({ success: true, data: drivers });
  } catch (err: unknown) {
    console.error("GET /api/drivers error", err);
    return errResponse(["Internal server error"], 500);
  }
}
