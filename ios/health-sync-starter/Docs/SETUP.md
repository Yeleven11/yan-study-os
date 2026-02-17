# StudyHealthSync Setup (Current Project)

This guide is for the app that already exists in this repo.

## 1) Prerequisites

1. Install latest Xcode.
2. Open Xcode once and accept license prompts.
3. Sign into Apple ID in Xcode:
   - Xcode -> Settings -> Accounts
4. Connect your iPhone once and trust the computer.

Notes:

- HealthKit testing requires a real iPhone.
- Paid Apple Developer account is not required for personal device testing.

## 2) Open Existing Project

1. Open:
   - `ios/StudyHealthSync/StudyHealthSync.xcodeproj`
2. Select target `StudyHealthSync`.
3. In `Signing & Capabilities`, set your Team.

## 3) Verify Capabilities

In target `Signing & Capabilities`, confirm:

- `HealthKit`
- `Background Modes`
  - `Background fetch`
  - `Background processing`

The project also includes background task identifiers in `Info.plist`.

## 4) Verify Health Privacy Strings

In target `Info`, confirm these keys exist:

- `Privacy - Health Share Usage Description` (`NSHealthShareUsageDescription`)
- `Privacy - Health Update Usage Description` (`NSHealthUpdateUsageDescription`)

## 5) Configure Server URL + Token

1. Copy template:
   - from `ios/health-sync-starter/Config/Env.sample.xcconfig`
   - to `ios/StudyHealthSync/Config/Env.local.xcconfig`
2. Set values:
   - `SYNC_BASE_URL=https://<your-domain>`
   - `SYNC_BEARER_TOKEN=<your-token>`
3. Keep `Env.shared.xcconfig` committed; keep `Env.local.xcconfig` local.

Defaults from `Env.shared.xcconfig`:

- Endpoint path: `/api/integrations/health/mobile-sync`
- Interval bounds: 15 to 180 minutes
- Default interval: 30 minutes

## 6) First Device Run

1. Select your iPhone as run destination.
2. Build and run.
3. Trust developer profile on iPhone if prompted.
4. Open app -> tap `Grant or Refresh Permissions`.

## 7) In-App Configuration

- Main screen keeps sync controls (auto sync, interval, sync now, manual backfill).
- URL/token are in separate sheet:
  - `Server and Token Settings`
- Manual backfill supports ranges from 7 to 365 days.

## 8) Verify End-To-End Sync

1. Ensure server token matches app token.
2. Tap `Sync Now`.
3. Check `Recent Sync Logs` for success counts.
4. Confirm website receives health days and workouts.

## 9) Troubleshooting

- `App Transport Security requires secure connection`:
  - use `https://` server URL for non-local environments.
- `401 Unauthorized`:
  - token mismatch or missing bearer token env on server.
- `500` with AWS credential/provider errors:
  - server backend env is misconfigured, not iOS client issue.
- App UI appears frozen after edits:
  - force close app and relaunch once after changing sync settings.

## 10) Useful Commands

Generate a strong token for mobile sync:

```bash
npm run mobile-sync:token
```
