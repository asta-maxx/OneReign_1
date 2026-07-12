# ADR-001: Centralised Status-Transition Engine for Vehicle and Driver Status

| Field       | Value                          |
|-------------|--------------------------------|
| **Status**  | Accepted                       |
| **Date**    | 2026-07-12                     |
| **Authors** | Person 2 (Driver/Trip module)  |
| **Affects** | Person 3 (Maintenance module), Person 4 (Dashboard/Analytics) |

---

## Context

TransitOps has two modules — Trip Lifecycle (Person 2) and Maintenance (Person 3) — that both need to
change `Vehicle.status` and `Driver.status`. Without coordination, each module would write its own
`prisma.vehicle.update({ data: { status: … } })` call with its own idea of what transitions are legal.
This creates three concrete risks:

1. **Silent state corruption.** A Maintenance module that moves a vehicle to `"In Shop"` without checking
   the transition map could overwrite an `"On Trip"` status, leaving the Trip module in an inconsistent
   state at demo time.
2. **Race conditions.** Duplicate status-update paths cannot be kept in sync under time pressure.
3. **No enforcement of terminal states.** `"Retired"` vehicles must never receive further transitions.
   If each module implements this separately, one of them will miss it.

Section 9 of the master sheet lists shared-status-transition drift as the **#1 risk** in the entire build.

---

## Decision

All status mutations for `Vehicle` and `Driver` go through two exported functions in
`lib/statusTransitions.ts`:

```ts
updateVehicleStatus(tx: Prisma.TransactionClient, vehicleId: string, newStatus: VehicleStatus): Promise<Vehicle>
updateDriverStatus(tx: Prisma.TransactionClient, driverId: string,  newStatus: DriverStatus):  Promise<Driver>
```

**Rules that follow from this decision:**

1. No file outside `lib/statusTransitions.ts` may call `prisma.vehicle.update({ data: { status: … } })`
   or `prisma.driver.update({ data: { status: … } })` directly.
2. Both functions require a Prisma **transaction client** (`tx`) as the first argument. Callers must
   wrap their own call in `prisma.$transaction(async (tx) => { … })` and pass `tx` through — the global
   `prisma` singleton is not accepted.
3. Each function validates the requested transition against an adjacency map before touching the DB.
   An illegal transition throws `"Illegal vehicle transition: <from> -> <to>"` (or driver equivalent).
4. `"Retired"` is a terminal state with no outgoing transitions. It can never be overridden.
5. Person 3's Maintenance module imports and calls these functions; it does **not** reimplement them.

**Adjacency maps (canonical source of truth):**

```
VehicleStatus: Available → [On Trip, In Shop, Retired]
               On Trip   → [Available, In Shop]
               In Shop   → [Available, Retired]
               Retired   → [] (terminal)

DriverStatus:  Available → [On Trip, Off Duty, Suspended]
               On Trip   → [Available]
               Off Duty  → [Available, Suspended]
               Suspended → [Available]
```

---

## Alternatives Considered

| Option | Rejected because |
|--------|-----------------|
| Each module writes its own `prisma.vehicle.update` | No shared guard → drift and race conditions. |
| Prisma middleware intercept | Adds invisible magic; harder to debug under time pressure. |
| Database-level triggers | Out of scope for a hackathon Postgres instance; hard to version-control. |
| Enum column in schema | Prisma enum identifiers cannot contain spaces (`"On Trip"`), which is required by the frontend contract. |

---

## Consequences

**Positive:**
- Single point of enforcement for all status guard logic. Person 3 cannot accidentally create an illegal
  state because the engine will throw before any write reaches the DB.
- Atomic by design — the `tx` requirement means status changes and related writes (trip update,
  maintenance log create) always commit or roll back together.
- Terminal state (`Retired`) is impossible to bypass from any module.

**Negative / trade-offs:**
- Person 3 must import from `lib/statusTransitions.ts` and wrap calls in a `prisma.$transaction`. A
  minor friction, but unavoidable given the design.
- The transaction client API (`Prisma.TransactionClient`) must be typed correctly. Passing the global
  singleton compiles but will fail at runtime inside a transaction.

**Verification (Hour 5:00 integration pass):**
See `docs/integration_checklist.md` for the exact grep commands and smoke test to confirm Person 3's
code is calling the shared engine and not duplicating it.

---

## Files Introduced / Modified

| File | Change |
|------|--------|
| `lib/statusTransitions.ts` | **Created.** Exports `VehicleStatus`, `DriverStatus`, `updateVehicleStatus`, `updateDriverStatus`. |
| `lib/trip.ts` | Imports and calls both functions inside `prisma.$transaction` for dispatch, complete, and cancel operations. |
| `docs/operational-module.md` | Documents that Person 3's module imports from `lib/statusTransitions.ts` and never writes status directly. |
