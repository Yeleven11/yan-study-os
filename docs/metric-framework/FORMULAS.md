# Scientific Engine Formulas (Deterministic Audit Implementation)

This file is the implementation reference for `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/health-engine.ts`.
All formulas below are deterministic and match shipped constants.

## 1) Core math primitives

- `clip(x, a, b) = min(max(x, a), b)`
- `sigmoid(x) = 1 / (1 + exp(-x))`
- Robust scale: `sigma = 1.4826 * MAD + 1e-6`
- Robust z-score: `z = clip((x - median(history))/sigma, -4, +4)`
- EWMA (`tau` in days):
  - `k = 1 - exp(-1/tau)`
  - `state_t = state_{t-1} + k * (u_t - state_{t-1})`

## 2) Sleep day attribution (04:00 boundary)

For each health row with wake timestamp `W`:
- If local wake clock `>= 04:00`: assign sleep to `date(W)`
- Else: assign to `date(W) - 1 day`

This prevents midnight/early-morning sessions from being treated as a new day prematurely.

## 3) Sleep need `N_t` (minutes)

Age-aware anchors:
- Teen mode (`age <= 18`): `anchor = 540`, clamp `[480, 600]`
- Adult/unknown: `anchor = 480`, clamp `[420, 600]`

Personalization over last 60 days (`H=60`) using good nights:
- Good-night filters:
  - `sleepEfficiency >= 0.85`
  - `recoveryPhysOnly >= 60`
  - prior-day physical strain `<= 70`
  - prior-day mental strain `<= 70`
- If good nights `< 7`: use anchor.
- Else:
  - `N_data = quantile_0.60(TST_good)`
  - `w = kappa / (kappa + n_good)`, `kappa = 14`
  - `N_t = clip(w*anchor + (1-w)*N_data, N_min, 600)`

## 4) Sleep score components (0-100)

### 4.1 Duration score `S_dur`

Let `T = TST` minutes.

Undersleep (`T <= N_t`):
- `r = (N_t - T) / (0.35 * N_t)`
- `S_dur = 100 * exp(-r^2)`

Oversleep (`T > N_t`):
- Grace `g = 90 min`
- Window `w = 360 min`
- Max penalty `P_max = 8`
- `P_over = P_max * min(1, (max(0, T - N_t - g)/w)^2)`
- `S_dur = 100 - P_over`

If TST missing and TIB exists: `TST = 0.85 * TIB` (`sleep_tst_from_tib`).

### 4.2 Continuity score `S_cont`

- Efficiency `E = TST/TIB`
- `SE = 100 * clip((E - 0.74)/(0.85 - 0.74), 0, 1)`
- WASO penalty:
  - `P_WASO = 20 * clip((WASO - 20)/(60 - 20), 0, 1)`
- `S_cont = clip(SE - P_WASO, 0, 100)`

### 4.3 Timing score `S_time` (SRI + SJL + drift)

Uses bed/wake timestamps over last 14 valid sleep days.

#### SRI14
- Sleep/wake occupancy in 30-minute bins (`48` bins/day)
- `SRI14 = 100 * matches / (48*(M-1))`, require `M >= 4`

#### Social jetlag score
- Compute midsleep circular means for:
  - workdays: Mon-Fri
  - free days: Sat-Sun
- `SJL = circular_distance(mid_work, mid_free)` minutes
- `S_SJL = 100 * (1 - clip((SJL - 60)/(180 - 60), 0, 1))`

#### Bedtime drift score
- Unwrap bedtime series (avoid >720-minute jumps)
- OLS slope `beta_b` in min/day
- `S_drift = 100 * (1 - clip((|beta_b| - 10)/(30 - 10), 0, 1))`

#### Blend
- `S_time = weighted_mean([SRI14, S_SJL, S_drift], [0.60, 0.25, 0.15])` over available subcomponents.

If timing insufficient, mark `sleep_timing_sparse`.

### 4.4 Stage score `S_stage` (de-weighted)

Let `pREM = REM/TST`, `pN3 = deep/TST`.

- `S_REM = 100 * clip((pREM - 0.10)/(0.21 - 0.10), 0, 1)`
- `S_N3 = 100 * clip((pN3 - 0.05)/(0.16 - 0.05), 0, 1)`
- `S_stage = 0.5*S_REM + 0.5*S_N3`

Stage influence is explicitly capped in final aggregation:
- `stageDelta = clip(0.1 * (S_stage - 50), -5, +5)`

### 4.5 Final sleep score

Main weighted score over available non-stage components:
- Duration `0.45`
- Continuity `0.25`
- Timing `0.25`

Then:
- `SleepScore = clip(baseSleep + stageDelta, 0, 100)`

### 4.6 Sleep confidence

- `n14 = valid sleep days in last 14`
- `C_hist = n14 / 14`
- `C_stage = 0.85` if stage missing else `1.0`
- `C_mid = 0.90` if bed/wake missing else `1.0`
- `C_sleep = clip(C_hist * C_stage * C_mid, 0, 1)`

## 5) Physical load and strain

## 5.1 Session TRIMP (unknown-sex deterministic compromise)

For HR reserve fraction `HRR`:
- `TRIMP_session = duration * HRR * 0.75 * exp(1.795 * HRR)`

HR hierarchy:
- HR series -> mean bin contribution
- avg HR fallback
- pace/MET fallback for walk/run
- active-energy fallback

## 5.2 Qualifying cardio sessions (for calibration/status)

A session is qualifying if either:
- HR branch: duration `>= 20 min` and mean `HRR >= 0.40`
- MET branch: duration `>= 30 min` and estimated `MET >= 3`

