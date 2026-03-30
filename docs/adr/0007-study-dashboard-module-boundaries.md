# ADR 0007: Study Dashboard Module Boundaries

## Status
Accepted — 2026-03-30

## Context
`src/components/study-dashboard.tsx` accumulated UI, state persistence, derived selectors, and mutation logic in one file.

## Decision
Create focused support modules under `src/components/study-dashboard/`:

- `state.ts`: persisted/local state primitives and storage keys ownership.
- `selectors.ts`: date/timer/countdown/streak derivations.
- `actions.ts`: optimistic/offline mutations and goal parsing.
- `view-components.tsx`: shared presentation primitives (`FocusModal`, mobile unsupported shell).

The top-level `study-dashboard.tsx` remains the orchestration entry point and public export surface.

## Ownership
- Dashboard feature team owns `src/components/study-dashboard/*`.
- Core product frontend owns the orchestration page component and composition behavior.

## Consequences
- Smaller testable boundaries for pure state/action/selector logic.
- UI primitives can be reused without duplicating accessibility logic.
