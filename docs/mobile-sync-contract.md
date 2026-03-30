# Mobile Sync Contract

This document defines the HTTP contract for `POST /api/integrations/health/mobile-sync`.

## Versioning rules

- **Latest schema version:** `1`
- **Supported request schema versions for ingestion:** `1`
- **Legacy compatibility version:** `0` (accepted only during a deprecation window)
- **Legacy deprecation window ends:** **2026-09-30T00:00:00.000Z**

### Compatibility behavior

1. `schemaVersion: 1`
   - Accepted as-is.
   - Processed with **native** strategy.

2. `schemaVersion: 0`
   - Accepted only until `2026-09-30T00:00:00.000Z`.
   - Processed with **transform_legacy** strategy.
   - Server normalizes it internally to schema `1` semantics.

3. Missing `schemaVersion`, non-integer values, or any other version (for example `2`, `3`)
   - Rejected with HTTP `400`.
   - Error message indicates the supported versions.

4. `schemaVersion: 0` after the deprecation cutoff
   - Rejected with HTTP `400`.
   - Client must upgrade to `schemaVersion: 1`.

## Request shape

### Required top-level fields

- `schemaVersion` (integer)
- `batchId` (non-empty string)
- `generatedAt` (ISO timestamp)
- `device` object with:
  - `deviceId` (non-empty string)
  - `appVersion` (non-empty string)
  - `osVersion` (non-empty string)
  - `timezone` (non-empty string)

### Optional top-level fields

- `syncWindow` (`from`/`to` ISO timestamps)
- `settings.syncIntervalMinutes` (positive number)
- `dailyHealth[]`
- `workouts[]`
- `deletions[]`

## Example request (schemaVersion 1)

```json
{
  "schemaVersion": 1,
  "batchId": "f7ceeb84-2b3b-4f95-9e87-0ef0698dd744",
  "generatedAt": "2026-03-30T10:11:12.000Z",
  "device": {
    "deviceId": "iphone-yan",
    "appVersion": "1.3.0",
    "osVersion": "iOS 26.4",
    "timezone": "America/Los_Angeles"
  },
  "syncWindow": {
    "from": "2026-03-29T00:00:00.000Z",
    "to": "2026-03-30T00:00:00.000Z"
  },
  "settings": {
    "syncIntervalMinutes": 30
  },
  "dailyHealth": [
    {
      "date": "2026-03-29",
      "sleepHours": 7.5,
      "steps": 9500
    }
  ],
  "workouts": [],
  "deletions": []
}
```

## Example success response

```json
{
  "ok": true,
  "importedHealthDays": 1,
  "importedWorkouts": 0,
  "updatedWorkouts": 0,
  "filesProcessed": 1,
  "filesSkipped": 0,
  "linkedStreams": 0,
  "duplicateBatch": false,
  "serverTime": "2026-03-30T10:11:13.000Z",
  "nextSuggestedSyncSeconds": 1800,
  "schema": {
    "acceptedVersion": 1,
    "supportedVersions": [1],
    "deprecatedLegacyVersion": 0,
    "deprecationWindowEndsAt": "2026-09-30T00:00:00.000Z",
    "transformedLegacyPayload": false
  }
}
```

## Example rejection (missing schemaVersion)

HTTP `400`

```json
{
  "error": "schemaVersion is required and must be an integer"
}
```

## Example legacy request behavior during deprecation window

If client sends:

```json
{
  "schemaVersion": 0,
  "batchId": "legacy-batch",
  "generatedAt": "2026-03-30T10:00:00.000Z",
  "device": {
    "deviceId": "iphone-legacy",
    "appVersion": "1.0.0",
    "osVersion": "iOS 25.0",
    "timezone": "UTC"
  }
}
```

Then server accepts and marks transformation:

```json
{
  "ok": true,
  "schema": {
    "acceptedVersion": 1,
    "supportedVersions": [1],
    "deprecatedLegacyVersion": 0,
    "deprecationWindowEndsAt": "2026-09-30T00:00:00.000Z",
    "transformedLegacyPayload": true
  }
}
```