Non-qualifying sessions still contribute to raw daily impulse.

## 5.3 Daily physical impulse and dynamics

- Raw impulse `u_t = sum(TRIMP_session)` over all sessions
- Qualifying training impulse `u_train_t = sum(TRIMP_session qualifying)`
- CTL/ATL for status/targets use qualifying impulse:
  - `CTL = EWMA_tau42(u_train)`
  - `ATL = EWMA_tau7(u_train)`

## 5.4 Physical reference stabilization

Over rolling 120 days:
- valid days: `u_t > 0`
- require `n >= 20` else cold ref `300`
- raw ref: `max(150, p95(u))`
- shrinkage (`kappa=20`):
  - `w = 20/(20+n)`
  - `ref_u = w*300 + (1-w)*raw_ref`

## 5.5 Physical strain

- `PhysicalStrain = 100 * clip( ln(1 + u_t/30) / ln(1 + ref_u/30), 0, 1 )`

## 6) Recovery

Physiology channels (60-day robust baselines):
- `y_HRV = ln(HRV)`
- `y_RHR = RHR`
- `y_RR = RR`

Direction-normalized z-sign convention in code:
- `z_HRV` uses invert mode (higher = better)
- `z_RHR`, `z_RR` use standard robust z (higher = worse)

Map to 0-100:
- `S = clip(50 - 12.5*z, 0, 100)`

Composite recovery base (renormalized by available components):
- HRV `0.35`
- RHR `0.25`
- RR `0.15`
- Sleep `0.25`

Physiology-only diagnostic:
- `recoveryPhysOnly` = weighted physiology blend (no sleep)

Final recovery (confidence-coupled penalties):
- `Recovery = clip(RecoveryBase - 0.10*C_phys_{t-1}*PhysStrain_{t-1} - 0.05*C_ment_{t-1}*MentStrain_{t-1}, 0, 100)`

## 7) Mental load, strain, MAI stabilization

Urgency scalar:
- `U_t = max_event(importance/5 * exp(-daysToEvent/10))`
- `pressureScore = 100 * clip(U_t, 0, 1)`

Study session load:
- `L_s = d * (1 + 0.003*max(0, d-60))`
- capped: `L*_s = min(L_s, 3*d)`

Daily mental impulse:
- `m_study = sum(L*_s)`
- if `m_study > 0`: `m_final = m_study`
- else: `m_final = 30 * U_t` (bounded background load)

EWMAs:
- `MCL = EWMA_tau21(m_final)`
- `MAL = EWMA_tau3(m_final)`

Mental reference stabilization (same shape as physical):
- window 120d, `n>=20`, cold ref `600`, min ref `200`, `kappa=20`

Mental strain:
- `MentalStrain = 100 * clip( ln(1 + m_final/60) / ln(1 + ref_m/60), 0, 1 )`

MAI stabilization:
- `MCL_ref_effective = max(MCL_ref, 100)` (floor = `0.5*200`)
- `cov14 = study_days_14 / 14`
- `s = sqrt(cov14)`
- `maiRaw = (MAL - MCL) / MCL_ref_effective`
- `MAI = clip(s * maiRaw, -0.25, +0.75)`

## 8) Calibration protocol

### Physical calibration phases

Output phase:
- `uninitialized`: no qualifying sessions in last 42 and lifetime qualifying < 3
- `calibrating`: early history (`3-9` lifetime or days28<7 or days42<10)
- `calibrated`: days28>=7 AND days42>=10 AND sessions42>=12
- `degraded`: no qualifying session for >=14 consecutive days

Effects:
- `uninitialized`: state forced to `no_status`, confidence cap `<=0.40`
- `calibrating`: confidence cap `<=0.70`, wider target band (`+-30%`), build cap `1.2*CTL`
- `degraded`: disallow productive/peaking; confidence multiplier `0.8`

### Mental calibration/gating

- `sparse`: studyDays14 < 3
- `calibrating`: not sparse but studyDays42 < 10
- `calibrated`: studyDays42 >= 10

State gating trigger if any:
- studyDays14 < 3
- base mental confidence < 0.5
- MCL denominator is floored

When triggered, high-risk/high-load mental labels are suppressed unless severe persistent low mental recovery + high pressure.

## 9) States and target ranges

Physical and mental state machines keep threshold structure from prior engine but now consume stabilized denominators and calibration gates.

Targets:
- Physical target center driven by CTL, state multiplier, recovery, exam modulation.
- Mental target center driven by MCL, state multiplier, recovery, exam modulation.
- During sparse mental calibration, center is shrunk toward baseline study impulse.
- Study guidance range is always emitted:
  - `studyTargetLow`, `studyTargetHigh`, `studyRationale`

## 10) Confidence model

- Sleep: coverage-based `C_sleep`
- Recovery: availability mix (HRV/RHR/RR/sleep) * history factor * noise consistency
- Physical: qualifying-day coverage + method quality + calibration caps
- Mental: `0.9 * studyCoverage14`, with denominator-floor penalty and calibration caps

Overall:
- `C_overall = 0.25*C_sleep + 0.30*C_recovery + 0.25*C_physical + 0.20*C_mental`

## 11) Diagnostics exposed in API

`scientificByDate[date]` includes:
- `calibrationStatus` (physical + mental)
- `denominatorDiagnostics` (physical + mental)
- `components.maiRaw`, `components.maiShrinkFactor`, `components.mclRefEffective`, `components.ctlRefEffective`
- `chartPayloads` with explicit raw, normalized, contributions, and confidence

