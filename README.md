# Yan Study OS

Personal IBDP Year 2 study command center for the final exam sprint.

## What Is Implemented

- Dark terminal/IDE dashboard (JetBrains Mono, minimal color usage, subject color accents)
- Single passcode login (server-verified; no username)
- Top exam countdown card (nearest 3 exams with subject-colored progress bars)
- Editable exam schedule (in expanded exam view)
- 120-day forward study calendar with glowing exam-day highlight
- Time-dependent greeting variants for Yan
- Study timer with `Start` / `Pause|Resume` / `End`
- Session threshold filter (`< 5 min` ignored)
- Timer auto-resume after refresh/reopen
- Subject cumulative study trackers (6 subjects)
- Study log (reverse chronological, subject color strips)
- Whoop-style condition/readiness widget (sleep + HRV + RHR + load + cognitive strain)
- Workout tracker with manual logging + calendar workout markers
- Health Analytics V2:
  - multi-file Apple Health CSV ingestion (batch import)
  - merged workout assembly across split stream files
  - workout confidence + stream count + raw file provenance
  - Workout Explorer rail cards + full drill-down modal with raw series visuals
  - sleep raw bars (hours + score) and 7-day/30-day trend views
- Goal-driven coaching (study target, bedtime recommendation, workout recommendation)
- CSV health import endpoint (comma-separated) with sample-mode fallback when no health data exists
- Left-side todo rail with:
  - add todo (`title`, `deadline`, `ultraPriority`, `subject`)
  - chronological sorting + ultra-priority pinning
  - archive/restore workflow
- Fullscreen card expansion with backdrop blur + keyboard escape + focus trap
- API contract routes from the plan (`/auth`, `/dashboard/bootstrap`, `/study-sessions`, `/todos`, `/settings/exams`)
- Offline mutation queue for API mode (auto flush on reconnect)

## Stack

- Next.js 16 + TypeScript + Tailwind CSS
- App Router + Route Handlers
- Amplify Gen 2 backend scaffolding
- Local file data store for development
- Optional DynamoDB-backed store for AWS runtime

## Subject Colors

- Math AA HL: `#C3423F`
- Physics HL: `#9BC53D`
- Computer Science HL: `#730071`
- German Lang Lit SL: `#FFAD05`
- English Lang Lit SL: `#5BC0EB`
- Business SL: `#FDE74C`

## Local Run

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Set passcode in `.env.local`:

```bash
node scripts/generate-passcode-hash.mjs "your-passcode"
```

Paste output into:

```bash
YAN_STUDY_PASSCODE_HASH=<generated-value>
SESSION_SECRET=<random-long-secret>
```

4. Start:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data Modes

`NEXT_PUBLIC_DATA_MODE` controls frontend adapter:

- `api` (default): frontend uses protected API routes
- `local`: frontend uses browser localStorage only

`DATA_BACKEND` controls API persistence backend:

- `local` (default): stores data in `runtime-data/yan-study-os.json`
- `dynamodb`: stores data in DynamoDB (requires table env vars)

Required when `DATA_BACKEND=dynamodb`:

- `YAN_STUDY_SESSIONS_TABLE`
- `YAN_STUDY_TODOS_TABLE`
- `YAN_STUDY_SETTINGS_TABLE`
- `AWS_REGION` (default target `eu-central-1`)

## Amplify Gen 2 (AWS)

Amplify resources are defined in `amplify/`.

### Provision backend (sandbox/dev)

```bash
npx ampx sandbox --profile <your-aws-profile> --region eu-central-1
```

This creates:

- Amplify Data API models (`StudySession`, `TodoItem`, `DashboardSettings`)
- Custom DynamoDB tables for server API backend:
  - `StudySessionsTable`
  - `TodosTable`
  - `SettingsTable`

### Amplify Hosting (production)

1. Push this repo to GitHub.
2. Connect repo in Amplify Hosting.
3. Set environment variables in Amplify app:

- `YAN_STUDY_PASSCODE_HASH`
- `SESSION_SECRET`
- `NEXT_PUBLIC_DATA_MODE=api`
- `DATA_BACKEND=dynamodb`
- `YAN_STUDY_SESSIONS_TABLE`
- `YAN_STUDY_TODOS_TABLE`
- `YAN_STUDY_SETTINGS_TABLE`
- `AWS_REGION=eu-central-1`

4. Deploy.

Note for Next.js SSR routes on Amplify:

- This repo includes `amplify.yml` that writes required server env vars into `.env.production` during build.
- Keep auth/storage env vars configured in Amplify Console so API routes can read them at runtime.

