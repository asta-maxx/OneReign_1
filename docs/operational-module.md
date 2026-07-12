# Maintenance & Fuel/Expense Module — contract, assumptions & open questions

This module was built **before** the shared Prisma schema and the
`updateVehicleStatus` engine landed in the repo. It is written against the
documented interface (task brief + `README.md`) and must be reconciled with the
teammate's real schema once it is pushed. This file is the reconciliation
checklist.

## Files owned by this module (safe to review now)

| File | Purpose |
| --- | --- |
| `lib/operationalCost.ts` | `getOperationalCost()` + `getFuelEfficiency()` — the ROI-feeding aggregation. |
| `lib/apiHelpers.ts` | Shared JSON-error + validation helpers. |
| `app/api/maintenance/route.ts` | `POST` create, `GET ?vehicleId=` list. |
| `app/api/maintenance/[id]/close/route.ts` | `PATCH` close. |
| `app/api/fuel-logs/route.ts` | `POST` create, `GET ?vehicleId=` list. |
| `app/api/expenses/route.ts` | `POST` create, `GET ?vehicleId=` list. |
| `app/api/vehicles/[id]/operational-cost/route.ts` | `GET` cost + efficiency. |

## Foundation files this module deliberately does NOT create (teammate owns them)

To avoid merge conflicts with the incoming foundation, this module only
**imports** the following — it does not define them:

- `@/lib/prisma` → the shared `PrismaClient` instance (`export const prisma`).
- `@/lib/vehicleStatus` → `export async function updateVehicleStatus(vehicleId: string, newStatus: string): Promise<...>`.
  Per the brief, this is the single centralised status engine; this module never
  writes `Vehicle.status` directly.
- `prisma/schema.prisma`, `package.json`, `tsconfig.json` (incl. the `@/*` path
  alias), Next.js app scaffolding.

Until those land, these files will not type-check or run — that is expected.

## Schema assumptions to verify against the real schema

| Model | Fields assumed | Notes |
| --- | --- | --- |
| `Vehicle` | `id`, `status` ("Available"/"On Trip"/"In Shop"/"Retired") | Status values must match the Prisma enum exactly (spacing/casing). |
| `MaintenanceLog` | `id`, `vehicleId`, `description`, `status` ("Active"/"Closed"), `closedAt: DateTime?`, `createdAt: DateTime` | `status` assumed to be an enum with values `Active`/`Closed`. |
| `FuelLog` | `id`, `vehicleId`, `liters: Float`, `cost`, `date: DateTime` | `cost` may be `Decimal` — handled (see below). |
| `Expense` | `id`, `vehicleId`, `type` ("toll"/"maintenance"/"other"), `amount`, `date: DateTime` | `type` assumed enum; string comparison used in the aggregate filter. |
| `Trip` | `id`, `vehicleId`, `status` ("Completed" among others), `distance: Float` | **`distance` field name + unit are a guess** — could be `distanceKm`, or derived from odometer deltas. Confirm. |

**Money type / precision:** `cost`/`amount` may be Prisma `Decimal`. The
aggregation normalises via `Number(...)` so summation is correct for both
`number` and `Decimal`. For financial exactness we recommend the columns be
`Decimal` in the schema; if extreme precision is required at the API boundary,
we can return the `Decimal` string instead of a JS number.

## Cost / efficiency formulas (for quick reviewer verification)

```
fuelCost        = Σ FuelLog.cost                    (all fuel logs for the vehicle)
maintenanceCost = Σ Expense.amount WHERE type="maintenance"
totalCost       = fuelCost + maintenanceCost

fuelEfficiency  = totalDistance / totalLitersUsed
totalDistance   = Σ Trip.distance WHERE status="Completed"
totalLitersUsed = Σ FuelLog.liters
```

## Edge cases handled

- **Zero fuel logs / divide-by-zero:** `getFuelEfficiency` returns
  `fuelEfficiency: null` when `totalLitersUsed === 0` (never `Infinity`/`NaN`).
- **No matching rows:** Prisma `_sum` returns `null`; normalised to `0`.
- **Double-close:** closing an already-`Closed` record returns `409`.
- **Retired guard on create:** creating maintenance for a `Retired` vehicle → `409`.
- **Never override Retired on close:** the `Available` transition is skipped when
  the vehicle is currently `Retired`.

## OPEN QUESTIONS — need your decision

1. **`cost` on `MaintenanceLog`?** Right now maintenance cost = only
   `Expense(type="maintenance")`. If you want per-log maintenance cost captured
   directly on `MaintenanceLog`, add a `cost` column — but then we must choose a
   **single source of truth** (e.g. auto-create a maintenance `Expense` when a
   log is closed) so cost isn't double-counted in `totalCost`. **Which model
   owns maintenance cost?**

2. **Multiple open maintenance records per vehicle — prevent it?** The schema (as
   assumed) does not constrain this. This module currently **rejects a second
   `Active` record** for the same vehicle (`409`) as the safe default. Recommend
   also enforcing at the DB level with a partial unique index:
   `@@unique` won't work directly for "one Active row"; use a raw partial index
   `CREATE UNIQUE INDEX ... ON "MaintenanceLog"("vehicleId") WHERE status = 'Active'`.
   **Keep this restriction, or allow multiple open records?**

3. **Concurrency — does `updateVehicleStatus` need a tx/lock?** **Yes, it should.**
   Two hazards:
   - *Create-maintenance vs. trip-dispatch race:* both read `Vehicle.status =
     "Available"`, then one dispatches while the other sends it to the shop. My
     precondition reads are only advisory. The authoritative guard must be an
     **atomic conditional update** inside `updateVehicleStatus`
     (`UPDATE ... WHERE id = ? AND status IN (<allowed-from>)`) and/or a
     `SELECT ... FOR UPDATE` row lock.
   - *Close overriding Retired:* the "skip if Retired" check is a read-then-write;
     if a vehicle is retired between the read and the write, we could wrongly set
     it `Available`. `updateVehicleStatus` should refuse to move a `Retired`
     vehicle regardless of caller.
   - Ideally `updateVehicleStatus` accepts an optional Prisma transaction client
     so the record write and the status flip commit atomically. Its current
     documented signature `(vehicleId, newStatus)` doesn't allow that, so the
     status flip happens just after this module's transaction commits — a small
     inconsistency window. **Can the shared engine (a) be atomic/conditional and
     (b) optionally accept a tx client?**
