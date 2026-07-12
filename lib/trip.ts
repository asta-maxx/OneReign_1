/**
 * lib/trip.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Trip Lifecycle Engine — Person 2 owns this file.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  TRIP STATE MACHINE (quick reference for integrators)                   ║
 * ║                                                                          ║
 * ║  Draft ──────────────────────────────────────────────► Cancelled         ║
 * ║    │                                                  (vehicle/driver    ║
 * ║    │ dispatchTrip()           cancelTrip()             status unchanged) ║
 * ║    ▼                                                                     ║
 * ║  Dispatched ──► Completed    Dispatched ──────────────► Cancelled        ║
 * ║  (vehicle +     (vehicle +   (vehicle + driver                           ║
 * ║   driver →       driver →     → Available,                               ║
 * ║   On Trip)       Available)   trip → Cancelled)                          ║
 * ║                                                                          ║
 * ║  Illegal transitions (rejected with a structured error):                ║
 * ║   • dispatchTrip on a Dispatched / Completed / Cancelled trip            ║
 * ║   • completeTrip on a Draft / Completed / Cancelled trip                 ║
 * ║   • cancelTrip  on a Completed / Cancelled trip                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Guard rules enforced before dispatch:
 *   1. Trip must be in Draft status.
 *   2. Vehicle status must be "Available" (not "On Trip" | "In Shop" | "Retired").
 *   3. Driver status must be "Available" (not "On Trip" | "Off Duty" | "Suspended").
 *   4. driver.licenseExpiry must be in the future.
 *   5. trip.cargoWeight (if set) must not exceed vehicle.maxLoadCapacity.
 *
 * Non-negotiable design rules:
 *   • Vehicle/Driver status changes ALWAYS go through updateVehicleStatus() /
 *     updateDriverStatus() from lib/statusTransitions.ts.  Never call
 *     prisma.vehicle.update({ data: { status: … } }) or
 *     prisma.driver.update({ data: { status: … } }) directly in this file.
 *   • All multi-record mutations (dispatch / complete / cancel when Dispatched)
 *     are wrapped in a single prisma.$transaction — no partial writes.
 *   • Errors returned to callers are clean, structured, and JSON-serialisable.
 *     No raw Error instances, no stack traces leak out.
 */

import { Trip, Vehicle, Driver } from "@prisma/client";
import { prisma } from "./prisma";
import {
  updateVehicleStatus,
  updateDriverStatus,
  VehicleStatus,
  DriverStatus,
} from "./statusTransitions";

// ─── Trip status literals ──────────────────────────────────────────────────────
// Kept here (not re-exported from statusTransitions) because Trip status is
// owned by this module, not the shared engine.

export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";

// ─── Enriched Trip type ────────────────────────────────────────────────────────

/** A Trip row with its Vehicle and Driver relations hydrated. */
export type TripWithRelations = Trip & {
  vehicle: Vehicle;
  driver: Driver;
};

// ─── Result shape ──────────────────────────────────────────────────────────────

/**
 * All public functions in this file return (or throw) one of these two shapes
 * so API route handlers can pass the value straight through as JSON.
 */
export type TripResult<T = TripWithRelations> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

// ─── Input shapes ──────────────────────────────────────────────────────────────

export interface CreateTripInput {
  vehicleId: string;
  driverId: string;
  cargoWeight?: number;  // kg — optional; when provided, validated against maxLoadCapacity at dispatch time
  distance?: number;     // planned distance (km)
  revenue?: number;      // expected revenue/fare
  region?: string;       // optional geographic region tag
}

