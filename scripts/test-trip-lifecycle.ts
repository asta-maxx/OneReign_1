/**
 * scripts/test-trip-lifecycle.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Section 9 — Driver & Trip Lifecycle guard-condition tests.
 *
 * Maps 1-to-1 with every test case listed in Section 9 of the TransitOps
 * Master Sheet.  Anyone running the Hour 5:00 integration pass should be able
 * to run this script and get a clear green/red signal on every case.
 *
 * Run with:
 *   npx tsx scripts/test-trip-lifecycle.ts
 *   — or add to package.json scripts: "test:lifecycle": "tsx scripts/test-trip-lifecycle.ts"
 *
 * Exit code:  0 = all passed,  1 = one or more failed.
 *
 * Design:
 *  • Each test creates its own isolated vehicle/driver/trip fixtures.
 *  • Tests call lib/ functions directly — NOT HTTP routes.
 *  • Fixtures are cleaned up after each test so re-runs are idempotent.
 *  • "status" field injection into updateDriver() is caught at the type
 *    level (UpdateDriverInput uses `status?: never`) but we cast through
 *    `as any` here to simulate a rogue API caller.
 */

import { prisma } from "../lib/prisma";
import { createDriver, updateDriver } from "../lib/driver";
import {
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  listAvailableVehiclesForDispatch,
  listAvailableDriversForDispatch,
} from "../lib/trip";

// ─── Tiny test harness ────────────────────────────────────────────────────────

let totalPassed = 0;
let totalFailed = 0;
const failedTests: number[] = [];

function pass(n: number, description: string) {
  totalPassed++;
  console.log(`✅ [TC-${n}] ${description}`);
}

function fail(n: number, description: string, reason: string) {
  totalFailed++;
  failedTests.push(n);
  console.log(`❌ [TC-${n}] ${description}`);
  console.log(`        ↳ ${reason}`);
}

// ─── Fixture factories ────────────────────────────────────────────────────────

/** Creates a minimal vehicle with status "Available" and capacity 1000 kg. */
async function makeVehicle(overrides: Partial<{
  status: string;
  maxLoadCapacity: number;
  regSuffix: string;
}> = {}) {
  const suffix = overrides.regSuffix ?? Math.random().toString(36).slice(2, 8).toUpperCase();
  return prisma.vehicle.create({
    data: {
      regNumber: `TEST-${suffix}`,
      name: `Test Vehicle ${suffix}`,
      type: "Truck",
      maxLoadCapacity: overrides.maxLoadCapacity ?? 1000,
      odometer: 0,
      acquisitionCost: 50000,
      status: overrides.status ?? "Available",
    },
  });
}

/** Creates a minimal driver with a valid (far-future) license by default. */
async function makeDriver(overrides: Partial<{
  status: string;
  licenseExpiry: Date;
}> = {}) {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return createDriver({
    name: `Test Driver ${suffix}`,
    licenseNumber: `LIC-${suffix}`,
    licenseCategory: "B",
    licenseExpiry: overrides.licenseExpiry ?? new Date("2035-01-01"),
    status: (overrides.status as any) ?? "Available",
  });
}

/** Clean up vehicle + its trips.  Silently ignores "not found". */
async function cleanVehicle(vehicleId: string) {
  await prisma.trip.deleteMany({ where: { vehicleId } }).catch(() => {});
  await prisma.vehicle.delete({ where: { id: vehicleId } }).catch(() => {});
}

/** Clean up driver + its trips. Silently ignores "not found". */
async function cleanDriver(driverId: string) {
  await prisma.trip.deleteMany({ where: { driverId } }).catch(() => {});
  await prisma.driver.delete({ where: { id: driverId } }).catch(() => {});
}

// ─── Test cases ───────────────────────────────────────────────────────────────

/**
 * TC-1: Dispatch trip with valid vehicle + driver + cargo within capacity → success.
 */
