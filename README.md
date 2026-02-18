# Yan Study OS

Private study operating system for IBDP finals with integrated health/performance coaching and native iOS HealthKit sync.

## Current State

- Next.js 16 dashboard with passcode session auth.
- Homepage split rails:
  - top: scrollable todo rail
  - bottom: always-ready flashcards (no start/stop workflow)
- Flashcards use spaced repetition scheduling and save instantly after each review outcome.
- Focus feed includes live study-target progress and exam-day subject outlines (inside the day square, no glow bleed).
- Performance module uses imported health/workout data (manual workout logging UI removed).
- Native iOS companion app (`ios/StudyHealthSync`) sends incremental HealthKit data to the server.
- Backend persistence modes:
  - `local` (file store)
  - `neon` (Postgres via Neon serverless driver)
  - `dynamodb` (AWS DynamoDB)
- No synthetic sample health fallback is used in the analytics engine.

## Core Features

### Study + planning

- Passcode-only login.
- Study timer with start/pause/resume/end and session persistence.
- Daily streak in the top status bar (counts only when total study time for day >= 1.5h).
- Todo management with archive/restore and priority ordering.
- Subject-aware exam calendar and countdown surfaces.

### Flashcards

- Add cards from homepage (`question`, `answer`).
- Front of card shows question immediately.
- Flip card to reveal answer + `Correct` / `Incorrect` buttons.
- Review action persists immediately and updates spaced-repetition schedule.
- Session snapshot tracks due/critical card counts.

### Health + performance

- CSV ingest from Health Auto Export (`/api/integrations/health/csv`, `/api/integrations/health/import-batch`).
- Native iOS JSON ingest (`/api/integrations/health/mobile-sync`).
- Workout detail drill-down with merged streams and provenance.
- Deterministic multi-domain metric engine for sleep, recovery, physical strain, mental recovery, and mental strain.
- User-editable workout difficulty override (1-10) feeding future training load.

Mathematical and debugging docs live in:

- `docs/metric-framework/FORMULAS.md`
- `docs/metric-framework/DEBUG_GUIDE.md`
- `docs/metric-framework/OUTPUT_SCHEMA.md`

## Stack

- Next.js 16 (App Router + Route Handlers)
- TypeScript
- Tailwind CSS
- Optional Neon Postgres backend
- Optional AWS DynamoDB backend
- Native SwiftUI iOS companion app for HealthKit sync

## Repository Layout

- `src/` - web app, API routes, analytics/health logic
- `ios/StudyHealthSync/` - production iOS app project
- `ios/health-sync-starter/` - setup and structure docs/templates
- `scripts/` - utility scripts (passcode hash, health batch import, mobile token generation)
- `runtime-data/` - local file backend data (`DATA_BACKEND=local`)

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Generate passcode hash:

```bash
npm run passcode:hash -- "your-passcode"
```

4. Set required auth vars in `.env.local`:

```bash
YAN_STUDY_PASSCODE_HASH=<generated>
SESSION_SECRET=<long-random-secret>
```

5. Run app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data Modes And Persistence

`NEXT_PUBLIC_DATA_MODE` (frontend adapter):

- `api` (default) -> uses authenticated API routes
- `local` -> browser localStorage only

`DATA_BACKEND` (server persistence):

- `local` (default) -> writes to `runtime-data/yan-study-os.json`
- `neon` -> stores `AppData` as JSONB in a Neon Postgres table (`yan_study_state` by default)
- `dynamodb` -> uses DynamoDB tables

Notes:

- `local` backend is not durable for serverless production hosting.
- For production, use `neon` or `dynamodb`.

## Environment Variables

### Required

- `YAN_STUDY_PASSCODE_HASH`
- `SESSION_SECRET`

### Common

- `NEXT_PUBLIC_DATA_MODE=api`
- `DATA_BACKEND=local|neon|dynamodb`

### Required for `DATA_BACKEND=neon`

- One of:
  - `NEON_DATABASE_URL`
  - `DATABASE_URL`
  - `STORAGE_URL` (Vercel Storage integration)
  - `POSTGRES_URL`
- Optional:
  - `NEON_STATE_TABLE` (default: `yan_study_state`)
- The state table is auto-created by the app on first access.

### Required for `DATA_BACKEND=dynamodb`

- `YAN_STUDY_SESSIONS_TABLE`
- `YAN_STUDY_TODOS_TABLE`
- `YAN_STUDY_SETTINGS_TABLE`
- Region (one of):
  - `DYNAMO_REGION`
  - `AWS_REGION`
  - `AWS_DEFAULT_REGION`

### Optional ingestion auth

- `HEALTH_EXPORT_BEARER_TOKEN` (CSV and mobile endpoint fallback token)
- `MOBILE_HEALTH_SYNC_BEARER_TOKEN` (dedicated mobile token)

### Optional tooling

- `HEALTH_IMPORT_BASE_URL` (default base URL for `scripts/import-health-folder.mjs`)

## API Routes

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

## Health Ingestion

### CSV import

- Endpoint: `POST /api/integrations/health/csv`
- Supports:
  - `multipart/form-data` CSV upload
  - JSON `{ csv, filename }`
  - JSON `{ files: [{ filename, csv }] }`
  - raw `text/csv`

Batch helper:

```bash
node scripts/import-health-folder.mjs "/absolute/path/to/export/folder" "http://localhost:3000"
```

### Native iOS import

- Endpoint: `POST /api/integrations/health/mobile-sync`
- Payload: schema version `1`
- Supports daily health + workouts + stream series + deletions
- iOS app emits minute-resampled workout heart-rate series with gap carry-forward

## iOS App (StudyHealthSync)

Production project path:

- `ios/StudyHealthSync/StudyHealthSync.xcodeproj`

Quick setup:

1. Open project in Xcode.
2. Ensure Signing team is set.
3. Confirm capabilities on target:
   - HealthKit
   - Background Modes (`fetch`, `processing`)
4. Create local config:
   - copy `ios/health-sync-starter/Config/Env.sample.xcconfig`
   - to `ios/StudyHealthSync/Config/Env.local.xcconfig`
5. Fill at least:
   - `SYNC_BASE_URL`
   - `SYNC_BEARER_TOKEN`
6. Run on physical iPhone and grant Health permissions.

Main app behavior:

- Auto sync with adjustable interval (15-180 min)
- Manual `Sync Now`
- Manual range backfill (`Last 7..365 days`)
- Queue/retry with recent sync logs
- Connection settings stored separately from main sync controls

## Deployment Notes

### AWS Amplify (currently implemented path)

- `amplify/` contains infra definitions and `amplify.yml` build setup.
- When using Dynamo backend, set table env vars + region env + auth env.

### Vercel

- App deploys fine on Vercel.
- Do not rely on local file persistence in serverless production.
- Use a durable backend (`neon` and `dynamodb` are supported in code).

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run test:health
npm run build
```