## API Routes

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/dashboard/bootstrap`
- `GET|POST /api/study-sessions`
- `GET|POST /api/workouts`
- `GET|POST|PATCH /api/todos`
- `POST /api/todos/:id/archive`
- `POST /api/todos/:id/restore`
- `GET|PUT /api/settings/exams`
- `GET|PUT /api/settings/goals`
- `POST /api/integrations/health/csv` (Bearer auth via `HEALTH_EXPORT_BEARER_TOKEN` or session fallback)
- `POST /api/integrations/health/import-batch`
- `GET /api/workouts/:id` (merged workout detail drill-down)
- `GET /api/health/raw/files` (raw import file transparency)

## Health Import V2

### Supported CSV Patterns

- Daily aggregates: `HealthAutoExport-*.csv`
- Workout summary anchor: `Workouts-*.csv`
- Workout detail streams (split files):
  - `*-Heart Rate-YYYYMMDD_HHmmss.csv`
  - `*-Heart Rate Recovery-YYYYMMDD_HHmmss.csv`
  - `*-Walking + Running Distance-YYYYMMDD_HHmmss.csv`
  - `*-Step Count-YYYYMMDD_HHmmss.csv`
  - `*-Active Energy-YYYYMMDD_HHmmss.csv`
  - `*-Resting Energy-YYYYMMDD_HHmmss.csv`
  - `*-Flights Climbed-YYYYMMDD_HHmmss.csv`
- Explicitly ignored:
  - route/GPS files (`*-Route-*.csv`, `*.gpx`)

### Merge Behavior

- `workoutKey` is derived from workout stem + timestamp token (`YYYYMMDD_HHmmss`).
- Canonical source priority:
  - `Workouts-*.csv` summary row is canonical when present.
  - Stream files are attached by exact `workoutKey` first.
  - Fallback match: nearest start time window (`±3 minutes`) + inferred workout type.
- If no canonical summary exists, a workout is inferred from stream timestamps/metrics.
- Metric precedence:
  - Summary metrics win when positive/non-zero.
  - Missing metrics are filled from stream aggregates.
  - HR average is weighted by interval duration from stream rows.
- Imports are idempotent by content hash; duplicate files are ignored.

### Import Workflows

- In dashboard UI:
  - `Performance -> Health CSV Import -> Batch import folder files (.csv)` for multi-file upload.
  - paste-single CSV is still supported.
- Scripted batch import:

```bash
node scripts/import-health-folder.mjs "/absolute/path/to/export/folder" "http://localhost:3000"
```

Optional:

- `HEALTH_EXPORT_BEARER_TOKEN` for bearer-auth import mode.
- `HEALTH_IMPORT_BASE_URL` to set default API base.

### Health Auto Export App Setup (REST API)

Set `HEALTH_EXPORT_BEARER_TOKEN` on your deployed server and use the same value in both automations as:

- Header key: `Authorization`
- Header value: `Bearer <HEALTH_EXPORT_BEARER_TOKEN>`

Use this endpoint:

- `https://<YOUR_LIVE_DOMAIN>/api/integrations/health/csv`

Create two automations in Health Auto Export:

1. `IB Health Metrics`
- Enabled: `ON`
- Automation Type: `REST API`
- URL: `https://<YOUR_LIVE_DOMAIN>/api/integrations/health/csv`
- Timeout Interval: `60`
- Data Type: `Health Metrics`
- Select Health Metrics: `All Selected` (or at least sleep + HRV + resting HR + steps + distance + active/resting energy)
- Export Format: `CSV`
- Export Version: `v2`
- Date Range: `Since Last Sync`
- Time Grouping: `Default` (or `Day` if available)
- Sync Cadence: `15 Minutes` (use `5` for faster updates)
- Notify on Cache Update / Notify When Run: optional

2. `IB Workouts`
- Enabled: `ON`
- Automation Type: `REST API`
- URL: `https://<YOUR_LIVE_DOMAIN>/api/integrations/health/csv`
- Timeout Interval: `60`
- Data Type: `Workouts`
- Export Format: `CSV`
- Export Version: `v2`
- Date Range: `Since Last Sync`
- Time Grouping: `Default`
- Sync Cadence: `15 Minutes`

Transport compatibility:

- Supports `multipart/form-data` CSV uploads (Health Auto Export CSV mode).
- Supports JSON body `{ csv, filename }`.
- Supports JSON body `{ files: [{ filename, csv }] }`.
- Supports raw `text/csv` payloads on `/api/integrations/health/csv`.

Troubleshooting:

- `401 Unauthorized`: missing or incorrect `Authorization: Bearer ...` header, or wrong token in server env.
- `400 Bad Request`: payload format is not one of the supported body shapes.
- `200` with no visible data changes: CSV payload may be empty/unsupported, or file hash already imported (idempotent duplicate).

## Quality Checks

```bash
npm run lint
npm run test:health
npm run build
```
