# Health Ingestion Error Taxonomy & Operations

## Scope
Covers CSV ingest (`/api/integrations/health/csv`), batch CSV ingest (`/api/integrations/health/import-batch`), and mobile sync ingest (`/api/integrations/health/mobile-sync`).

## Schema versioning and compatibility
- CSV + batch accept `x-health-schema-version` header, currently `1`.
- Mobile sync accepts payload `schemaVersion` in `{1,2}`.
- `schemaVersion=2` mobile payloads must provide `idempotencyKey`.
- Unsupported schema versions are rejected as `400` (non-retryable until client upgrade).

## Idempotency and duplicate-write protection
- All ingest endpoints accept `Idempotency-Key` request header.
- Mobile schema v2 supports `idempotencyKey` in body (header takes precedence).
- A processed idempotency key is persisted as a `healthRawRows` marker and replay requests are treated as duplicates (`duplicateRequest`/`duplicateBatch`), not re-imports.

## Error taxonomy

### `VALIDATION_ERROR` (4xx)
Examples:
- Invalid JSON/body shape
- Missing required contract fields
- Unsupported schema version

Handling:
- Do not retry unchanged payload.
- Fix client payload or headers.

### `AUTH_ERROR` (401/403)
Examples:
- Missing or invalid ingest auth

Handling:
- Do not blind-retry.
- Refresh credentials and retry once.

### `DUPLICATE_REQUEST` (200 with duplicate flag)
Examples:
- Same idempotency key replayed
- Mobile duplicate batch hash or batch id replay

Handling:
- Treat as successful no-op.
- Suppress alerting.

### `IMPORT_FAILED` (500)
Examples:
- Storage backend failure
- Unexpected parse/merge runtime failure

Handling:
- Endpoint records a dead-letter entry in `healthImportDeadLetters`.
- Same request hash increments retry count and updates `lastFailedAt`.
- Retry with exponential backoff and same idempotency key.

## Dead-letter strategy
- Dead letters are persisted in `AppData.healthImportDeadLetters` with:
  - channel, idempotency key, schema version
  - request hash + payload preview
  - error code/message
  - first/last failure timestamps
  - retry count
- Operators can filter by `channel + requestHash` and replay after root-cause fix.

## Operational playbook
1. Check duplicate marker first (idempotency replay means no action).
2. For 4xx errors, fix payload/contract mismatch.
3. For 5xx errors, inspect latest dead-letter entry and backend health.
4. Replay with same idempotency key after fix for exactly-once semantics.
5. If retry count keeps growing, quarantine producer version and escalate.
