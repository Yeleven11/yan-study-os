# Metric Framework Formulas

This document defines the deterministic model implemented in `src/lib/health-engine.ts`.
The implementation follows the provided research framework and preserves its constants unless explicitly marked as heuristic.

## 1) Global Helpers

- `sigmoid(x) = 1 / (1 + exp(-x))`
- `clip(x, a, b) = min(b, max(a, x))`
- EWMA with half-life `h` days:
  - `decay = exp(-ln(2) / h)`
  - `EWMA_h[d] = decay * EWMA_h[d-1] + (1 - decay) * x[d]`
- Robust baseline over up to 180 prior valid days:
  - `mu = median(history)`
  - `sigma = 1.4826 * median(|x - mu|)`
  - `z = clip((x - mu) / max(sigma, 1e-6), -4, 4)`

## 2) Sleep Score `Sleep_d in [0, 100]`

### Sleep need `Need_d`

- Cold start: `Need_d = 8.0 h`, clipped to `[7.0, 9.5]`.
- Personalization (after >=30 valid days): median TST on “good recovery days” from the prior 180-day window, clipped to `[7.0, 9.5]`.

### Components

1. Duration (asymmetric Gaussian)
   - `Delta = TST_d - Need_d`
   - `sigma = 1.0 if Delta < 0 else 1.5`
   - `S_dur = 100 * exp(-(Delta^2) / (2 * sigma^2))`

2. Efficiency
   - `SE_d = TST_d / max(TIB_d, 0.1)`
   - `S_eff = 100 * clip((SE_d - 0.70) / (0.95 - 0.70), 0, 1)`

3. Regularity
   - Primary: `S_reg = SRI_d`
   - Fallback: midpoint/bedtime variability proxy or TST variability proxy.

4. Timing stability
   - `DeltaMid = wrapped_distance(Mid_d, median_28d(Mid))`
   - `S_tim = 100 * exp(-(DeltaMid^2) / (2 * 1.5^2))`

5. Stage composition
   - `StageIdx_d = (Deep_d + REM_d) / max(TST_d, 0.1)`
   - `S_stage = 100 * exp(-((StageIdx_d - median_180d(StageIdx))^2) / (2 * 0.05^2))`
   - If stage data missing: neutral fallback `S_stage = 50`.

### Weighted sleep score

`Sleep_d = 0.35*S_dur + 0.25*S_eff + 0.25*S_reg + 0.10*S_tim + 0.05*S_stage`

## 3) Physical Load and Physical Strain

### Raw physical load `PLraw_d`

Per workout session `s`:

- `HRR_s = clip((HRavg_s - HRrest_base) / (HRmax_est - HRrest_base), 0, 1)`
- Unisex TRIMP (used when sex is unknown):
  - `TRIMP_s = dur_min_s * HRR_s * 0.75 * exp(1.80 * HRR_s)`

Daily raw load:

- `PLraw_d = sum(TRIMP_s) + PLnonworkout_d`
- `PLnonworkout_d` fallback constants (heuristic):
  - `PLnonworkout_d = 0.003 * steps_d + 0.02 * activeEnergyKJ_d`

### Strain mapping to `[0, 21]`

- `CapPhys_d = max(P95_180d(PLraw), 150)`
- Cold-start cap floor: `200` when long history is not yet available.
- `PhysStrain_d = 21 * clip(ln(1 + PLraw_d) / ln(1 + CapPhys_d), 0, 1)`

## 4) Pressure Scalar `P_d in [0, 1]`

For each upcoming exam/deadline event `j`:

- `P_dj = Imp_j * sigmoid((14 - DeltaDays_dj) / 3)`
- Combined pressure:
  - `P_d = 1 - product_j(1 - P_dj)`

## 5) Mental Load and Mental Strain

Per study session `i`:

- `Switch_d = clip((N_sessions_d - 1) / 5, 0, 1)`
- `Late_di = sigmoid((startHour_i - (Bed_28d - 2)) / 0.5)`
- `I_di = (1 + 0.50*P_d) * (1 + 0.30*Late_di) * (1 + 0.20*Switch_d)`
- `MImp_di = dur_min_i * I_di`

Daily raw mental load:

- `MBack_d = 30 * P_d`
- `MLraw_d = sum_i(MImp_di) + MBack_d`

Mental strain mapping:

- `CapMent_d = max(P95_180d(MLraw), 120)`
- Cold-start cap floor: `180` when long history is not yet available.
- `MentStrain_d = 21 * clip(ln(1 + MLraw_d) / ln(1 + CapMent_d), 0, 1)`