async function tc1() {
  const n = 1;
  const desc = "Dispatch trip with valid vehicle + driver + cargo within capacity → success";
  let vehicleId = "";
  let driverId = "";
  try {
    const vehicle = await makeVehicle({ maxLoadCapacity: 1000 });
    vehicleId = vehicle.id;
    const driver = await makeDriver();
    driverId = driver.id;

    const tripResult = await createTrip({ vehicleId, driverId, cargoWeight: 500 });
    if (!tripResult.success) throw new Error(`createTrip failed: ${tripResult.errors.join(", ")}`);

    const dispatchResult = await dispatchTrip(tripResult.data.id);
    if (!dispatchResult.success) throw new Error(`dispatchTrip failed: ${dispatchResult.errors.join(", ")}`);

    if (dispatchResult.data.status !== "Dispatched") throw new Error(`Expected trip status Dispatched, got ${dispatchResult.data.status}`);
    if (dispatchResult.data.vehicle.status !== "On Trip") throw new Error(`Expected vehicle On Trip, got ${dispatchResult.data.vehicle.status}`);
    if (dispatchResult.data.driver.status !== "On Trip") throw new Error(`Expected driver On Trip, got ${dispatchResult.data.driver.status}`);

    pass(n, desc);
  } catch (e: any) {
    fail(n, desc, e.message);
  } finally {
    await cleanVehicle(vehicleId);
    await cleanDriver(driverId);
  }
}

/**
 * TC-2: Dispatch trip with cargo exceeding maxLoadCapacity → reject with "Cargo exceeds capacity".
 */
async function tc2() {
  const n = 2;
  const desc = "Dispatch with cargo > maxLoadCapacity → reject with cargo error";
  let vehicleId = "";
  let driverId = "";
  try {
    const vehicle = await makeVehicle({ maxLoadCapacity: 500 });
    vehicleId = vehicle.id;
    const driver = await makeDriver();
    driverId = driver.id;

    const tripResult = await createTrip({ vehicleId, driverId, cargoWeight: 9999 });
    if (!tripResult.success) throw new Error(`createTrip failed: ${tripResult.errors.join(", ")}`);

    const dispatchResult = await dispatchTrip(tripResult.data.id);
    if (dispatchResult.success) throw new Error("Expected dispatch to fail but it succeeded.");

    const hasCargoError = dispatchResult.errors.some(e =>
      e.toLowerCase().includes("cargo") || e.toLowerCase().includes("capacity")
    );
    if (!hasCargoError) throw new Error(`Expected cargo/capacity error message, got: ${dispatchResult.errors.join("; ")}`);

    pass(n, desc);
  } catch (e: any) {
    fail(n, desc, e.message);
  } finally {
    await cleanVehicle(vehicleId);
    await cleanDriver(driverId);
  }
}

/**
 * TC-3: Dispatch trip with a Suspended driver → reject.
 */
async function tc3() {
  const n = 3;
  const desc = "Dispatch with Suspended driver → reject";
  let vehicleId = "";
  let driverId = "";
  try {
    const vehicle = await makeVehicle();
    vehicleId = vehicle.id;
    const driver = await makeDriver({ status: "Suspended" });
    driverId = driver.id;

    const tripResult = await createTrip({ vehicleId, driverId });
    if (!tripResult.success) throw new Error(`createTrip failed: ${tripResult.errors.join(", ")}`);

    const dispatchResult = await dispatchTrip(tripResult.data.id);
    if (dispatchResult.success) throw new Error("Expected dispatch to fail but it succeeded.");

    const hasSuspendedError = dispatchResult.errors.some(e =>
      e.toLowerCase().includes("suspended") || e.toLowerCase().includes("available")
    );
    if (!hasSuspendedError) throw new Error(`Expected suspended/available error, got: ${dispatchResult.errors.join("; ")}`);

    pass(n, desc);
  } catch (e: any) {
    fail(n, desc, e.message);
  } finally {
    await cleanVehicle(vehicleId);
    await cleanDriver(driverId);
  }
}

/**
 * TC-4: Dispatch trip with expired license → reject.
 */
