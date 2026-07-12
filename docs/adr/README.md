# Architecture Decision Records — TransitOps

All significant architectural decisions made during the TransitOps build are recorded here.
Each ADR follows the format: **Context → Decision → Alternatives Considered → Consequences**.

---

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./ADR-001-shared-status-transition-engine.md) | Centralised Status-Transition Engine for Vehicle and Driver Status | Accepted | 2026-07-12 |
| [ADR-002](./ADR-002-trip-state-machine-and-atomic-transitions.md) | Trip Lifecycle State Machine and Atomic Multi-Record Mutations | Accepted | 2026-07-12 |
| [ADR-003](./ADR-003-non-short-circuit-dispatch-validation.md) | Non-Short-Circuit Dispatch Validation (Collect All Errors) | Accepted | 2026-07-12 |
| [ADR-004](./ADR-004-driver-status-blocked-from-updatedriver.md) | Block Status Mutations in `updateDriver()` at Type and Runtime Levels | Accepted | 2026-07-12 |
| [ADR-005](./ADR-005-string-statuses-not-prisma-enums.md) | Status Columns Stored as `String`, Not Prisma Enums | Accepted | 2026-07-12 |

---

## When to add a new ADR

Create a new ADR whenever:
- A module-level design choice is made that **other team members must respect** (e.g. "don't call this directly").
- A non-obvious trade-off is taken that future reviewers would otherwise undo.
- A constraint is agreed between two or more people at any group session.

Use the next sequential number. Copy the structure of any existing ADR. Commit the ADR in the same PR
as the code that implements the decision.

---

## Status values

| Status | Meaning |
|--------|---------|
| `Accepted` | Decision is in effect; code reflects it. |
| `Superseded by ADR-NNN` | A later decision replaced this one; see the referenced ADR. |
| `Deprecated` | No longer applies; not replaced. |
