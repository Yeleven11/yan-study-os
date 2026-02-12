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

## API Routes

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/dashboard/bootstrap`
- `GET|POST /api/study-sessions`
- `GET|POST|PATCH /api/todos`
- `POST /api/todos/:id/archive`
- `POST /api/todos/:id/restore`
- `GET|PUT /api/settings/exams`

## Quality Checks

```bash
npm run lint
npm run build
```
