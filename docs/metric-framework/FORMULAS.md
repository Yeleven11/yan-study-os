# Scientific Engine Formulas (Implementation-Ready)

This document is the mathematical source of truth for the implementation in `src/lib/health-engine.ts`.
All equations below are deterministic and include the constants used in code.

## 1) Notation and Units

- Day index: `t` (calendar day in user local timezone).
- Sleep durations: minutes unless otherwise noted.
- Loads: TRIMP-like impulse units.
- Scores and strain outputs: `[0, 100]`.
- `clip(x,a,b) = min(max(x,a), b)`
- `sigmoid(x) = 1 / (1 + exp(-x))`
- Robust scale: `sigma = 1.4826 * MAD`

## 2) Sleep Need

Cold start:

- `sleep_need_min(t) = 480`

Personalized need (after >=21 valid days):

- Good days from prior 56 days satisfy:
- `RecoveryScore >= 60`
- `sleep_efficiency >= 0.85`
- `PhysicalStrain(t-1) <= 70`
- If `|GoodDays| >= 7`:
- `sleep_need_min(t) = clip(median(TST over GoodDays), 420, 600)`
- Else fallback to `480`.

## 3) Sleep Score

Let:

- `N = sleep_need_min(t)`
- `S = sleep_asleep_min`
- `B = sleep_inbed_min`
- `A = WASO_min` (or `max(0, B-S)` fallback)
- `E = S / B`

### 3.1 Duration Component

Undersleep (strong convex penalty):

- `deficit = max(0, N - S)`
- `Score_duration = 100 * max(0, 1 - (deficit/(0.35*N))^2)` when `deficit > 0`

Oversleep (minimal penalty after grace):

- `excess = max(0, S - N)`
- `ratio = max(0, excess - 60) / 240`
- `Score_duration = 100 - 10 * ratio^2` when `deficit = 0`

### 3.2 Continuity Component

- `Score_eff = clip(100 * (E - 0.75) / 0.15, 0, 100)`
- `pen_awake = 20 * clip((A - 20) / 80, 0, 1)`
- `Score_continuity = clip(Score_eff - pen_awake, 0, 100)`

### 3.3 Regularity Component

- `Delta_mid = circular_abs_diff_minutes(midpoint_today, circular_median_21d(midpoint))`
- `Score_regularity = 100 / (1 + (Delta_mid / 90)^2)`

### 3.4 Stage Component

Let:

- `deep_pct = deep_min / S`
- `rem_pct = rem_min / S`
- `deep_def = max(0, 0.13 - deep_pct)`
- `rem_def = max(0, 0.20 - rem_pct)`

Then:

- `Score_stages = clip(100 - 400*deep_def - 250*rem_def, 0, 100)`

If stage data missing, stage component is omitted and flagged.

### 3.5 Final Sleep Score

Weighted mean over available components (weights renormalized across present components):

- `w_duration = 0.50`
- `w_continuity = 0.25`
- `w_regularity = 0.15`
- `w_stages = 0.10`

- `SleepScore = weighted_mean(components, available_weights)`

## 4) HR Calibration and TRIMP

### 4.1 HRmax Estimation Hierarchy

1. User profile HRmax (if provided).
2. Else max valid workout `hrMax` over last 365 days, with QA:
- `hrMax >= 140`
- workout duration >= 5 min
3. Else fallback `HRmax_est = 200`.

### 4.2 Resting HR Baseline

- `HRrest_est = median(last 14 valid resting HR)`
- Fallback latest value, then conservative default.

### 4.3 Session TRIMP (unknown sex default)

`b = 1.8`

If HR series available:

- `HRR_m = clip((HR_m - HRrest_est)/(HRmax_est - HRrest_est), 0, 1)`
- `TRIMP_session = duration_min * mean(HRR_m * exp(1.8 * HRR_m))`

If only avg HR:

- `HRR = clip((HR_avg - HRrest_est)/(HRmax_est - HRrest_est), 0, 1)`
- `TRIMP_session = duration_min * HRR * exp(1.8 * HRR)`

Fallback ladder if HR is missing:

1. Walk/run distance+duration -> ACSM speed-based MET proxy -> HRR proxy -> TRIMP proxy.
2. Energy+duration -> within-mode energy-rate normalization -> HRR proxy -> TRIMP proxy.
3. If no fallback signal -> `TRIMP_session = 0` and mark unscored.

