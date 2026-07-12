/**
 * lib/driver.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Driver CRUD — Person 2 owns this file.
 *
 * Rules enforced here:
 *  • Status changes are NEVER done through updateDriver(). They go exclusively
 *    through updateDriverStatus() in lib/statusTransitions.ts so the
 *    shared transition-validation logic is never silently bypassed.
 *  • `isLicenseExpired` is a derived value computed at read time.  It is never
 *    persisted to the DB — do not add it to the schema.
 *  • This file has no Trip logic. Keep it that way.
 */

import { Driver } from "@prisma/client";
import { prisma } from "./prisma";
import { DriverStatus } from "./statusTransitions";

// ─── Allowed license categories ───────────────────────────────────────────────
// Extend this list if the business adds new categories.
const VALID_LICENSE_CATEGORIES = ["A", "B", "C", "D", "E", "BE", "CE", "DE"] as const;
type LicenseCategory = (typeof VALID_LICENSE_CATEGORIES)[number];

// ─── Output shape ─────────────────────────────────────────────────────────────

/** A raw Driver row from Prisma with the derived `isLicenseExpired` attached. */
export type DriverWithExpiry = Driver & { isLicenseExpired: boolean };

// ─── Input shapes ─────────────────────────────────────────────────────────────

export interface CreateDriverInput {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: Date | string; // ISO string accepted for API layer convenience
  safetyScore?: number;         // defaults to 100 (schema default)
  status?: DriverStatus;        // defaults to "Available" unless overridden
}

/**
 * Fields that updateDriver() is allowed to mutate.
 * `status` is intentionally excluded — use updateDriverStatus() instead.
 */
export interface UpdateDriverInput {
  name?: string;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiry?: Date | string;
  safetyScore?: number;
  /** Passing `status` here will throw.  Route it through updateDriverStatus(). */
  status?: never;
}

// ─── Filter shape ─────────────────────────────────────────────────────────────

export interface ListDriversFilter {
  /** Only return drivers whose status matches this value. */
  status?: DriverStatus;
  /**
   * When true, exclude drivers whose licenseExpiry is in the past.
   * The cut-off is evaluated at query time (server clock), not stored.
   */
  excludeExpiredLicense?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Attach the derived isLicenseExpired field to a raw Driver row. */
function withExpiry(driver: Driver): DriverWithExpiry {
  return {
    ...driver,
    isLicenseExpired: driver.licenseExpiry < new Date(),
  };
}

/** Resolve licenseExpiry to a Date, accepting either a Date or an ISO string. */
function resolveDate(value: Date | string, fieldName: string): Date {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`[driver] Invalid date for field "${fieldName}": "${value}".`);
  }
  return d;
}

/** Validate that a licenseCategory value is one of the known allowed values. */
function validateLicenseCategory(category: string): void {
  if (!(VALID_LICENSE_CATEGORIES as readonly string[]).includes(category)) {
    throw new Error(
      `[driver] Invalid licenseCategory "${category}". ` +
        `Allowed values: ${VALID_LICENSE_CATEGORIES.join(", ")}.`
    );
  }
}

/** Validate that safetyScore is a finite number in [0, 100]. */
function validateSafetyScore(score: number): void {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error(
      `[driver] safetyScore must be a finite number between 0 and 100 (received ${score}).`
    );
  }
}

// ─── CRUD operations ──────────────────────────────────────────────────────────

/**
 * createDriver — persist a new Driver record.
 *
 * @param input  Required: name, licenseNumber, licenseCategory, licenseExpiry.
 *               Optional: safetyScore (0–100, default 100), status (default "Available").
 * @returns      The created driver with `isLicenseExpired` attached.
 * @throws       Descriptive error on invalid input or DB unique-constraint violation.
 */
export async function createDriver(input: CreateDriverInput): Promise<DriverWithExpiry> {
  // ── Required field checks ──
  if (!input.name?.trim()) {
    throw new Error("[driver] createDriver: `name` is required and cannot be blank.");
  }
  if (!input.licenseNumber?.trim()) {
    throw new Error("[driver] createDriver: `licenseNumber` is required and cannot be blank.");
  }
  if (!input.licenseCategory?.trim()) {
    throw new Error("[driver] createDriver: `licenseCategory` is required and cannot be blank.");
  }
  if (input.licenseExpiry == null) {
    throw new Error("[driver] createDriver: `licenseExpiry` is required.");
  }

  // ── Field-level validation ──
  validateLicenseCategory(input.licenseCategory);
  const expiryDate = resolveDate(input.licenseExpiry, "licenseExpiry");

  const safetyScore = input.safetyScore ?? 100;
  validateSafetyScore(safetyScore);

  const status: DriverStatus = input.status ?? "Available";

  const driver = await prisma.driver.create({
    data: {
      name: input.name.trim(),
      licenseNumber: input.licenseNumber.trim(),
      licenseCategory: input.licenseCategory as LicenseCategory,
      licenseExpiry: expiryDate,
      safetyScore,
      status,
    },
  });

  return withExpiry(driver);
}