export interface ListTripsFilter {
  /** Only return trips whose status matches this value. */
  status?: TripStatus;
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

/** Cast a raw DB string into a TripStatus literal (throws if unrecognised). */
function asTripStatus(raw: string, tripId: string): TripStatus {
  const allowed: TripStatus[] = ["Draft", "Dispatched", "Completed", "Cancelled"];
  if ((allowed as string[]).includes(raw)) return raw as TripStatus;
  throw new Error(`[trip] Trip ${tripId} has unrecognised status in DB: "${raw}"`);
}

/** Wrap a single string in the standard error result shape. */
function errResult(message: string): TripResult<never> {
  return { success: false, errors: [message] };
}

/** Wrap multiple errors in the standard error result shape. */
function errResults(errors: string[]): TripResult<never> {
  return { success: false, errors };
}

// ─── Core validation ───────────────────────────────────────────────────────────

/**
 * validateDispatch — guard pipeline that checks EVERY business rule for dispatch.
 *
 * Collects ALL failing conditions in a single pass (not just the first) so that
 * the API response surfaces the complete list of violations at once.
 *
 * @param tripId — CUID of the trip to validate.
 * @returns `{ success: true }` if all rules pass, or
 *          `{ success: false, errors: string[] }` listing every violation found.
 */
export async function validateDispatch(
  tripId: string
): Promise<{ success: true } | { success: false; errors: string[] }> {
  if (!tripId?.trim()) {
    return { success: false, errors: ["[trip] validateDispatch: tripId is required."] };
  }

  // Load trip with relations in a single query.
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { vehicle: true, driver: true },
  });

  if (!trip) {
    return { success: false, errors: [`Trip "${tripId}" not found.`] };
  }

  const errors: string[] = [];
  const tripStatus = asTripStatus(trip.status, tripId);

  // ── Rule 1: Trip must be in Draft to be dispatched ──
  if (tripStatus !== "Draft") {
    errors.push(
      `Trip is already "${tripStatus}" — only a Draft trip can be dispatched.`
    );
    // No point running the remaining checks if the trip is not even dispatchable.
    return { success: false, errors };
  }

  // ── Rule 2: Vehicle must be Available ──
  if (trip.vehicle.status !== "Available") {
    errors.push(
      `Vehicle "${trip.vehicle.name}" (${trip.vehicle.regNumber}) is "${trip.vehicle.status}" — only Available vehicles can be dispatched.`
    );
  }

  // ── Rule 3: Driver must be Available ──
  if (trip.driver.status !== "Available") {
    errors.push(
      `Driver "${trip.driver.name}" is "${trip.driver.status}" — only Available drivers can be dispatched.`
    );
  }

  // ── Rule 4: Driver license must not be expired ──
  if (trip.driver.licenseExpiry < new Date()) {
    errors.push(
      `Driver "${trip.driver.name}" has an expired license (expired ${trip.driver.licenseExpiry.toISOString().slice(0, 10)}).`
    );
  }

  // ── Rule 5: Cargo weight must not exceed vehicle capacity (when provided) ──
  if (
    trip.cargoWeight !== null &&
    trip.cargoWeight !== undefined &&
    trip.cargoWeight > trip.vehicle.maxLoadCapacity
  ) {
    errors.push(
      `Cargo weight ${trip.cargoWeight} kg exceeds vehicle max load capacity of ${trip.vehicle.maxLoadCapacity} kg.`
    );
  }

  return errors.length > 0 ? { success: false, errors } : { success: true };
}

// ─── Lifecycle mutations ───────────────────────────────────────────────────────

/**
 * dispatchTrip — validate and atomically dispatch a Draft trip.
 *
 * Calls validateDispatch() first; if any rule fails the full error list is
 * returned without touching the DB.  If all rules pass, a single
 * prisma.$transaction commits: vehicle → On Trip, driver → On Trip,
 * trip → Dispatched.
 *
 * @param tripId — CUID of the trip to dispatch.
 * @returns `{ success: true, data: TripWithRelations }` on success, or
 *          `{ success: false, errors: string[] }` listing every violation.
 */
export async function dispatchTrip(tripId: string): Promise<TripResult> {
  if (!tripId?.trim()) {
    return errResult("[trip] dispatchTrip: tripId is required.");
  }

  // Run the full validation guard.
  const validation = await validateDispatch(tripId);
  if (!validation.success) {
    return errResults(validation.errors);
  }

  try {
    const updatedTrip = await prisma.$transaction(async (tx) => {
      // Re-fetch inside the transaction to get the vehicleId/driverId we need.
      const trip = await tx.trip.findUniqueOrThrow({
        where: { id: tripId },
        include: { vehicle: true, driver: true },
      });

      // Shared engine calls — the only legal way to mutate vehicle/driver status.
      await updateVehicleStatus(tx, trip.vehicleId, "On Trip" as VehicleStatus);
      await updateDriverStatus(tx, trip.driverId, "On Trip" as DriverStatus);

      // Update trip status.
      const dispatched = await tx.trip.update({
        where: { id: tripId },
        data: { status: "Dispatched" as TripStatus },
        include: { vehicle: true, driver: true },
      });

      return dispatched;
    });

    return { success: true, data: updatedTrip };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error during dispatch.";
    return errResult(`[trip] dispatchTrip failed: ${message}`);
  }
}