## 6) Recovery Score `Rec_d in [0, 100]`

Inputs are robust z-scores (`zLHRV, zRHR, zRR, zSleep, zAPL, zAML`):

- `APL = EWMA_7d(PLraw)`
- `AML = EWMA_7d(MLraw)`

Primary logit:

- `r_d = 0.90*zLHRV - 0.70*zRHR - 0.50*zRR + 0.60*zSleep - 0.50*zAPL - 0.40*zAML`
- `Rec_d = 100 * sigmoid(r_d)`

Fallbacks:

- If HRV is missing, omit the `zLHRV` term.
- If RR is missing, omit the `zRR` term.

Anti-instability guardrail:

- Daily change is capped to `<= 25` points (or `<= 35` on illness-like spikes).

## 7) Mental Recovery `MRec_d in [0, 100]`

- `m_d = 0.90*zSleep + 0.60*zLHRV - 0.50*zRHR - 0.40*zRR - 0.70*zAML - 0.40*P_d`
- `MRec_d = 100 * sigmoid(m_d)`
- Missing physiology terms are dropped if absent.

## 8) Physical Target Range `[P_low, P_high]`

- `CPL = EWMA_28d(PLraw)`
- `R_phys = (APL + 1) / (CPL + 1)`
- `F_rec = 0.7 + 0.9*(Rec_d / 100)`
- `F_over = exp(-0.35 * max(R_phys - 1.2, 0))`
- `CenterPhysRaw = CPL * F_rec * F_over`
- `WidthPhysRaw = 0.35 * CPL`
- Confidence widening:
  - `WidthPhysRaw *= (1 + 0.5*(1 - Conf_phys))`
- Map with the same raw-to-21 function:
  - `P_center = f_phys(CenterPhysRaw)`
  - `P_low = f_phys(max(CenterPhysRaw - 0.5*WidthPhysRaw, 0))`
  - `P_high = f_phys(CenterPhysRaw + 0.5*WidthPhysRaw)`
- Additional guardrail in implementation:
  - `|P_center[d] - P_center[d-1]| <= 3`

## 9) Mental Target Range `[M_low, M_high]`

- `CML = EWMA_28d(MLraw)`
- `R_ment = (AML + 1) / (CML + 1)`
- `G_rec = 0.7 + 0.9*(MRec_d / 100)`
- `G_over = exp(-0.35 * max(R_ment - 1.2, 0))`
- Underload boost terms:
  - `MentStrain_2d = (MentStrain[d-1] + MentStrain[d-2]) / 2`
  - `Underload = sigmoid((Q25_180d(MentStrain) - MentStrain_2d) / 1.0)`
  - `Gate = sigmoid((MRec_d - 70) / 10)`
  - `G_under = 1 + 0.25 * Underload * Gate`
- `CenterMentRaw = CML * G_rec * G_over * G_under`
- `WidthMentRaw = 0.40 * CML`
- Confidence widening:
  - `WidthMentRaw *= (1 + 0.5*(1 - Conf_ment))`
- Mapping:
  - `M_low = f_ment(max(CenterMentRaw - 0.5*WidthMentRaw, 0))`
  - `M_center = f_ment(CenterMentRaw)`
  - `M_high = f_ment(CenterMentRaw + 0.5*WidthMentRaw)`

## 10) Confidence Scoring

Per metric:

- `Conf_metric = Conf_avail * Conf_noise * Conf_hist`
- `Conf_hist = clip(validDays / 180, 0.2, 1.0)`

Recovery availability decomposition:

- `0.4*HRV + 0.3*RHR + 0.2*RR + 0.1*SleepPresence`

Noise adjustment:

- Penalized when z-scores are extreme and source count is low.

## 11) Outlier and Sanity Rules

- Discard future-dated samples.
- Invalid RHR: `<25` or `>140` bpm.
- Invalid RR: `<6` or `>40` breaths/min.
- HRV SDNN `<=0` invalid; `>500` winsorized.
- Sleep `>16h` treated as invalid unless multi-episode context confirms it.

## 12) Recommendation Layer (Deterministic)

The recommendation layer is deterministic and is built from computed targets + recovery:

- Study target range from mental target center/width.
- Training category from recovery + physical target center/high.
- Bedtime window from preferred schedule adjusted by sleep debt and recovery.
- Narrative summary uses explicit numeric values from that day’s outputs.