async function tc4() {
  const n = 4;
  const desc = "Dispatch with expired license → reject";
  let vehicleId = "";
  let driverId = "";
  try {
    const vehicle = await makeVehicle();
    vehicleId = vehicle.id;
    const driver = await makeDriver({ licenseExpiry: new Date("2020-01-01") }); // past date
    driverId = driver.id;

    const tripResult = await createTrip({ vehicleId, driverId });
    if (!tripResult.success) throw new Error(`createTrip failed: ${tripResult.errors.join(", ")}`);

    const dispatchResult = await dispatchTrip(tripResult.data.id);
    if (dispatchResult.success) throw new Error("Expected dispatch to fail but it succeeded.");

    const hasLicenseError = dispatchResult.errors.some(e =>
      e.toLowerCase().includes("expired") || e.toLowerCase().includes("license")
    );
    if (!hasLicenseError) throw new Error(`Expected license expiry error, got: ${dispatchResult.errors.join("; ")}`);

    pass(n, desc);
  } catch (e: any) {
    fail(n, desc, e.message);
  } finally {
    await cleanVehicle(vehicleId);
    await cleanDriver(driverId);
  }
}

/**
 * TC-5: Dispatch trip with vehicle already On Trip → reject.
 */
async function tc5() {
  const n = 5;
  const desc = "Dispatch with vehicle already On Trip → reject";
  let vehicleId = "";
  let driverId = "";
  try {
    const vehicle = await makeVehicle({ status: "On Trip" });
    vehicleId = vehicle.id;
    const driver = await makeDriver();
    driverId = driver.id;

    const tripResult = await createTrip({ vehicleId, driverId });
    if (!tripResult.success) throw new Error(`createTrip failed: ${tripResult.errors.join(", ")}`);

    const dispatchResult = await dispatchTrip(tripResult.data.id);
    if (dispatchResult.success) throw new Error("Expected dispatch to fail but it succeeded.");

    const hasVehicleError = dispatchResult.errors.some(e =>
      e.toLowerCase().includes("on trip") || e.toLowerCase().includes("available")
    );
    if (!hasVehicleError) throw new Error(`Expected vehicle availability error, got: ${dispatchResult.errors.join("; ")}`);

    pass(n, desc);
  } catch (e: any) {
    fail(n, desc, e.message);
  } finally {
    await cleanVehicle(vehicleId);
    await cleanDriver(driverId);
  }
}

/**
 * TC-6: Complete a Dispatched trip → vehicle + driver → Available, trip → Completed.
 */
async function tc6() {
  const n = 6;
  const desc = "Complete a Dispatched trip → vehicle + driver → Available, trip → Completed";
  let vehicleId = "";
  let driverId = "";
  try {
    const vehicle = await makeVehicle();
    vehicleId = vehicle.id;
    const driver = await makeDriver();
    driverId = driver.id;

    const tripResult = await createTrip({ vehicleId, driverId });
    if (!tripResult.success) throw new Error(`createTrip failed: ${tripResult.errors.join(", ")}`);
    const tripId = tripResult.data.id;

    const dispatchResult = await dispatchTrip(tripId);
    if (!dispatchResult.success) throw new Error(`dispatchTrip failed: ${dispatchResult.errors.join(", ")}`);

    const completeResult = await completeTrip(tripId);
    if (!completeResult.success) throw new Error(`completeTrip failed: ${completeResult.errors.join(", ")}`);

    if (completeResult.data.status !== "Completed") throw new Error(`Expected trip Completed, got ${completeResult.data.status}`);
    if (completeResult.data.vehicle.status !== "Available") throw new Error(`Expected vehicle Available, got ${completeResult.data.vehicle.status}`);
    if (completeResult.data.driver.status !== "Available") throw new Error(`Expected driver Available, got ${completeResult.data.driver.status}`);

    pass(n, desc);
  } catch (e: any) {
    fail(n, desc, e.message);
  } finally {
    await cleanVehicle(vehicleId);
    await cleanDriver(driverId);
  }
}

/**
 * TC-7: Cancel a Dispatched trip → vehicle + driver → Available, trip → Cancelled.
 */