/**
 * completeTrip — atomically complete a Dispatched trip.
 *
 * Validates the trip is currently Dispatched; rejects any other status with a
 * clear error.  On success, a single prisma.$transaction commits:
 * vehicle → Available, driver → Available, trip → Completed.
 *
 * @param tripId — CUID of the trip to complete.
 * @returns `{ success: true, data: TripWithRelations }` on success, or
 *          `{ success: false, errors: string[] }` on failure.
 */
export async function completeTrip(tripId: string): Promise<TripResult> {
  if (!tripId?.trim()) {
    return errResult("[trip] completeTrip: tripId is required.");
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { vehicle: true, driver: true },
  });

  if (!trip) {
    return errResult(`Trip "${tripId}" not found.`);
  }

  const tripStatus = asTripStatus(trip.status, tripId);

  if (tripStatus !== "Dispatched") {
    return errResult(
      `Cannot complete a trip that is "${tripStatus}". ` +
        `Only a Dispatched trip can be completed.`
    );
  }

  try {
    const updatedTrip = await prisma.$transaction(async (tx) => {
      // Shared engine calls.
      await updateVehicleStatus(tx, trip.vehicleId, "Available" as VehicleStatus);
      await updateDriverStatus(tx, trip.driverId, "Available" as DriverStatus);

      return tx.trip.update({
        where: { id: tripId },
        data: {
          status: "Completed" as TripStatus,
          completedAt: new Date(),
        },
        include: { vehicle: true, driver: true },
      });
    });

    return { success: true, data: updatedTrip };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error during completion.";
    return errResult(`[trip] completeTrip failed: ${message}`);
  }
}

/**
 * cancelTrip — cancel a Draft or Dispatched trip.
 *
 * Two paths:
 *   • Draft → only the trip status changes (vehicle/driver untouched — they
 *     were never committed to this trip).
 *   • Dispatched → atomically reverts vehicle → Available, driver → Available,
 *     then sets trip → Cancelled.
 *
 * Completed and already-Cancelled trips are rejected with a clear error.
 *
 * @param tripId — CUID of the trip to cancel.
 * @returns `{ success: true, data: TripWithRelations }` on success, or
 *          `{ success: false, errors: string[] }` on failure.
 */
export async function cancelTrip(tripId: string): Promise<TripResult> {
  if (!tripId?.trim()) {
    return errResult("[trip] cancelTrip: tripId is required.");
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { vehicle: true, driver: true },
  });

  if (!trip) {
    return errResult(`Trip "${tripId}" not found.`);
  }

  const tripStatus = asTripStatus(trip.status, tripId);

  if (tripStatus === "Completed") {
    return errResult(
      `Cannot cancel a trip that is already Completed.`
    );
  }

  if (tripStatus === "Cancelled") {
    return errResult(
      `Trip "${tripId}" is already Cancelled.`
    );
  }

  try {
    if (tripStatus === "Draft") {
      // Draft cancellation: only the trip status changes.
      const updatedTrip = await prisma.trip.update({
        where: { id: tripId },
        data: { status: "Cancelled" as TripStatus },
        include: { vehicle: true, driver: true },
      });
      return { success: true, data: updatedTrip };
    }

    // Dispatched cancellation: atomically revert vehicle + driver, then trip.
    const updatedTrip = await prisma.$transaction(async (tx) => {
      // Shared engine calls — the only legal way to mutate vehicle/driver status.
      await updateVehicleStatus(tx, trip.vehicleId, "Available" as VehicleStatus);
      await updateDriverStatus(tx, trip.driverId, "Available" as DriverStatus);

      return tx.trip.update({
        where: { id: tripId },
        data: { status: "Cancelled" as TripStatus },
        include: { vehicle: true, driver: true },
      });
    });

    return { success: true, data: updatedTrip };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error during cancellation.";
    return errResult(`[trip] cancelTrip failed: ${message}`);
  }
}

// ─── Trip listing ────────────────────────────────────────────────────────────

/**
 * listTrips — return all trips, with optional status filter.
 *
 * @param filters  Optional: `status` — filter by exact TripStatus value.
 * @returns  Array of TripWithRelations ordered by creation date (newest first).
 */
