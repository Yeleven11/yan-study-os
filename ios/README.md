# iOS Workspace

This folder contains the production iOS HealthKit sync app and supporting setup docs.

## What Is Here

- `ios/StudyHealthSync/` - the actual SwiftUI app project used for phone sync
- `ios/health-sync-starter/Docs/` - setup and structure guides
- `ios/health-sync-starter/Config/Env.sample.xcconfig` - local config template

## App Purpose

`StudyHealthSync` reads Apple Health data and uploads it to this repo's server API (`/api/integrations/health/mobile-sync`) using token auth.

Key behavior:

- incremental sync with HealthKit anchors
- background observer triggers + scheduled background tasks
- adjustable sync interval (15-180 min)
- manual range backfill upload (7-365 days)
- queued retry + recent sync logs

## Open And Run

1. Open:
   - `ios/StudyHealthSync/StudyHealthSync.xcodeproj`
2. Set your Apple signing team in target settings.
3. Ensure capabilities:
   - `HealthKit`
   - `Background Modes` -> `fetch`, `processing`
4. Create local config file:
   - copy `ios/health-sync-starter/Config/Env.sample.xcconfig`
   - to `ios/StudyHealthSync/Config/Env.local.xcconfig`
5. Fill at least `SYNC_BASE_URL` and `SYNC_BEARER_TOKEN`.
6. Run on physical iPhone and grant Health permissions.

More detail:

- `ios/health-sync-starter/Docs/SETUP.md`
- `ios/health-sync-starter/Docs/PROJECT_STRUCTURE.md`
