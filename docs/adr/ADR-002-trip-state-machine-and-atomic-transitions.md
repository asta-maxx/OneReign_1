# ADR-002: Trip Lifecycle State Machine and Atomic Multi-Record Mutations

| Field       | Value                         |
|-------------|-------------------------------|
| **Status**  | Accepted                      |
| **Date**    | 2026-07-12                    |
| **Authors** | Person 2 (Driver/Trip module) |
| **Affects** | Person 4 (Dashboard KPIs that read Trip.status) |

---

## Context

A Trip touches three records simultaneously when its status changes:

- `Trip.status`
- `Vehicle.status`
- `Driver.status`

If any of these writes succeeds but the others fail, the system lands in an inconsistent state
(e.g. vehicle is `"On Trip"` but the trip record is still `"Draft"`). This is a hard correctness
requirement, not a nice-to-have.

Additionally, there are four trip states (`Draft`, `Dispatched`, `Completed`, `Cancelled`) and
several lifecycle functions (`createTrip`, `dispatchTrip`, `completeTrip`, `cancelTrip`). Without an
explicit state machine, callers can attempt nonsensical transitions (e.g. completing a draft trip)
and the system has no consistent way to reject them.

---

## Decision

### 1. Four-state machine with explicit legal transitions

```
Draft ──────────────────────────────────────────► Cancelled
  │                                               (vehicle/driver untouched)
  │ dispatchTrip()
  ▼
Dispatched ──► Completed    Dispatched ──────────► Cancelled
(vehicle +     (vehicle +   (vehicle + driver
 driver →       driver →     → Available)
 On Trip)       Available)
```

**Illegal transitions (rejected before any DB write):**
- `dispatchTrip` on a `Dispatched` / `Completed` / `Cancelled` trip.
- `completeTrip` on a `Draft` / `Completed` / `Cancelled` trip.
- `cancelTrip` on a `Completed` / `Cancelled` trip (already terminal).

### 2. All multi-record mutations wrapped in `prisma.$transaction`

Every operation that touches more than one record is wrapped in a single `prisma.$transaction`.
No partial writes are possible:

```ts
// dispatchTrip (simplified)
await prisma.$transaction(async (tx) => {
  await updateVehicleStatus(tx, trip.vehicleId, "On Trip");
  await updateDriverStatus(tx, trip.driverId,  "On Trip");
  await tx.trip.update({ where: { id: tripId }, data: { status: "Dispatched" } });
});
```

### 3. `cancelTrip` has two paths

| Starting state | Vehicle / Driver | Trip |
|----------------|-----------------|------|
| `Draft`        | **No change** (never committed to the trip) | `→ Cancelled` |
| `Dispatched`   | `→ Available` (via shared engine, inside `$transaction`) | `→ Cancelled` |

The Draft-cancel path only updates the trip record — it does NOT call `updateVehicleStatus` /
`updateDriverStatus`. This is intentional and tested explicitly (TC-10 in the Section 9 test script).

### 4. `TripStatus` is a typed literal union, not a Prisma enum

```ts
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";
```

Prisma enum identifiers cannot contain spaces. The schema stores `status` as `String`, and the
`TripStatus` type guards correct values at compile time. An internal helper `asTripStatus()` narrows
raw DB strings at runtime and throws if an unrecognised value is encountered.

---

## Alternatives Considered

| Option | Rejected because |
|--------|-----------------|
| Update trip/vehicle/driver in separate `await` calls | Not atomic; any failure leaves partial state. |
| Try/catch around each `await` and manual rollback | Fragile; requires reimplementing Postgres transaction semantics in TypeScript. |
| Allow `dispatchTrip` to re-dispatch an already-Dispatched trip | Idempotency is appealing but would silently skip the guard pipeline, masking bugs. |
| Prisma enum for `TripStatus` | Enum identifiers cannot contain spaces; type alias achieves the same safety. |

---

## Consequences

**Positive:**
- Impossible to end up with a vehicle `On Trip` while the trip is still `Draft`, or vice versa.
- All illegal transitions are caught before any DB write (validate-then-write pattern in `validateDispatch`).
- The Draft-cancel no-op on vehicle/driver is explicitly verified in the test suite (TC-10), so it
  cannot regress silently.

**Negative / trade-offs:**
- `prisma.$transaction` has a default 5-second timeout. Under normal DB load this is never a problem,
  but if the DB is under heavy contention during the demo the transaction could time out. Mitigation:
  keep the transaction bodies thin (no network calls inside).
- Person 4's dashboard KPI queries must filter on exact string values (`"Completed"`, `"Dispatched"`,
  etc.). Confirm these spellings with Person 4 before the integration pass.

---

## Files Introduced / Modified

| File | Change |
|------|--------|
| `lib/trip.ts` | **Created.** Implements `createTrip`, `dispatchTrip`, `completeTrip`, `cancelTrip`, `validateDispatch`, `listTrips`, `listAvailableVehiclesForDispatch`, `listAvailableDriversForDispatch`. |
| `app/api/trips/route.ts` | Thin route handler: `GET` (list) + `POST` (create). |
| `app/api/trips/[id]/route.ts` | Thin route handler: `GET` by ID. |
| `app/api/trips/[id]/dispatch/route.ts` | Delegates to `dispatchTrip(id)`. |
| `app/api/trips/[id]/complete/route.ts` | Delegates to `completeTrip(id)`. |
| `app/api/trips/[id]/cancel/route.ts` | Delegates to `cancelTrip(id)`. |