async function tc7() {
  const n = 7;
  const desc = "Cancel a Dispatched trip → vehicle + driver → Available, trip → Cancelled";
  let vehicleId = "";
  let driverId = "";
  try {
    const vehicle = await makeVehicle();
    vehicleId = vehicle.id;
    const driver = await makeDriver();
    driverId = driver.id;

    const tripResult = await createTrip({ vehicleId, driverId });
    if (!tripResult.success) throw new Error(`createTrip failed: ${tripResult.errors.join(", ")}`);
    const tripId = tripResult.data.id;

    const dispatchResult = await dispatchTrip(tripId);
    if (!dispatchResult.success) throw new Error(`dispatchTrip failed: ${dispatchResult.errors.join(", ")}`);

    const cancelResult = await cancelTrip(tripId);
    if (!cancelResult.success) throw new Error(`cancelTrip failed: ${cancelResult.errors.join(", ")}`);

    if (cancelResult.data.status !== "Cancelled") throw new Error(`Expected trip Cancelled, got ${cancelResult.data.status}`);
    if (cancelResult.data.vehicle.status !== "Available") throw new Error(`Expected vehicle Available, got ${cancelResult.data.vehicle.status}`);
    if (cancelResult.data.driver.status !== "Available") throw new Error(`Expected driver Available, got ${cancelResult.data.driver.status}`);

    pass(n, desc);
  } catch (e: any) {
    fail(n, desc, e.message);
  } finally {
    await cleanVehicle(vehicleId);
    await cleanDriver(driverId);
  }
}

/**
 * TC-8: Attempt to complete a Draft trip → reject as illegal transition.
 */
async function tc8() {
  const n = 8;
  const desc = "Complete a Draft (never-dispatched) trip → reject as illegal transition";
  let vehicleId = "";
  let driverId = "";
  try {
    const vehicle = await makeVehicle();
    vehicleId = vehicle.id;
    const driver = await makeDriver();
    driverId = driver.id;

    const tripResult = await createTrip({ vehicleId, driverId });
    if (!tripResult.success) throw new Error(`createTrip failed: ${tripResult.errors.join(", ")}`);

    const completeResult = await completeTrip(tripResult.data.id);
    if (completeResult.success) throw new Error("Expected completeTrip to fail on a Draft trip, but it succeeded.");

    const hasStatusError = completeResult.errors.some(e =>
      e.toLowerCase().includes("draft") || e.toLowerCase().includes("dispatched") || e.toLowerCase().includes("cannot")
    );
    if (!hasStatusError) throw new Error(`Expected illegal-transition error, got: ${completeResult.errors.join("; ")}`);

    pass(n, desc);
  } catch (e: any) {
    fail(n, desc, e.message);
  } finally {
    await cleanVehicle(vehicleId);
    await cleanDriver(driverId);
  }
}

/**
 * TC-9: Attempt to dispatch an already-Completed trip → reject.
 */
async function tc9() {
  const n = 9;
  const desc = "Dispatch an already-Completed trip → reject";
  let vehicleId = "";
  let driverId = "";
  try {
    const vehicle = await makeVehicle();
    vehicleId = vehicle.id;
    const driver = await makeDriver();
    driverId = driver.id;

    const tripResult = await createTrip({ vehicleId, driverId });
    if (!tripResult.success) throw new Error(`createTrip failed: ${tripResult.errors.join(", ")}`);
    const tripId = tripResult.data.id;

    const d = await dispatchTrip(tripId);
    if (!d.success) throw new Error(`dispatchTrip failed: ${d.errors.join(", ")}`);
    const c = await completeTrip(tripId);
    if (!c.success) throw new Error(`completeTrip failed: ${c.errors.join(", ")}`);

    const dispatchResult = await dispatchTrip(tripId);
    if (dispatchResult.success) throw new Error("Expected dispatchTrip to fail on a Completed trip, but it succeeded.");

    const hasStatusError = dispatchResult.errors.some(e =>
      e.toLowerCase().includes("completed") || e.toLowerCase().includes("draft") || e.toLowerCase().includes("already")
    );
    if (!hasStatusError) throw new Error(`Expected completed/already error, got: ${dispatchResult.errors.join("; ")}`);

    pass(n, desc);
  } catch (e: any) {
    fail(n, desc, e.message);
  } finally {
    await cleanVehicle(vehicleId);
    await cleanDriver(driverId);
  }
}

/**
 * TC-10: Cancel a Draft trip → trip → Cancelled; vehicle/driver status untouched.
 * (Not redundant — verifies the no-op path on vehicle/driver is actually no-op.)
 */
