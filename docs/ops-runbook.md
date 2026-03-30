# Ops Runbook

## Scope
This runbook covers service-level incidents for the API surface of Yan Study OS, with focus on:

- Authentication routes (`/api/auth/*`)
- Health ingestion routes (`/api/integrations/health/*`)
- Dashboard bootstrap (`/api/dashboard/bootstrap`)

## Logging and Correlation IDs
All covered routes emit an `x-correlation-id` response header and structured completion logs with:

- `route`
- `correlationId`
- `sessionMode`
- `sessionSubject`
- `latencyMs`
- `status`
- `result`
- `errorClass`
- `userContext`

### Log Search Pattern
Use the route and correlation ID fields to reconstruct request timelines:

1. Find a failing request in client logs or API response headers.
2. Search backend logs by `correlationId`.
3. Confirm `result`, `errorClass`, and `latencyMs`.
4. Pivot to route-specific metrics below.

## Dashboards and Alerts
- Grafana dashboard JSON: `ops/monitoring/grafana-dashboard.json`
- Prometheus rules: `ops/monitoring/prometheus-rules.yml`

### Service-Level Indicators
1. **Error rate**
   - Metric: `yan_study_api_requests_total`
   - Alert: `YanStudyApiHighErrorRate`
   - Threshold: >5% server errors for 10m

2. **p95 latency**
   - Metric: `yan_study_api_request_latency_ms_bucket`
   - Alert: `YanStudyApiP95LatencyHigh`
   - Threshold: p95 >1200ms for 10m

3. **Ingestion failure rate**
   - Metric: `yan_study_health_ingestion_requests_total`
   - Alert: `YanStudyHealthIngestionFailureRateHigh`
   - Threshold: >10% failures for 15m

4. **Auth failure anomalies**
   - Metric: `yan_study_auth_attempts_total`
   - Alert: `YanStudyAuthFailureAnomaly`
   - Threshold: >20% failed auth + at least 20 failures over 10m

## Incident Procedures

### 1) Elevated API Error Rate
1. Confirm alert scope and impacted routes.
2. Check logs for top `errorClass` and `route` combinations.
3. If ingestion routes dominate, jump to ingestion playbook.
4. If auth routes dominate, jump to auth playbook.
5. Mitigate by rolling back recent backend changes or reducing load.

### 2) p95 Latency Regression
1. Compare p50/p95 and request volume.
2. Identify slow routes from logs using `latencyMs` grouped by `route`.
3. Check backing store health and recent deploys.
4. If only `/api/dashboard/bootstrap` is degraded, check data sanitization and store I/O path.
5. Enable temporary traffic controls or caching if available.

### 3) Health Ingestion Failures
1. Segment by route:
   - `/api/integrations/health/csv`
   - `/api/integrations/health/import-batch`
   - `/api/integrations/health/mobile-sync`
2. Split failures into `unauthorized`, `client_error`, and `server_error`.
3. For `unauthorized` spikes, validate ingest token and environment vars.
4. For `client_error` spikes, sample payloads for schema mismatch.
5. For `server_error`, inspect datastore dependency status.

### 4) Auth Failure Anomaly
1. Verify whether failures are mostly invalid passcode or missing auth payload.
2. Correlate by `sessionMode` and source client if available.
3. Check for brute-force pattern by volume spikes.
4. Consider temporary rate-limits or WAF rules if attack-like.
5. Rotate passcode/hash if compromise suspected.

## Post-Incident Checklist
- Capture start/end timestamps and alert names.
- Record top failing routes and `errorClass` values.
- Add at least one prevention action item.
- Update this runbook with any new failure mode discovered.
