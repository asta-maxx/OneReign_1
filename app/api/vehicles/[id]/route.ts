import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/apiHelpers";

/**
 * GET /api/vehicles/:id
 * Return a single vehicle by ID.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) return jsonError("vehicle id is required", 400);

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle) return jsonError("Vehicle not found", 404);
  return NextResponse.json(vehicle);
}

/**
 * PUT /api/vehicles/:id
 * Update editable vehicle information.
 * Immutable fields (id, status) are not modifiable.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) return jsonError("vehicle id is required", 400);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const input = (body ?? {}) as Record<string, unknown>;

  // Allowed fields only (do NOT allow status/id mutation).
  const {
    regNumber,
    name,
    type,
    maxLoadCapacity,
    odometer,
    acquisitionCost,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    status,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id: _incomingId,
  } = input as {
    regNumber?: unknown;
    name?: unknown;
    type?: unknown;
    maxLoadCapacity?: unknown;
    odometer?: unknown;
    acquisitionCost?: unknown;
    status?: unknown;
    id?: unknown;
  };

  const errors: string[] = [];

  if (regNumber !== undefined) {
    if (typeof regNumber !== "string" || regNumber.trim().length === 0) {
      errors.push("regNumber must be a non-empty string");
    }
  }

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      errors.push("name must be a non-empty string");
    }
  }

  if (type !== undefined) {
    if (typeof type !== "string" || type.trim().length === 0) {
      errors.push("type must be a non-empty string");
    }
  }

  function validateNonNegativeFiniteNumber(value: unknown, field: string) {
    if (value === undefined) return;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      errors.push(`${field} must be a non-negative finite number`);
    }
  }

  // NOTE: these fields are numeric in Prisma schema.
  validateNonNegativeFiniteNumber(maxLoadCapacity, "maxLoadCapacity");
  validateNonNegativeFiniteNumber(odometer, "odometer");
  validateNonNegativeFiniteNumber(acquisitionCost, "acquisitionCost");

  if (errors.length > 0) {
    return jsonError(errors.join("; "), 400);
  }

  const data: Record<string, unknown> = {
    ...(regNumber !== undefined && { regNumber: (regNumber as string).trim() }),
    ...(name !== undefined && { name: (name as string).trim() }),
    ...(type !== undefined && { type: (type as string).trim() }),
    ...(maxLoadCapacity !== undefined && { maxLoadCapacity }),
    ...(odometer !== undefined && { odometer }),
    ...(acquisitionCost !== undefined && { acquisitionCost }),
  };

  // If client sends only immutable fields, treat as bad request.
  if (Object.keys(data).length === 0) {
    return jsonError(
      "No updatable fields provided. Immutable fields: id, status.",
      400
    );
  }

  try {
    const updated = await prisma.vehicle.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    // P2025 -> record not found
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2025"
    ) {
      return jsonError("Vehicle not found", 404);
    }

    // Unique constraint on regNumber.
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return jsonError("A vehicle with that regNumber already exists", 409);
    }

    console.error("PUT /api/vehicles/:id failed", err);
    return jsonError("Internal server error", 500);
  }
}