async function tc10() {
  const n = 10;
  const desc = "Cancel a Draft trip → trip Cancelled, vehicle/driver status untouched (no-op)";
  let vehicleId = "";
  let driverId = "";
  try {
    const vehicle = await makeVehicle();
    vehicleId = vehicle.id;
    const driver = await makeDriver();
    driverId = driver.id;

    const vehicleStatusBefore = vehicle.status;       // "Available"
    const driverStatusBefore = driver.status;         // "Available"

    const tripResult = await createTrip({ vehicleId, driverId });
    if (!tripResult.success) throw new Error(`createTrip failed: ${tripResult.errors.join(", ")}`);

    const cancelResult = await cancelTrip(tripResult.data.id);
    if (!cancelResult.success) throw new Error(`cancelTrip failed: ${cancelResult.errors.join(", ")}`);

    if (cancelResult.data.status !== "Cancelled") throw new Error(`Expected trip Cancelled, got ${cancelResult.data.status}`);

    // Verify vehicle/driver status was NOT touched.
    if (cancelResult.data.vehicle.status !== vehicleStatusBefore) {
      throw new Error(`Vehicle status changed unexpectedly: ${vehicleStatusBefore} → ${cancelResult.data.vehicle.status}`);
    }
    if (cancelResult.data.driver.status !== driverStatusBefore) {
      throw new Error(`Driver status changed unexpectedly: ${driverStatusBefore} → ${cancelResult.data.driver.status}`);
    }

    pass(n, desc);
  } catch (e: any) {
    fail(n, desc, e.message);
  } finally {
    await cleanVehicle(vehicleId);
    await cleanDriver(driverId);
  }
}

/**
 * TC-11: Dispatch with multiple simultaneous violations (expired license AND cargo over capacity)
 *        → validateDispatch returns BOTH errors, not just one.
 * (Not redundant — specifically tests that validation is non-short-circuiting.)
 */
async function tc11() {
  const n = 11;
  const desc = "Multiple violations (expired license + cargo > capacity) → all errors returned together";
  let vehicleId = "";
  let driverId = "";
  try {
    const vehicle = await makeVehicle({ maxLoadCapacity: 100 });
    vehicleId = vehicle.id;
    const driver = await makeDriver({ licenseExpiry: new Date("2019-06-01") }); // expired
    driverId = driver.id;

    const tripResult = await createTrip({ vehicleId, driverId, cargoWeight: 9999 }); // exceeds 100
    if (!tripResult.success) throw new Error(`createTrip failed: ${tripResult.errors.join(", ")}`);

    const dispatchResult = await dispatchTrip(tripResult.data.id);
    if (dispatchResult.success) throw new Error("Expected dispatch to fail but it succeeded.");

    const hasCargoError = dispatchResult.errors.some(e =>
      e.toLowerCase().includes("cargo") || e.toLowerCase().includes("capacity")
    );
    const hasLicenseError = dispatchResult.errors.some(e =>
      e.toLowerCase().includes("expired") || e.toLowerCase().includes("license")
    );

    if (!hasCargoError) throw new Error(`Missing cargo error. Got: ${dispatchResult.errors.join("; ")}`);
    if (!hasLicenseError) throw new Error(`Missing license error. Got: ${dispatchResult.errors.join("; ")}`);
    if (dispatchResult.errors.length < 2) throw new Error(`Expected ≥2 errors, got ${dispatchResult.errors.length}: ${dispatchResult.errors.join("; ")}`);

    pass(n, desc);
  } catch (e: any) {
    fail(n, desc, e.message);
  } finally {
    await cleanVehicle(vehicleId);
    await cleanDriver(driverId);
  }
}

/**
 * TC-12: updateDriver with a status field in the payload → rejected with an error; does NOT silently succeed.
 * (Not redundant — guards against rogue callers/routes bypassing the status engine.)
 */
async function tc12() {
  const n = 12;
  const desc = "updateDriver with status in payload → rejected, does not silently succeed";
  let driverId = "";
  try {
    const driver = await makeDriver();
    driverId = driver.id;

    let threw = false;
    let errorMessage = "";
    try {
      // Cast through `as any` to simulate a caller ignoring the TypeScript `status?: never` guard.
      await updateDriver(driver.id, { status: "Suspended" } as any);
    } catch (e: any) {
      threw = true;
      errorMessage = e.message;
    }

    if (!threw) throw new Error("Expected updateDriver to throw when status is provided, but it did not.");

    const mentionsStatus = errorMessage.toLowerCase().includes("status");
    if (!mentionsStatus) throw new Error(`Expected error to mention 'status', got: "${errorMessage}"`);

    // Confirm the driver's actual status is still "Available" (no silent mutation).
    const dbDriver = await prisma.driver.findUniqueOrThrow({ where: { id: driverId } });
    if (dbDriver.status !== "Available") throw new Error(`Driver status was mutated despite the throw! Got: ${dbDriver.status}`);

    pass(n, desc);
  } catch (e: any) {
    fail(n, desc, e.message);
  } finally {
    // No trips were created — safe to delete driver directly.
    if (driverId) await prisma.driver.delete({ where: { id: driverId } }).catch(() => {});
  }
}

