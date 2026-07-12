# Maintenance & Fuel/Expense Module

Backend for the Maintenance, Fuel, Expense and Operational-Cost features. Data
shapes are aligned with the frontend contract in `lib/types.ts` and its API
client `lib/api/maintenanceClient.ts` (which flips from mock to these routes when
`USE_MOCK_API = false`).

## Files

| File | Purpose |
| --- | --- |
| `prisma/schema.prisma` | Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense. |
| `prisma/seed.ts` | Demo fleet mirroring the UI mock data. |
| `lib/prisma.ts` | Shared `PrismaClient` singleton. |
| `lib/statusTransitions.ts` | **Teammate-owned** (Person 2) status engine — the only writer of `Vehicle.status`. This module imports it; it does not own it. |
| `lib/operationalCost.ts` | `getOperationalCost()` + `getFuelEfficiency()`. |
| `lib/roi.ts` | `getVehicleROI()` (revenue vs. cost vs. capital). |
| `lib/calc.ts` | Pure, DB-free formula helpers (single source of truth). |
| `lib/calc.test.ts` | Vitest unit tests for the formulas. |
| `lib/apiHelpers.ts` | Shared JSON-error + validation helpers. |
| `app/api/vehicles/route.ts` | `GET` list (`?status=`, `?type=`), `POST` create. |
| `app/api/vehicles/[id]/retire/route.ts` | `POST` retire (via status engine). |
| `app/api/vehicles/[id]/operational-cost/route.ts` | `GET` cost + efficiency. |
| `app/api/vehicles/[id]/roi/route.ts` | `GET` ROI. |
| `app/api/analytics/route.ts` | `GET` fleet-wide KPIs. |
| `app/api/maintenance/route.ts` | `POST` create, `GET ?vehicleId=` list. |
| `app/api/maintenance/[id]/close/route.ts` | `PATCH` close. |
| `app/api/fuel-logs/route.ts` | `POST` create, `GET ?vehicleId=` list. |
| `app/api/expenses/route.ts` | `POST` create, `GET ?vehicleId=` list. |

## Setup

```bash
docker compose up -d        # local PostgreSQL
cp .env.example .env
npx prisma migrate dev      # create tables
npx prisma db seed          # load demo fleet
npm run dev
npm test                    # run formula unit tests (vitest)
```

## Cost / efficiency / ROI formulas (verify quickly)

```
fuelCost        = Σ FuelLog.cost                       (all fuel logs for vehicle)
maintenanceCost = Σ Expense.amount WHERE type="Maintenance"
totalCost       = fuelCost + maintenanceCost

fuelEfficiency  = totalDistance / totalLitersUsed      (null when litres = 0)
totalDistance   = Σ Trip.distance WHERE status="Completed"
totalLitersUsed = Σ FuelLog.liters

totalRevenue    = Σ Trip.revenue WHERE status="Completed"
netProfit       = totalRevenue - totalCost
roi             = netProfit / Vehicle.acquisitionCost  (null when acquisitionCost = 0)
```

**ROI revenue assumption (flag for the team):** ROI uses `Trip.revenue` as the
earnings source and measures return against the vehicle's `acquisitionCost`. If
revenue is modelled differently, change `totalRevenue` in `lib/roi.ts`.

## Design decisions & guarantees

- **Expense `type` casing:** canonical values are `"Toll" | "Maintenance" |
  "Other"` to match `lib/types.ts`. The `POST /api/expenses` handler accepts any
  casing and stores the canonical value, and `getOperationalCost` filters on
  `"Maintenance"`. (An earlier version filtered lowercase `"maintenance"`, which
  would have made `maintenanceCost` always 0 — fixed.)
- **Status is centralised (teammate-owned engine):** every status change goes
  through `updateVehicleStatus(tx, vehicleId, newStatus)` in
  `lib/statusTransitions.ts` (Person 2's shared engine). This module never writes
  `Vehicle.status` directly and never reimplements it. The engine takes the tx
  client **first** and must be called inside a `prisma.$transaction`, so the
  record write and the status flip commit atomically.
- **Legal-transition map:** the engine validates each move against an adjacency
  map and throws `"Illegal vehicle transition: <from> -> <to>"` otherwise. Effects
  for this module:
  - Create → `"In Shop"` is legal only from `Available`/`On Trip`.
  - Close → `"Available"` is legal only from `In Shop`, so the close route only
    attempts the revert when the vehicle is actually `In Shop`.
  - Retire → legal only from `Available`/`In Shop`; **an `On Trip` vehicle cannot
    be retired** (→ `409`).
- **Never override Retired:** `Retired` is a terminal state in the engine's map
  (no outgoing transitions), so any attempt to move a retired vehicle throws —
  the guarantee is enforced centrally, for every caller.
- **Illegal transitions are mapped to `409`** by the maintenance-create and retire
  routes (see `isIllegalTransition` in `lib/apiHelpers.ts`).
- **Multiple open maintenance records:** `POST /api/maintenance` rejects a second
  `Active` record for the same vehicle (`409`). For a hard DB guarantee, add a
  partial unique index:
  `CREATE UNIQUE INDEX ... ON "MaintenanceLog"("vehicleId") WHERE status = 'Active';`

## Edge cases handled

- Zero fuel logs → `fuelEfficiency: null` (no divide-by-zero).
- No matching rows → `_sum` null normalised to `0`.
- Double-close → `409`; create maintenance on a Retired vehicle → `409`.
- Illegal status transitions (e.g. retire an `On Trip` vehicle) → `409`.

## Open question for the team

- **Money precision:** columns are `Float` (matches the UI's `number` type and
  avoids Prisma `Decimal` serialising as a string across the API). If accounting-
  grade precision is required, switch to `Decimal` — `getOperationalCost`'s
  `toNumber` already tolerates it, but raw `GET` responses would then return
  strings and the frontend types would need updating.