/**
 * getDriver — fetch a single Driver by ID.
 *
 * @param id  The driver's CUID.
 * @returns   The driver with `isLicenseExpired` attached.
 * @throws    Prisma P2025 if not found (findUniqueOrThrow semantics).
 */
export async function getDriver(id: string): Promise<DriverWithExpiry> {
  if (!id?.trim()) {
    throw new Error("[driver] getDriver: `id` is required.");
  }

  const driver = await prisma.driver.findUniqueOrThrow({ where: { id } });
  return withExpiry(driver);
}

/**
 * listDrivers — return all drivers, with optional filtering.
 *
 * @param filters  Optional:
 *   - `status`                — filter by exact DriverStatus value.
 *   - `excludeExpiredLicense` — when true, omit drivers whose licenseExpiry < now().
 * @returns  Array of drivers with `isLicenseExpired` attached.
 */
export async function listDrivers(filters?: ListDriversFilter): Promise<DriverWithExpiry[]> {
  const now = new Date();

  const drivers = await prisma.driver.findMany({
    where: {
      ...(filters?.status !== undefined && { status: filters.status }),
      ...(filters?.excludeExpiredLicense === true && {
        licenseExpiry: { gte: now },
      }),
    },
    orderBy: { createdAt: "desc" },
  });

  return drivers.map(withExpiry);
}

/**
 * updateDriver — mutate allowed fields on an existing Driver.
 *
 * ⚠ Status changes are NOT supported here — they must be routed through
 *   `updateDriverStatus()` in `lib/statusTransitions.ts`.  Passing `status`
 *   in the payload throws immediately so the caller knows exactly what to do.
 *
 * @param id    The driver's CUID.
 * @param data  Partial set of mutable fields (status excluded by type + runtime guard).
 * @returns     The updated driver with `isLicenseExpired` attached.
 * @throws      Clear error if `status` is sneaked in, or on invalid field values.
 */
export async function updateDriver(
  id: string,
  data: UpdateDriverInput & { status?: unknown }
): Promise<DriverWithExpiry> {
  if (!id?.trim()) {
    throw new Error("[driver] updateDriver: `id` is required.");
  }

  // ── Runtime guard: status must never flow through here ──
  if ("status" in data && data.status !== undefined) {
    throw new Error(
      "[driver] updateDriver: You cannot change a driver's status through this function. " +
        "Use updateDriverStatus() from lib/statusTransitions.ts instead."
    );
  }

  // ── Field-level validation for provided fields ──
  if (data.name !== undefined && !data.name.trim()) {
    throw new Error("[driver] updateDriver: `name` cannot be set to a blank string.");
  }
  if (data.licenseNumber !== undefined && !data.licenseNumber.trim()) {
    throw new Error("[driver] updateDriver: `licenseNumber` cannot be set to a blank string.");
  }
  if (data.licenseCategory !== undefined) {
    if (!data.licenseCategory.trim()) {
      throw new Error("[driver] updateDriver: `licenseCategory` cannot be set to a blank string.");
    }
    validateLicenseCategory(data.licenseCategory);
  }
  if (data.safetyScore !== undefined) {
    validateSafetyScore(data.safetyScore);
  }

  const expiryDate =
    data.licenseExpiry !== undefined
      ? resolveDate(data.licenseExpiry, "licenseExpiry")
      : undefined;

  const driver = await prisma.driver.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber.trim() }),
      ...(data.licenseCategory !== undefined && {
        licenseCategory: data.licenseCategory as LicenseCategory,
      }),
      ...(expiryDate !== undefined && { licenseExpiry: expiryDate }),
      ...(data.safetyScore !== undefined && { safetyScore: data.safetyScore }),
    },
  });

  return withExpiry(driver);
}

/**
 * deleteDriver — hard-delete a Driver record by ID.
 *
 * Note: the caller is responsible for ensuring the driver has no active trips
 * before calling this.  Prisma will throw a foreign-key error if related Trip
 * rows exist (cascades are not configured in the schema by design).
 *
 * @param id  The driver's CUID.
 * @returns   The deleted driver row (without isLicenseExpired, since it no longer exists).
 * @throws    Prisma P2025 if not found; FK error if related trips exist.
 */
export async function deleteDriver(id: string): Promise<Driver> {
  if (!id?.trim()) {
    throw new Error("[driver] deleteDriver: `id` is required.");
  }

  return prisma.driver.delete({ where: { id } });
}