/**
 * TC-13: listAvailableVehiclesForDispatch / listAvailableDriversForDispatch never return
 *        Retired/In Shop vehicles or Suspended/expired-license drivers.
 * (Not redundant — validates the query filter, not the dispatch guard.)
 */
async function tc13() {
  const n = 13;
  const desc = "listAvailableVehicles/Drivers never return ineligible records";
  const createdVehicleIds: string[] = [];
  const createdDriverIds: string[] = [];
  try {
    // Create ineligible vehicles.
    const retired = await makeVehicle({ status: "Retired", regSuffix: "RET01" });
    const inShop = await makeVehicle({ status: "In Shop", regSuffix: "ISH01" });
    // Create one eligible vehicle to confirm the list is not simply empty.
    const available = await makeVehicle({ regSuffix: "AVL01" });
    createdVehicleIds.push(retired.id, inShop.id, available.id);

    // Create ineligible drivers.
    const suspended = await makeDriver({ status: "Suspended" });
    const expired = await makeDriver({ licenseExpiry: new Date("2018-01-01") });
    // Create one eligible driver.
    const eligibleDriver = await makeDriver();
    createdDriverIds.push(suspended.id, expired.id, eligibleDriver.id);

    const vehicleList = await listAvailableVehiclesForDispatch();
    const driverList = await listAvailableDriversForDispatch();

    // Check ineligible vehicles do not appear.
    const vehicleIds = vehicleList.map(v => v.id);
    if (vehicleIds.includes(retired.id)) throw new Error("Retired vehicle appeared in available list.");
    if (vehicleIds.includes(inShop.id)) throw new Error("In Shop vehicle appeared in available list.");
    if (!vehicleIds.includes(available.id)) throw new Error("Available vehicle did NOT appear in list.");

    // Check ineligible drivers do not appear.
    const driverIds = driverList.map(d => d.id);
    if (driverIds.includes(suspended.id)) throw new Error("Suspended driver appeared in available list.");
    if (driverIds.includes(expired.id)) throw new Error("Expired-license driver appeared in available list.");
    if (!driverIds.includes(eligibleDriver.id)) throw new Error("Eligible driver did NOT appear in list.");

    pass(n, desc);
  } catch (e: any) {
    fail(n, desc, e.message);
  } finally {
    for (const id of createdVehicleIds) await prisma.vehicle.delete({ where: { id } }).catch(() => {});
    for (const id of createdDriverIds) await prisma.driver.delete({ where: { id } }).catch(() => {});
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("═════════════════════════════════════════════════════════════");
  console.log("  TransitOps — Section 9: Driver & Trip Lifecycle Tests");
  console.log("  Running against live DB  |  lib/ functions directly");
  console.log("═════════════════════════════════════════════════════════════\n");

  // Run tests sequentially so fixture cleanup doesn't interleave.
  await tc1();
  await tc2();
  await tc3();
  await tc4();
  await tc5();
  await tc6();
  await tc7();
  await tc8();
  await tc9();
  await tc10();
  await tc11();
  await tc12();
  await tc13();

  console.log("\n─────────────────────────────────────────────────────────────");
  console.log(`  SUMMARY: ${totalPassed} passed, ${totalFailed} failed`);
  if (failedTests.length > 0) {
    console.log(`  FAILED TEST NUMBERS: ${failedTests.map(n => `TC-${n}`).join(", ")}`);
  }
  console.log("─────────────────────────────────────────────────────────────\n");

  await prisma.$disconnect();
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("\n💥 Unhandled error in test runner:", err);
  await prisma.$disconnect();
  process.exit(1);
});
