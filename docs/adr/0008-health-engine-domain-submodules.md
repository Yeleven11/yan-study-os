# ADR 0008: Health Engine Domain Submodules

## Status
Accepted — 2026-03-30

## Context
`src/lib/health-engine.ts` centralizes sleep, recovery, strain modeling, and mathematical helper utilities in a single implementation file.

## Decision
Introduce domain submodules under `src/lib/health-engine/`:

- `sleep.ts`: sleep narrative helpers.
- `recovery.ts`: recovery reason translation logic.
- `physical-strain.ts`: physical strain transfer function.
- `mental-strain.ts`: mental strain transfer function.
- `normalization.ts`: reusable normalization/confidence math helpers (clamp/robust-z family).

`src/lib/health-engine.ts` remains the stable public entry point via `buildPerformanceInsights` and now delegates selected computations to domain modules.

## Ownership
- Health modeling team owns `src/lib/health-engine/*`.
- Consumer surfaces (dashboard/API formatting) depend only on the public `buildPerformanceInsights` contract.

## Consequences
- Safer regression tests around extracted boundaries.
- Incremental domain updates without editing the monolith for every helper change.