## 5) Physical Load Dynamics and Strain

Daily impulse:

- `u(t) = sum(TRIMP_session on day t)`

EWMA update for time constant `tau` days:

- `k(tau) = 1 - exp(-1/tau)`
- `X(t) = X(t-1) + k(tau) * (u(t) - X(t-1))`

Definitions:

- `CTL`: `tau = 42`
- `ATL`: `tau = 7`
- `TSB = CTL - ATL`

Physical strain scaling:

- `u_ref = max(150, p95(u over last 180 days))`, cold start `u_ref = 300`
- `u0 = 30`
- `PhysicalStrain = clip(100 * ln(1 + u/u0) / ln(1 + u_ref/u0), 0, 100)`

## 6) Mental Load Dynamics and Strain

Exam urgency:

- For each upcoming event `e`:
- `u_e = (importance_e/5) * exp(-days_until_e / 10)`
- `ExamUrgency = max(u_e)`

Session load:

- `session_load = d_min * (1 + 0.003 * max(0, d_min - 60))`

Daily mental impulse:

- Primary: `m(t) = sum(session_load) * (1 + 0.5 * ExamUrgency)`
- Missing-study fallback: `m(t) = m_ref_default * ExamUrgency`, with low confidence (`m_ref_default = 600`)

Mental EWMAs:

- `MCL`: `tau = 21`
- `MAL`: `tau = 3`

Mental strain:

- `m_ref = max(200, p95(m over last 180 days))`, cold start `m_ref = 600`
- `m0 = 60`
- `MentalStrain = clip(100 * ln(1 + m/m0) / ln(1 + m_ref/m0), 0, 100)`

## 7) Recovery Score

Robust physiology deltas (28-day baseline windows):

- `z_HRV = robust_z(ln(HRV_sdnn_ms))`
- `z_RHR = robust_z_inverse(RHR)`
- `z_RR = robust_z_inverse(RR)`

Component maps:

- `Comp_HRV = clip(50 + 20*z_HRV, 0, 100)`
- `Comp_RHR = clip(50 + 20*z_RHR, 0, 100)`
- `Comp_RR = clip(50 + 15*z_RR, 0, 100)`

Base weighted score over available components:

- weights: `HRV 0.35`, `RHR 0.25`, `RR 0.15`, `Sleep 0.25`
- renormalized over present inputs

Final:

- `RecoveryScore = clip(RecoveryBase - 0.10*PhysicalStrain(t-1) - 0.05*MentalStrain(t-1), 0, 100)`

## 8) Mental Recovery

Base blend:

- `MentalRecoveryBase = weighted_mean(SleepScore, SleepRegularity, Comp_HRV_if_available)`
- default intended weights: `0.60`, `0.20`, `0.20`
- HRV-missing case renormalizes remaining weights

Final:

- `MentalRecovery = clip(MentalRecoveryBase - 0.05*MentalStrain(t-1), 0, 100)`

## 9) State Machines

### 9.1 Physical States

- `FI = CTL / CTL_ref`, `CTL_ref = median(CTL last 90 valid days)` (fallback 30-day median, cold start 50)
- `AI = (ATL - CTL) / CTL_ref`

Priority order:

1. `overtraining_risk`: `AI >= 0.35` for >=7 of last 10 days AND `RecoveryScore <= 45` for last 3 days
2. `fatigued`: `AI >= 0.25` OR (`AI >= 0.15` and `RecoveryScore < 45`)
3. `peaking`: `FI >= 1.15` and `-0.10 <= AI <= 0.15` and `RecoveryScore >= 55`
4. `productive`: `0.90 <= FI <= 1.15` and `0.05 <= AI <= 0.25` and `RecoveryScore >= 45`
5. `maintaining`: `0.75 <= FI < 0.95` and `-0.05 <= AI < 0.15`
6. `detraining`: `FI < 0.75`

### 9.2 Mental States

- `MFI = MCL / MCL_ref`, `MCL_ref = median(MCL last 90 valid days)` (fallback 30-day median, cold start 50)
- `MAI = (MAL - MCL) / MCL_ref`

Priority order:

