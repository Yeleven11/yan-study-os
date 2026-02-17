# StudyHealthSync Project Structure

Current project locations:

- `ios/StudyHealthSync/StudyHealthSync.xcodeproj`
- `ios/StudyHealthSync/StudyHealthSync/`
- `ios/StudyHealthSync/Config/Env.shared.xcconfig`
- `ios/StudyHealthSync/Config/Env.local.xcconfig` (local, optional, not committed)

## Source Layout

- `App/`
  - app bootstrapping and build-time config mapping (`AppConfig.swift`)
- `Features/Sync/`
  - sync coordinator + background scheduling
- `HealthKit/`
  - HealthKit authorization, anchored collection, workout payload assembly
- `Networking/`
  - API client for mobile sync endpoint
- `Persistence/`
  - app settings, keychain token, anchor state, retry queue
- `Models/`
  - payload and state models used by sync pipeline
- `Utilities/`
  - date formatting helpers for UI

## Config Files

- `Env.shared.xcconfig`:
  - committed shared defaults
  - includes `#include? "Env.local.xcconfig"`
- `Env.local.xcconfig`:
  - private overrides for URL/token
  - keep local only

## Data Flow (High Level)

1. `SyncCoordinator` requests HealthKit permission.
2. `HealthKitService` collects delta/range payloads.
3. `SyncAPIClient` sends payload to `/api/integrations/health/mobile-sync`.
4. On success, anchor snapshots persist in `AnchorStore`.
5. On failure, payload persists in `SyncQueueStore` and retries later.
