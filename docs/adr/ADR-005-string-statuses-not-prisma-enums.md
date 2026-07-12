# ADR-005: Status Columns Stored as `String`, Not Prisma Enums

| Field       | Value |
|-------------|-------|
| **Status**  | Accepted |
| **Date**    | 2026-07-12 |
| **Authors** | Person 1 (schema owner), Person 2 (Driver/Trip) |
| **Affects** | All modules reading or writing any `*.status` column |

---

## Context

The canonical status values agreed at Hour 0 contain spaces (`"On Trip"`, `"In Shop"`, `"Off Duty"`).
Prisma enum identifiers cannot contain spaces without `@map`, which creates two diverging names per
value and requires a translation layer at every API boundary. The UI already uses the plain string
values as its source of truth.

---

## Decision

All status columns are `String` in `schema.prisma` with inline comments listing allowed values.
Type safety is enforced in TypeScript via literal union types, not in the DB schema:

```ts
export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type DriverStatus  = "Available" | "On Trip" | "Off Duty" | "Suspended";
export type TripStatus    = "Draft" | "Dispatched" | "Completed" | "Cancelled";
```

Runtime narrowing helpers (`asVehicleStatus`, `asDriverStatus`, `asTripStatus`) validate DB strings
at read time and throw immediately on an unrecognised value, preventing silent corruption.

**To add a new status value:** update the schema comment, the TypeScript union type, and the
relevant transition map in `lib/statusTransitions.ts`. All three must stay in sync.

---

## Alternatives Considered

| Option | Rejected because |
|--------|-----------------|
| Prisma `enum` with `@map` | Two names per value; translation layer at every API boundary. |
| Enum with underscores (e.g. `ON_TRIP`) | Does not match the frontend contract without translation. |
| `String` with no TypeScript guards | Any typo passes the DB write and silently breaks downstream checks. |

---

## Consequences

**Positive:** Zero translation layer — DB value = API response value = frontend expectation. Adding
a new status requires no Prisma migration.

**Negative:** No DB-level constraint preventing arbitrary strings. Mitigated by runtime narrowing
helpers that surface corrupt data immediately rather than propagating it.

---

## Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | All three status columns declared as `String` with inline comments. |
| `lib/statusTransitions.ts` | `VehicleStatus`, `DriverStatus` type aliases + runtime narrowing. |
| `lib/trip.ts` | `TripStatus` type alias + `asTripStatus` narrowing helper. |
