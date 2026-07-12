# ADR-004: Block Status Mutations in `updateDriver()` at Type and Runtime Levels

| Field       | Value                         |
|-------------|-------------------------------|
| **Status**  | Accepted                      |
| **Date**    | 2026-07-12                    |
| **Authors** | Person 2 (Driver/Trip module) |
| **Affects** | All callers of `PATCH /api/drivers/[id]` |

---

## Context

`updateDriver()` in `lib/driver.ts` handles general field mutations on a Driver record (name,
licenseNumber, licenseCategory, licenseExpiry, safetyScore). It must **not** accept a `status` field
because all Driver status changes must go through `updateDriverStatus()` from `lib/statusTransitions.ts`
(see ADR-001).

Without an explicit guard, a route handler or test can pass `{ status: "Suspended" }` in the PATCH
body and silently bypass the transition-validation engine. Because the Prisma `update` call succeeds,
no error is raised — the status is mutated with no legality check, no transition-map validation, and
no wrapping transaction.

There are two enforcement layers available: the TypeScript type system and a runtime check.
Using only one is insufficient:

- **Type-only:** TypeScript is erased at runtime. Any `as any` cast or a raw HTTP body parsed with
  `JSON.parse` bypasses it. A rogue API caller or future developer can still pass `status` and the
  code will silently succeed.
- **Runtime-only:** Works at runtime but provides no compile-time feedback; developers writing new
  callers have no signal at the IDE level.

---

## Decision

`updateDriver` enforces the block at **both** levels simultaneously:

**1. Type level — `status?: never` in `UpdateDriverInput`:**

```ts
export interface UpdateDriverInput {
  name?:            string;
  licenseNumber?:   string;
  licenseCategory?: string;
  licenseExpiry?:   Date | string;
  safetyScore?:     number;
  /** Passing `status` here will throw. Route it through updateDriverStatus(). */
  status?: never;
}
```

TypeScript's `never` type makes any assignment to `status` a compile-time error. IDE autocomplete
will not suggest `status` as a valid key.

**2. Runtime level — explicit guard in `updateDriver` body:**

```ts
export async function updateDriver(
  id: string,
  data: UpdateDriverInput & { status?: unknown }   // widen to catch `as any` casts
): Promise<DriverWithExpiry> {
  if ("status" in data && data.status !== undefined) {
    throw new Error(
      "[driver] updateDriver: You cannot change a driver's status through this function. " +
      "Use updateDriverStatus() from lib/statusTransitions.ts instead."
    );
  }
  // ... rest of the function
}
```

The parameter type is widened to `& { status?: unknown }` so that `as any` casts from JavaScript
callers are still caught. The runtime check runs before any Prisma call, so no partial mutation occurs.

The `PATCH /api/drivers/[id]` route handler propagates this throw as a `400 Bad Request` with a clear
error message pointing the caller to the correct function.

---

## Alternatives Considered

| Option | Rejected because |
|--------|-----------------|
| Strip `status` silently if present in the payload | Silent no-ops are harder to debug than explicit errors. A caller who passes status and sees success will assume it worked. |
| Only use `status?: never` (type-only) | Runtime bypass via `as any` or raw HTTP bodies still possible. |
| Validate in the route handler only | Business logic would leak into the route layer; `updateDriver` itself remains unsafe when called from non-HTTP contexts (e.g. scripts, seeds). |
| Allow `updateDriver` to accept status and call `updateDriverStatus` internally | Breaks the single-responsibility boundary; `updateDriver` would need a transaction client, changing its entire call signature. |

---

## Consequences

**Positive:**
- Two-layer defence: compile-time IDE feedback + runtime throw. Neither can be bypassed without
  explicit, visible effort.
- The error message is actionable: it names the correct alternative (`updateDriverStatus`) so a
  developer knows exactly what to do.
- TC-12 in the test script verifies this guard by casting through `as any` to simulate a rogue caller
  and confirming the DB status is unchanged after the throw.

**Negative / trade-offs:**
- The parameter type widening (`& { status?: unknown }`) is slightly unusual and needs a comment to
  explain why it exists. Without the comment, a future reviewer might "clean it up" and remove it,
  weakening the runtime guard.

---

## Files Introduced / Modified

| File | Change |
|------|--------|
| `lib/driver.ts` | `UpdateDriverInput` uses `status?: never`; `updateDriver` body has runtime guard. |
| `app/api/drivers/[id]/route.ts` | PATCH handler catches the thrown error and returns `400`. |
| `scripts/test-trip-lifecycle.ts` | TC-12 verifies the guard via `as any` cast. |
