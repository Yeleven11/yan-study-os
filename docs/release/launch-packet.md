# Release Launch Packet

**Release window:** _TBD (set in CAB/Change ticket)_  
**Prepared by:** Release Engineering  
**Effective date:** March 30, 2026

## 1) Deployment Sequence

### 1.1 Pre-deployment gates (T-24h to T-1h)
1. Confirm all release artifacts are signed, versioned, and traceable to the approved commit SHA.
2. Verify CI status is green for build, test, security, and infrastructure checks.
3. Freeze non-essential merges to protected branches during release window.
4. Confirm backend-specific prerequisites:
   - **local:** backup snapshot script verified in staging.
   - **neon:** branch restore point and PITR window confirmed.
   - **dynamodb:** PITR enabled for all impacted tables and on-demand backup completed.
5. Announce release start in `#release-ops` and page on-call participants.

### 1.2 Deployment execution (T0 to T+60m)
1. **T0:** Open release bridge (Slack + incident bridge link pinned).
2. Deploy infrastructure/database migrations first (forward-compatible only).
3. Deploy backend services/capabilities in canary mode (5% traffic for 10 minutes).
4. Validate canary SLOs and error budgets:
   - p95 latency within +10% of baseline
   - error rate < 1.0%
   - no sustained queue backlog growth
5. Increase traffic to 25% for 15 minutes; re-check metrics and logs.
6. Promote to 100% if checks pass.
7. Run post-deploy smoke tests (auth, core API paths, billing/write path, notifications).
8. Communicate “release complete, monitoring active” status.

### 1.3 Deployment stop conditions
Stop progression and hold at current stage if any of the following occur for >5 minutes:
- Error rate exceeds 1.0%.
- p95 latency exceeds baseline by >20%.
- Data integrity checks fail (schema mismatch, nullability violations, duplicate writes).
- Security alarm or auth failure spike appears.

## 2) Rollback Plan

### 2.1 Trigger thresholds
Rollback decision is made by Incident Commander + Engineering Lead when any threshold is breached and cannot be mitigated within 15 minutes:
- Sev1 customer impact confirmed.
- Sev2 impact sustained >15 minutes.
- Data corruption risk > low confidence.

### 2.2 Rollback order of operations
1. Halt new rollouts immediately.
2. Shift traffic back to previous stable version (load balancer / deployment platform).
3. Disable feature flags introduced in this release.
4. Execute backend rollback steps (Section 3 restore path by backend).
5. Re-run smoke and integrity checks against rolled-back environment.
6. Send stakeholder update every 15 minutes until stabilized.

### 2.3 Rollback communication template
- **Status:** Rolling back release `<version>` initiated at `<time UTC>`.
- **Reason:** `<customer-impact summary>`.
- **Current impact:** `<scope/regions/features>`.
- **ETA to stable:** `<estimate>`.
- **Next update:** `<time UTC +15m>`.

## 3) Data Backup and Restore by Backend

## 3.1 `local` backend

### Backup
1. Stop write traffic (maintenance mode or app write lock).
2. Archive local datastore and config:
   - `data/` directory
   - environment files used for runtime config
3. Capture checksum manifest for archived artifacts.
4. Store backup in dated folder: `backups/local/YYYYMMDD-HHMM/`.

### Restore
1. Stop application services.
2. Move current data to quarantine folder.
3. Restore archived `data/` and config files.
4. Validate file ownership/permissions.
5. Start services in read-only validation mode; run integrity checks.
6. Re-enable writes after validation passes.

## 3.2 `neon` backend

### Backup
1. Create a Neon branch restore point immediately before migration.
2. Confirm WAL/PITR retention window covers release window + 24h.
3. Export schema snapshot for audit (DDL-only).

### Restore
1. Create recovery branch from pre-release restore point or PITR timestamp.
2. Run migration state verification on recovery branch.
3. Redirect application connection string to recovery branch (or promote branch per Neon procedure).
4. Execute read/write smoke tests and data consistency checks.
5. Keep failed branch for forensic analysis; lock writes to it.

## 3.3 `dynamodb` backend

### Backup
1. Verify Point-in-Time Recovery is enabled for all impacted tables.
2. Create on-demand backup immediately prior to deployment.
3. Record table ARNs, backup ARNs, and timestamps in release log.

### Restore
1. Restore impacted tables from on-demand backup (preferred) or PITR timestamp.
2. Restore to new tables (`<table>_restore_<timestamp>`) to avoid destructive overwrite.
3. Update service configuration/aliases to point to restored tables.
4. Run reconciliation job for any out-of-band writes.
5. Validate GSI health, TTL settings, stream consumers, and IAM policies.

## 4) Incident Escalation Matrix