1. `burnout_risk`: persistence (>=7 of last 10 days had `MAI >= 0.25` or `MentalRecovery < 50`) and today `MAI >= 0.25` or `MentalRecovery < 50`
2. `fatigued`: (`MentalRecovery < 40` and `MFI >= 0.75`) OR `MAI >= 0.25` OR (`MAI >= 0.15` and `MentalRecovery < 50`)
3. `peaking`: `MFI >= 1.15` and `-0.10 <= MAI <= 0.15` and `MentalRecovery >= 60` and `ExamUrgency >= 0.40`
4. `productive`: `0.90 <= MFI <= 1.15` and `0.05 <= MAI <= 0.25` and `MentalRecovery >= 55`
5. `maintaining`: `0.75 <= MFI < 0.95` and `-0.05 <= MAI < 0.15`
6. `underloaded`: `MFI < 0.75` and `ExamUrgency < 0.40`

## 10) Daily Target Ranges

### 10.1 Physical Target (raw impulse center)

`u_center = CTL * base_mult(state) * mult_recovery * mult_exam`

- `base_mult`:
- detraining `1.25`
- maintaining `1.00`
- productive `1.35`
- peaking `0.60`
- fatigued `0.30`
- overtraining_risk `0.10`

- `mult_recovery = 0.5 + RecoveryScore/200`
- `mult_exam = 0.85 if ExamUrgency >= 0.70 else 0.95 if ExamUrgency >= 0.40 else 1.0`

Range:

- fatigued/overtraining_risk: `[0, u_center]`
- else: `[0.8*u_center, 1.2*u_center]`

Spike guard:

- build states (detraining/maintaining/productive): `u_max <= 1.6*CTL`
- non-build states: `u_max <= 1.3*CTL`

Map range to strain via the physical log mapping function.

### 10.2 Mental Target (raw impulse center)

`m_center = MCL * base_mult_mental(state) * mult_mrec * mult_exam * mult_physical`

- `base_mult_mental`:
- underloaded `1.20`
- maintaining `1.00`
- productive `1.10`
- peaking `1.25`
- fatigued `0.70`
- burnout_risk `0.50`

- `mult_mrec = 0.5 + MentalRecovery/200`
- `mult_exam = 1.25 if ExamUrgency >= 0.70 else 1.10 if ExamUrgency >= 0.40 else 1.0`
- `mult_physical = 0.90 if PhysicalState in {fatigued, overtraining_risk} else 1.0`

Range:

- fatigued/burnout_risk: `[0, m_center]`
- else: `[0.8*m_center, 1.2*m_center]`

Cap: `m_max <= 1.6*MCL`

Map range to strain via the mental log mapping function.

## 11) Confidence Model

History factor:

- `<7 days`: `0.3`
- `7-13 days`: `0.7`
- `>=14 days`: `1.0`

Consistency factor:

- penalized by outlier-like spikes (for example large HRV/RHR anomalies)

Per-metric base confidence:

- `SleepConfidenceBase = 1.0 * (0.90 if midpoint missing else 1.0) * (0.85 if stage missing else 1.0)`
- `RecoveryConfidenceBase = used_recovery_weight_sum`
- `PhysicalConfidenceBase = 0.90 (HR series/avg HR), 0.65 (pace/energy fallback), 0.45 (minimal signal)`
- `MentalConfidenceBase = 0.90 (study present), 0.70 (no study sessions)`

Final per-metric confidence:

- `Conf_metric = clip(Base * HistoryFactor * ConsistencyFactor, 0, 1)`

Overall:

- `OverallConfidence = 0.25*Sleep + 0.35*Recovery + 0.25*Physical + 0.15*Mental`

## 12) Explainability Outputs

Every scientific day emits:

- `reasonCodes[]`
- `userMessages[]`
- `contributionBreakdown{component -> points}`

Explicit explainability blocks exist for:

- sleep (`lowReasons`, `highReasons`)
- physical recovery (`reasons`)
- mental recovery (`reasons`)
- target range (`physicalReasons`, `mentalReasons`, `studyRationale`)

## 13) Chart Payload Contract

Each day includes hover-ready metadata for chart points:

- `timestamp`
- `rawValue`
- `normalizedValue`
- `componentContributions`
- `confidence`

Implemented for `physicalStrain` and `mentalStrain` payloads under `chartPayloads`.
