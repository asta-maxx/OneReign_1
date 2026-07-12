# Person 2 — Driver & Trip Lifecycle Lead
## Complete Process Document | TransitOps Hackathon

---

## 1. Role Summary

**Owns:**
- Driver Management (CRUD, license expiry check, safety score, status)
- Trip Management (create → dispatch → complete → cancel, full validation)
- The **shared status-transition function** consumed by Trip module (you) AND Maintenance module (Person 3)

**Why this matters:** Section 9 of the master sheet flags shared status-transition drift as the **#1 risk** in the entire build. If Person 3 writes their own copy of vehicle/driver status logic instead of calling yours, the demo breaks with race conditions right before judging.

**Tools:** Claude for the entire validation + status-transition engine. Antigravity for trip creation UI.

---

## 2. Data Model — Your Entities

From the locked schema (Section 4 of master sheet):

```
Driver (id, name, licenseNumber, licenseCategory, licenseExpiry, contactNumber, safetyScore, status)
Trip   (id, source, destination, vehicleId, driverId, cargoWeight, plannedDistance, status, createdAt)
```

**Status enums (exact strings — must match across all 4 people's code):**

| Entity | Enum values |
|---|---|
| Vehicle status | `Available`, `On Trip`, `In Shop`, `Retired` |
| Driver status | `Available`, `On Trip`, `Off Duty`, `Suspended` |
| Trip status | `Draft`, `Dispatched`, `Completed`, `Cancelled` |

⚠️ Confirm these exact spellings/casing with Person 1 (owns Vehicle schema) during the Hour 0 group session. A mismatch here silently breaks Person 3's integration.

---

## 3. Mandatory Business Rules (Section 3 of master sheet)

These are what judges will actually test — treat as your acceptance criteria:

- Drivers with expired license or `Suspended` status cannot be assigned
- On Trip vehicle/driver cannot be assigned to another trip
- Cargo weight must not exceed vehicle's `maxLoadCapacity`
- Dispatch → vehicle + driver → `On Trip`
- Complete → vehicle + driver → `Available`
- Cancel dispatched trip → vehicle + driver → `Available`
- Retired / In Shop vehicles never appear in dispatch selection

---

## 4. Status Transition Rules (your core state machine)

| Action | Vehicle | Driver | Trip |
|---|---|---|---|
| Dispatch | → `On Trip` | → `On Trip` | → `Dispatched` |
| Complete | → `Available` | → `Available` | → `Completed` |
| Cancel (from Dispatched) | → `Available` | → `Available` | → `Cancelled` |
| Cancel (from Draft) | *no change* | *no change* | → `Cancelled` |

**Guard conditions before dispatch is allowed:**
1. Vehicle status is `Available` (not `In Shop` or `Retired`)
2. Driver status is `Available` (not `Suspended`, not already `On Trip`)
3. `driver.licenseExpiry` is in the future
4. `trip.cargoWeight <= vehicle.maxLoadCapacity`

---

## 5. Design Rule (non-negotiable)

> All status transitions go through ONE shared function — `updateVehicleStatus()` / `updateDriverStatus()` — called by Trip module AND Maintenance module. Never duplicate this logic.

You build it once. Person 3 imports and calls it — they do not reimplement it.

---

## 6. Build Order (your 1:15–5:00 window)

### Step 1 (~20 min): Shared status-transition functions
Build these first, standalone, before anything else — the team is blocked on this.

```ts
// lib/statusTransitions.ts
type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";

const vehicleTransitions: Record<VehicleStatus, VehicleStatus[]> = {
  Available: ["On Trip", "In Shop", "Retired"],
  "On Trip": ["Available", "In Shop"],
  "In Shop": ["Available", "Retired"],
  Retired: [],
};

const driverTransitions: Record<DriverStatus, DriverStatus[]> = {
  Available: ["On Trip", "Off Duty", "Suspended"],
  "On Trip": ["Available"],
  "Off Duty": ["Available", "Suspended"],
  Suspended: ["Available"],
};

export async function updateVehicleStatus(tx: PrismaTx, vehicleId: string, newStatus: VehicleStatus) {
  const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
  if (!vehicleTransitions[vehicle.status].includes(newStatus)) {
    throw new Error(`Illegal vehicle transition: ${vehicle.status} -> ${newStatus}`);
  }
  return tx.vehicle.update({ where: { id: vehicleId }, data: { status: newStatus } });
}

export async function updateDriverStatus(tx: PrismaTx, driverId: string, newStatus: DriverStatus) {
  const driver = await tx.driver.findUniqueOrThrow({ where: { id: driverId } });
  if (!driverTransitions[driver.status].includes(newStatus)) {
    throw new Error(`Illegal driver transition: ${driver.status} -> ${newStatus}`);
  }
  return tx.driver.update({ where: { id: driverId }, data: { status: newStatus } });
}
```

**Action:** Push this file to the shared repo immediately with a one-line usage comment so Person 3 doesn't have to ask how to call it.

### Step 2 (~30 min): Driver Management CRUD
Standard CRUD. License expiry is *derived*, not stored as a boolean:

```ts
const isLicenseExpired = driver.licenseExpiry < new Date();
```

### Step 3 (~90 min): Trip validation engine
Build as a guard pipeline that runs before any transition:

```ts
async function validateDispatch(tripId: string) {
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId }, include: { vehicle: true, driver: true }
  });

  const errors: string[] = [];
  if (trip.vehicle.status !== "Available") errors.push("Vehicle not available");
  if (trip.driver.status !== "Available") errors.push("Driver not available");
  if (trip.driver.licenseExpiry < new Date()) errors.push("Driver license expired");
  if (trip.cargoWeight > trip.vehicle.maxLoadCapacity) errors.push("Cargo exceeds capacity");

  return errors.length ? { success: false, errors } : { success: true };
}
```

`dispatchTrip()` → validate → if valid, wrap in a Prisma transaction: update vehicle status, update driver status, update trip status — all atomic. Mirror this pattern for `completeTrip()` and `cancelTrip()`.

### Step 4 (~40 min): Wire API routes
Keep route handlers thin — they call validation + transition functions from `lib/`. No business logic in the route file itself.

### Step 5 (remaining time): Hand off + test
- Hand off to Antigravity for trip creation UI once API responses are stable and predictable
- Write manual test cases for every guard condition (see Section 9 below)

---

## 7. Hour-by-Hour Schedule (your slice)

| Time | Your activity |
|---|---|
| 0:00–0:30 | Group schema session — confirm Driver/Trip fields + enum strings with the team |
| 0:30–1:15 | Not blocked — stub Driver/Trip pages against agreed schema while Person 1 builds auth |
| 1:15–5:00 | Main build window: Steps 1–5 above |
| 5:00–6:00 | **Integration pass** — verify Person 3 is calling your shared function, not duplicating it |
| 6:00–7:00 | Free capacity — support Person 4 if Trip/Driver data feeding the dashboard has issues |
| 7:00–7:30 | Full demo rehearsal — your dispatch/cancel/complete flow is the centerpiece of the 3-minute demo script |

---

## 8. Coordination Checklist

- [ ] Confirm exact Vehicle/Driver/Trip enum strings with Person 1 at Hour 0
- [ ] Push `statusTransitions.ts` to shared repo before Person 3 needs it (target: before Hour 2)
- [ ] Confirm Person 3's Maintenance module imports your function — don't wait until Hour 5 to check
- [ ] Confirm your API error responses are clean JSON (not stack traces) before handing off to Antigravity for UI
- [ ] Confirm Trip/Driver status field names match what Person 4 expects for dashboard KPIs

---

## 9. Test Cases to Run Before Integration Pass (Hour 5:00)

Cover every guard condition explicitly — this is what judges will probe live:

1. Dispatch trip with valid vehicle + driver + cargo within capacity → should succeed
2. Dispatch trip with cargo exceeding `maxLoadCapacity` → should reject
3. Dispatch trip with a `Suspended` driver → should reject
4. Dispatch trip with an expired license → should reject
5. Dispatch trip with a vehicle already `On Trip` → should reject
6. Complete a `Dispatched` trip → vehicle + driver flip back to `Available`
7. Cancel a `Dispatched` trip → vehicle + driver flip back to `Available`
8. Attempt to complete a `Draft` (never-dispatched) trip → should reject (illegal transition)
9. Attempt to dispatch an already-`Completed` trip → should reject

---

## 10. Demo Script — Your Part (Section 7 of master sheet)

Your logic drives steps 2–4 of the 3-minute demo:

1. Register Van 05 (capacity 500kg), register driver Alex → both show `Available` *(Person 1's registry, but feeds your validation)*
2. **Create trip, cargo = 450kg → dispatch succeeds.** Live improvisation: try 600kg on a second trip → **rejected on the spot** *(your guard logic, live)*
3. **Vehicle + Driver visibly flip to `On Trip`** on dashboard *(your transition function output)*
4. **Complete trip (enter odometer + fuel consumed) → both flip back to `Available`** *(your completeTrip() function)*

Rehearse this exact sequence at 7:00–7:30 so there are no surprises live.

---

## 11. Git Workflow Reminder

- One branch per person, merge every ~90 min
- Never force-push, hard-reset, or rebase-abort without explicit instruction
- Before any push: `git fetch origin` → `git pull --rebase origin main` → resolve conflicts only if told to
- Stage only files related to the completed task — don't sweep in unrelated changes
- Commit messages: `feat: add status-transition engine`, `feat: add trip dispatch validation`, etc.

---

## 12. Key Risk to Watch (Section 9 of master sheet)

> Shared status-transition logic drift. If Trip and Maintenance modules each write their own vehicle/driver status update code instead of calling one shared function, you'll get race conditions and inconsistent states right before the demo.

**You own the fix:** ship the function early, communicate its contract clearly, and verify Person 3's actual usage during the Hour 5:00–6:00 integration pass — don't assume it happened.
