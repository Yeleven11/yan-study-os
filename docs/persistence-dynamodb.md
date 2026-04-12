# DynamoDB persistence model

This document captures the DynamoDB key schema and access patterns used by `src/lib/server/store/dynamo-store.ts`.

## Goal

Avoid full-table `Scan` operations on high-traffic reads by using tenant/user scoped partition keys and entity-specific sort keys, then reading via `Query` with cursors.

## Key schema

Tables that store tenant/user entities (`YAN_STUDY_SESSIONS_TABLE`, `YAN_STUDY_TODOS_TABLE`) use:

- **Partition key (`pk`)**: `tenant#{tenantId}#user#{userId}`
- **Sort key (`sk`)**:
  - Study session: `session#{startedAt}#{id}`
  - Todo: `todo#{createdAt}#{id}`

Settings table (`YAN_STUDY_SETTINGS_TABLE`) remains a singleton item:

- **Primary key (`pk`)**: `settings`

Tenant and user values are resolved from:

- `YAN_STUDY_TENANT_ID` (default: `default`)
- `YAN_STUDY_USER_ID` (default: `default`)

## Access patterns

### 1) List study sessions (paginated)

- API: `GET /api/study-sessions?limit=<n>&cursor=<token>`
- Store call: `listStudySessions({ limit, cursor })`
- DynamoDB operation: `Query` where:
  - `pk = tenant#{tenantId}#user#{userId}`
  - `begins_with(sk, 'session#')`
- Returns items plus `nextCursor` (base64url-encoded `LastEvaluatedKey`).

### 2) List todos (paginated)

- API: `GET /api/todos?limit=<n>&cursor=<token>`
- Store call: `listTodos({ limit, cursor })`
- DynamoDB operation: `Query` where:
  - `pk = tenant#{tenantId}#user#{userId}`
  - `begins_with(sk, 'todo#')`
- Returns items plus `nextCursor`.

### 3) Full dashboard bootstrap read

- API: `GET /api/dashboard/bootstrap`
- Store call: `getData()`
- Session and todo collections are fetched by repeatedly calling paginated `Query` until cursor exhaustion (bounded page size per request, no scans).
- Settings are fetched with `GetItem` on `pk=settings`.

## Notes

- Pagination limits are clamped in-store (`1..500`, default `100`).
- Cursor tokens are opaque to clients and should be replayed unchanged.
- Existing read/write normalization remains unchanged; only physical DynamoDB access patterns were migrated from `Scan` to key-based `Query`.