export async function listTrips(
  filters?: ListTripsFilter
): Promise<TripWithRelations[]> {
  return prisma.trip.findMany({
    where: {
      ...(filters?.status !== undefined && { status: filters.status }),
    },
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Trip creation ─────────────────────────────────────────────────────────────

/**
 * createTrip — create a new Trip record in Draft status.
 *
 * Validates required fields and basic input sanity.  Does NOT validate
 * vehicle/driver availability or cargo capacity — that is deferred to
 * validateDispatch() / dispatchTrip() at dispatch time.
 *
 * @param data  Required: vehicleId, driverId.
 *              Optional: cargoWeight, distance, revenue, region.
 * @returns `{ success: true, data: TripWithRelations }` on success, or
 *          `{ success: false, errors: string[] }` on validation failure.
 */
export async function createTrip(data: CreateTripInput): Promise<TripResult> {
  const errors: string[] = [];

  // ── Required field checks ──
  if (!data.vehicleId?.trim()) {
    errors.push("[trip] createTrip: `vehicleId` is required.");
  }
  if (!data.driverId?.trim()) {
    errors.push("[trip] createTrip: `driverId` is required.");
  }

  // ── Numeric sanity checks for optional fields ──
  if (data.cargoWeight !== undefined) {
    if (!Number.isFinite(data.cargoWeight) || data.cargoWeight < 0) {
      errors.push(
        `[trip] createTrip: \`cargoWeight\` must be a non-negative number (received ${data.cargoWeight}).`
      );
    }
  }
  if (data.distance !== undefined) {
    if (!Number.isFinite(data.distance) || data.distance < 0) {
      errors.push(
        `[trip] createTrip: \`distance\` must be a non-negative number (received ${data.distance}).`
      );
    }
  }
  if (data.revenue !== undefined) {
    if (!Number.isFinite(data.revenue) || data.revenue < 0) {
      errors.push(
        `[trip] createTrip: \`revenue\` must be a non-negative number (received ${data.revenue}).`
      );
    }
  }

  if (errors.length > 0) {
    return errResults(errors);
  }

  // ── Existence checks: verify vehicle and driver actually exist ──
  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: data.vehicleId } }),
    prisma.driver.findUnique({ where: { id: data.driverId } }),
  ]);

  if (!vehicle) {
    errors.push(`Vehicle "${data.vehicleId}" not found.`);
  }
  if (!driver) {
    errors.push(`Driver "${data.driverId}" not found.`);
  }
  if (errors.length > 0) {
    return errResults(errors);
  }

  try {
    const trip = await prisma.trip.create({
      data: {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        status: "Draft" as TripStatus,
        ...(data.cargoWeight !== undefined && { cargoWeight: data.cargoWeight }),
        ...(data.distance !== undefined && { distance: data.distance }),
        ...(data.revenue !== undefined && { revenue: data.revenue }),
        ...(data.region !== undefined && { region: data.region }),
      },
      include: { vehicle: true, driver: true },
    });

    return { success: true, data: trip };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error during trip creation.";
    return errResult(`[trip] createTrip failed: ${message}`);
  }
}

// ─── Helper queries for dispatch UI ───────────────────────────────────────────

/**
 * listAvailableVehiclesForDispatch — query vehicles eligible to be dispatched.
 *
 * Returns only vehicles with status "Available".
 * Excludes "In Shop", "On Trip", and "Retired" so they never appear in the
 * dispatch dropdown.
 *
 * @returns Array of Vehicle rows ordered by name.
 */
export async function listAvailableVehiclesForDispatch(): Promise<Vehicle[]> {
  return prisma.vehicle.findMany({
    where: { status: "Available" satisfies VehicleStatus },
    orderBy: { name: "asc" },
  });
}

/**
 * listAvailableDriversForDispatch — query drivers eligible to be dispatched.
 *
 * Returns only drivers who are:
 *   • status = "Available"  (not On Trip / Off Duty / Suspended)
 *   • licenseExpiry >= now  (non-expired license)
 *
 * Suspended drivers and those with expired licenses never appear as options.
 *
 * @returns Array of Driver rows ordered by name.
 */
export async function listAvailableDriversForDispatch(): Promise<Driver[]> {
  return prisma.driver.findMany({
    where: {
      status: "Available" satisfies DriverStatus,
      licenseExpiry: { gte: new Date() },
    },
    orderBy: { name: "asc" },
  });
}
