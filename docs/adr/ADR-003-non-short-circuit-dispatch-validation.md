# ADR-003: Non-Short-Circuit Dispatch Validation (Collect All Errors)

| Field       | Value                         |
|-------------|-------------------------------|
| **Status**  | Accepted                      |
| **Date**    | 2026-07-12                    |
| **Authors** | Person 2 (Driver/Trip module) |
| **Affects** | All consumers of `POST /api/trips/[id]/dispatch` |

---

## Context

`validateDispatch` must check five guard conditions before a trip can be dispatched:

1. Trip must be in `Draft` status.
2. Vehicle must be `Available`.
3. Driver must be `Available`.
4. Driver's `licenseExpiry` must be in the future.
5. `cargoWeight` (if set) must not exceed `vehicle.maxLoadCapacity`.

Two implementation strategies exist:

**Fail-fast:** return on the first failing condition. Simple to write, but if a caller has two
violations (e.g. expired license AND cargo over capacity), they only see one error per request.
They fix the first, resubmit, and discover the second. For a UI dispatch form, this produces poor UX
and masks issues from the demo judges.

**Collect-all:** run every check, collect all failing conditions into an array, return the whole list.
The caller (route handler, test script) sees the complete picture in one round-trip.

The master sheet (Section 3) and the demo script both require the system to surface the complete list
of violations at once so an operator can correct all problems before re-dispatching.

---

## Decision

`validateDispatch` uses the **collect-all** strategy for rules 2–5. Rule 1 (trip status) is still
short-circuiting because if the trip is not in `Draft`, the other rules are irrelevant — vehicle and
driver status checks against a non-dispatchable trip would produce misleading errors.

```ts
const errors: string[] = [];

// Rule 2
if (trip.vehicle.status !== "Available") errors.push("...");

// Rule 3
if (trip.driver.status !== "Available") errors.push("...");

// Rule 4
if (trip.driver.licenseExpiry < new Date()) errors.push("...");

// Rule 5
if (trip.cargoWeight !== null && trip.cargoWeight > trip.vehicle.maxLoadCapacity) {
  errors.push("...");
}

return errors.length > 0 ? { success: false, errors } : { success: true };
```

The return type is a discriminated union:

```ts
| { success: true }
| { success: false; errors: string[] }
```

`dispatchTrip` calls `validateDispatch` first; if it returns `success: false`, the full `errors`
array is forwarded to the caller without any DB write occurring.

---

## Alternatives Considered

| Option | Rejected because |
|--------|-----------------|
| Return on first failing condition (`throw` or early `return`) | User sees one error at a time; requires multiple roundtrips to fix a multi-violation trip. |
| Single combined error message | Harder to parse in the UI; not machine-readable. |
| Run checks concurrently with `Promise.all` | Adds complexity; rules 2–5 all read from the same already-loaded `trip` object, so parallelism gives no benefit and makes the ordering less predictable. |

---

## Consequences

**Positive:**
- The API surface is consistent: every `{ success: false }` response has `errors: string[]`, so the
  frontend can iterate and display all problems.
- TC-11 in the test script validates that multiple simultaneous violations (expired license + cargo
  over capacity) both appear in the returned `errors` array. This case would be silently broken by a
  fail-fast implementation.
- Judges testing the dispatch form with a misconfigured trip see the complete diagnosis immediately.

**Negative / trade-offs:**
- Slightly more code than a simple `if … throw`. Marginal in a 518-line file.
- Rule 1 (non-Draft trip status) is still an early return because subsequent checks are meaningless
  for a non-Draft trip. This mixed strategy must be documented to avoid a future contributor changing
  rule 1 to collect-all (which would produce misleading output).

---

## Files Introduced / Modified

| File | Change |
|------|--------|
| `lib/trip.ts` | `validateDispatch` implemented with collect-all strategy; `dispatchTrip` delegates to it. |
| `scripts/test-trip-lifecycle.ts` | TC-11 explicitly asserts that both errors are present in the response for a multi-violation trip. |
