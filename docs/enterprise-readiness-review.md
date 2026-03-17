# Enterprise Readiness Review

Generated: 2026-02-19
Repository: /Users/yanborovyk/Desktop/Code Projects/IbWebsite

## 1. Executive Summary

This codebase is a sophisticated study-and-health operating system with three major surfaces:

- Next.js 16 web app for study planning, flashcards, goals, and health analytics.
- API tier implemented as Next.js route handlers with pluggable persistence backends.
- Native SwiftUI iOS companion app that incrementally syncs HealthKit data.

The product logic quality is strong in core analytics and ingestion correctness, and automated checks pass (`lint`, `typecheck`, `test:health`, `build`). The main enterprise gaps are concentrated in security hardening defaults, monolithic file boundaries, and operational scalability for the DynamoDB adapter.

## 2. Architecture Overview

## 2.1 Web Application Layer

Primary files:

- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/layout.tsx
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/page.tsx
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/components/study-dashboard.tsx
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/components/scientific-dashboard.tsx

Design characteristics:

- Client-heavy UX with stateful interactions for planning, flashcards, and performance visualization.
- `study-dashboard.tsx` is the orchestration layer for most end-user flows.
- `scientific-dashboard.tsx` exposes deeper metric interpretation and debugging views.

## 2.2 Domain + Analytics Engine

Primary files:

- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/health-engine.ts
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/types.ts
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/constants.ts
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/dashboard-utils.ts
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/flashcards/scheduler.ts

Design characteristics:

- Deterministic metric engine with calibration, denominator floors, shrinkage, and confidence outputs.
- Strong separation between raw health ingestion and derived indicator production.
- High-value learning/study workflows integrated with daily/weekly feedback loops.

## 2.3 API and Service Layer

Primary files:

- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/**/route.ts
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/auth.ts
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/route-helpers.ts
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/health-csv.ts
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/health-mobile.ts
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/health-time-sanity.ts
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/workout-detail.ts

Design characteristics:

- Clear route partitioning by domain (`auth`, `dashboard`, `study-sessions`, `todos`, `workouts`, `settings`, `flashcards`, `health integrations`).
- Shared auth and response helper abstractions keep handlers consistent.
- Ingestion endpoints support both operational flexibility and forensic diagnostics.

## 2.4 Persistence Abstraction Layer

Primary files:

- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/store/index.ts
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/store/types.ts
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/store/local-file-store.ts
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/store/neon-store.ts
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/store/dynamo-store.ts

Design characteristics:

- Runtime backend selection by environment.
- Identical logical `AppData` contract preserved across backends.
- Neon and Dynamo adapters are production-viable with different scaling tradeoffs.

## 2.5 Native iOS Sync Layer

Primary files:

- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/Features/Sync/SyncCoordinator.swift
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/HealthKit/HealthKitService.swift
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/Networking/SyncAPIClient.swift
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/Features/Sync/BackgroundSyncScheduler.swift
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/Persistence/*.swift

Design characteristics:

- Background-capable sync coordinator with queueing, chunking, retries, and scheduling.
- Anchor-based incremental collection from HealthKit.
- Controlled payload shaping and robust local persistence for resilience.

## 3. Function Inventory Coverage

A complete machine-generated function catalog has been produced at:

- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/docs/enterprise-codebase-overview.md

Catalog statistics:

- Total source files scanned: 74
- Files containing function-like definitions: 59
- Total function-like definitions: 600
- Exported function-like definitions: 77
- Async function-like definitions: 154

Highest-density implementation files:

- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/components/study-dashboard.tsx (72)
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/health-engine.ts (60)
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/client/repository.ts (45)
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/health-csv.ts (42)
- /Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/Features/Sync/SyncCoordinator.swift (34)

## 4. API Surface Map

Routes are complete and cohesive for the domain:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/dashboard/bootstrap`
- `GET|POST /api/study-sessions`
- `GET|POST /api/workouts`
- `GET|PATCH|DELETE /api/workouts/:id`
- `GET|POST|PATCH /api/todos`
- `POST /api/todos/:id/archive`
- `POST /api/todos/:id/restore`
- `GET|PUT /api/settings/exams`
- `GET|PUT /api/settings/goals`
- `GET|POST /api/flashcards`
- `POST /api/flashcards/review`
- `GET /api/health/raw/files`
- `POST /api/integrations/health/csv`
- `POST /api/integrations/health/import-batch`
- `POST /api/integrations/health/mobile-sync`

## 5. Enterprise Risk Findings

## 5.1 Security Critical

- Hardcoded passcode bypass in `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/auth.ts:123` accepts `"test123"`.
- Session secret default fallback in `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/auth.ts:14` risks weak deployments if env configuration is incomplete.

Recommendation:

- Remove hardcoded bypass entirely.
- Fail fast at startup if `SESSION_SECRET` or passcode hash is missing in non-development environments.
- Add explicit environment validation and startup diagnostics.

## 5.2 Scalability High

- Full-table scans in Dynamo adapter at `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/store/dynamo-store.ts:349` and `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/store/dynamo-store.ts:350` (`ScanCommand`) do not scale for large tenants.
- Stream row retention set to zero at `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/store/dynamo-store.ts:31` (`MAX_STREAM_ROWS_PER_WORKOUT_STREAM = 0`) may remove analytical granularity for workout streams.

Recommendation:

- Move to key-based `Query` patterns with tenant/user partitioning.
- Add pagination and incremental cursors for list endpoints.
- Introduce explicit stream retention policy by plan tier or horizon instead of zero default.

## 5.3 Maintainability High

- Two concentration hotspots are large and behaviorally dense:
- `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/components/study-dashboard.tsx`
- `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/health-engine.ts`

Recommendation:

- Split into bounded-context modules with stable internal interfaces.
- Create package-style folders (`state`, `commands`, `selectors`, `presenters`, `metrics`) with focused tests.
- Add architecture decision records for model boundaries.

## 5.4 Observability Medium

- Error diagnostics returned by ingestion routes can aid operations but should be reviewed for production disclosure risk.

Recommendation:

- Gate verbose diagnostics behind environment-based policy.
- Add request IDs and structured logging for ingestion and sync pipelines.
- Add per-route latency and error-rate metrics.

## 5.5 Test Strategy Medium

- Domain tests are strong for health engine and parsing layers.
- API integration tests are relatively light.
- iOS tests are mostly scaffold-level placeholders.

Recommendation:

- Add route integration suites for auth boundaries and ingestion contracts.
- Add contract tests between iOS payload schema and server normalization.
- Add end-to-end smoke tests for critical user paths.

## 6. Enterprise-Ready Target Architecture

## 6.1 Security Controls

- Enforce strict env validation at startup.
- Introduce rotating session keys and token expiration strategy.
- Add audit logging for login and data ingestion access.
- Add rate limits and abuse protections on public endpoints.

## 6.2 Reliability Controls

- Implement idempotency keys for ingestion endpoints.
- Add dead-letter strategy for failed batch imports.
- Separate read and write models for high-volume analytics histories.
- Add schema versioning gates for mobile payload compatibility.

## 6.3 Performance Controls

- Add data partitioning model in persistence layer.
- Introduce query indexes and bounded time-window retrieval.
- Cache expensive metric snapshots and recompute incrementally.
- Add background recomputation jobs for historical backfills.

## 6.4 Platform and Ops

- Add production runbooks for auth, ingestion, and sync incidents.
- Add SLOs for API availability, p95 latency, and sync completion.
- Add centralized tracing and dashboarding.
- Add disaster recovery playbook for backend mode migrations.

## 7. 90-Day Hardening Roadmap

## 7.1 Days 0-15

- Remove auth bypass and insecure defaults.
- Add startup env validator with strict production mode.
- Add integration tests for login/session/logout and protected routes.

## 7.2 Days 16-45

- Refactor `study-dashboard` into modular slices.
- Refactor `health-engine` into composable metric modules.
- Introduce request/trace IDs and structured logs.

## 7.3 Days 46-90

- Rework Dynamo read paths to indexed queries.
- Add ingestion idempotency and replay safety.
- Build iOS-server contract test matrix.
- Add SLO dashboard and alerting thresholds.

## 8. Readiness Scorecard (Current)

- Product feature completeness: High
- Domain model depth and correctness: High
- Core algorithm test coverage: High
- Security posture for production: Medium-Low
- Horizontal scalability posture: Medium
- Operational observability: Medium
- Long-term maintainability without refactor: Medium-Low

## 9. Bottom Line

The codebase already demonstrates strong product-market logic and strong technical depth in health analytics and sync orchestration. With targeted hardening in auth defaults, datastore scaling patterns, and module decomposition, this can be elevated to an enterprise-grade platform with predictable reliability and governance.