| Severity | Trigger example | Response SLA | Incident Commander | Technical Lead | Communications Owner | Escalation path |
|---|---|---:|---|---|---|---|
| **Sev1** | Full outage, data-loss risk, auth unavailable | 5 min | On-call EM | Primary backend on-call | Product/Ops lead | CTO → Executive incident channel |
| **Sev2** | Major feature degraded, regional outage | 10 min | On-call EM | Relevant service owner | Support lead | Director Eng → Product leadership |
| **Sev3** | Partial degradation, workaround exists | 30 min | Team lead | Assigned engineer | Support rotation | Weekly incident review |
| **Sev4** | Minor defect/no customer impact | Next business day | Team lead | Backlog owner | None required | Standard triage |

### Escalation contacts (fill before release)
- Incident Commander (primary/secondary): `<name> / <name>`
- Backend on-call (primary/secondary): `<name> / <name>`
- SRE on-call: `<name>`
- Product communications: `<name>`
- Customer support manager: `<name>`

## 5) Post-Release Monitoring Checklist

## 5.1 First 24 hours
- [ ] Error budget burn rate checked every hour.
- [ ] p50/p95/p99 latency compared to pre-release baseline.
- [ ] 5xx and timeout rates checked by endpoint/service.
- [ ] Database health validated (connections, replication lag, throttling).
- [ ] Queue/stream lag and dead-letter queue counts reviewed.
- [ ] Auth success/failure ratio and token refresh failures reviewed.
- [ ] Top customer journeys verified (login, create/update, checkout/critical write).
- [ ] Support ticket volume and sentiment reviewed every 4 hours.
- [ ] Cost anomaly checks completed (compute, database, egress).

## 5.2 First 72 hours
- [ ] Trend analysis of latency/error compared to trailing 7-day baseline.
- [ ] Data correctness audit jobs completed with no critical discrepancies.
- [ ] Feature adoption and conversion metrics reviewed with Product.
- [ ] Security alerts and audit events reviewed.
- [ ] Incident postmortems scheduled for any Sev1/Sev2 events.
- [ ] Release retrospective notes captured and action items assigned.

## 6) Known-Risk Matrix

| Risk ID | Risk description | Likelihood | Impact | Detection signal | Mitigation | Contingency owner |
|---|---|---|---|---|---|---|
| R1 | Backward-incompatible schema assumption in older service instance | Medium | High | Migration errors, spike in 5xx | Enforce expand-contract migration pattern | Backend lead |
| R2 | Elevated latency under full traffic after canary | Medium | Medium | p95/p99 latency alarms | Gradual ramp, autoscaling warm-up | SRE on-call |
| R3 | DynamoDB throttle due to underestimated write burst | Low | High | `ProvisionedThroughputExceeded` and retry growth | Pre-scale capacity / adaptive capacity validation | Data platform owner |
| R4 | Neon failover/branch cutover misconfiguration | Low | High | Connection/auth failures post-cutover | Pre-validated connection failover runbook | Database owner |
| R5 | Feature flag default mis-set for production | Medium | Medium | Unexpected behavior in critical path | Two-person review + staged rollout by segment | Release manager |
| R6 | Monitoring blind spot for newly added endpoints | Medium | Medium | Missing dashboards/alerts | Add explicit endpoint-level alerts pre-release | Observability owner |

## 7) First-Week Support Owner Assignments

| Day (UTC) | Incident Commander | Backend Primary | SRE Primary | Product/Comms | Support Liaison |
|---|---|---|---|---|---|
| Day 0 (Release day) | `<owner>` | `<owner>` | `<owner>` | `<owner>` | `<owner>` |
| Day 1 | `<owner>` | `<owner>` | `<owner>` | `<owner>` | `<owner>` |
| Day 2 | `<owner>` | `<owner>` | `<owner>` | `<owner>` | `<owner>` |
| Day 3 | `<owner>` | `<owner>` | `<owner>` | `<owner>` | `<owner>` |
| Day 4 | `<owner>` | `<owner>` | `<owner>` | `<owner>` | `<owner>` |
| Day 5 | `<owner>` | `<owner>` | `<owner>` | `<owner>` | `<owner>` |
| Day 6 | `<owner>` | `<owner>` | `<owner>` | `<owner>` | `<owner>` |

### Handoff rules
- Daily 15-minute handoff between outgoing/incoming on-call owners.
- Open Sev2+ issues must include latest status, next action, and explicit owner before handoff.
- All customer-facing updates routed through Product/Comms owner.

---

## Approval Checklist
- [ ] Engineering Lead approved.
- [ ] SRE approved.
- [ ] Product approved.
- [ ] Support approved.
- [ ] Security sign-off completed (if applicable).
