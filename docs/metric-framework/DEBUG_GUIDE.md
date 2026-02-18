# Scientific Engine Debug Guide (Deterministic Audit Version)

Primary implementation:
- `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/health-engine.ts`

Primary types:
- `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/types.ts`

Formula reference:
- `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/docs/metric-framework/FORMULAS.md`

## 1) Fast triage sequence

1. Inspect `fallbackFlags` for missingness/imputation.
2. Inspect `calibrationStatus` and `denominatorDiagnostics` first.
3. Inspect `components` (`fi/ai/mfi/mai`, timing subscores, pressure).
4. Inspect `explainability` reason codes/messages.
5. Inspect `chartPayloads` hover contributions for raw-vs-normalized sanity.

## 2) Most useful fields by domain

Sleep:
- `sleepNeedHours`
- `sleepHours`
- `sleepEfficiency`
- `sleepWasoMinutes`
- `sleepMidpointDeltaMinutes`
- `components.sleepDuration`
- `components.sleepContinuity`
- `components.sleepTiming`
- `components.sleepSRI14`
- `components.sleepSocialJetlag`
- `components.sleepDrift`
- `components.sleepStages`

Recovery:
- `recoveryScore`
- `components.zLhrv`
- `components.zRhr`
- `components.zRr`
- `components.compHrv`
- `components.compRhr`
- `components.compRr`
- `components.recoveryPhysOnly`

Physical:
- `physicalRawLoad`
- `physicalAcuteLoad` / `physicalChronicLoad`
- `components.fi`, `components.ai`
- `physicalState`
- `cardioLoad.*`
- `calibrationStatus.physical.*`
- `denominatorDiagnostics.physical.*`

Mental:
- `mentalRawLoad`
- `mentalAcuteLoad` / `mentalChronicLoad`
- `components.mfi`, `components.mai`
- `components.maiRaw`, `components.maiShrinkFactor`
- `mentalState`
- `mentalLoadState.*`
- `calibrationStatus.mental.*`
- `denominatorDiagnostics.mental.*`

Targets:
- `physicalTarget`
- `mentalTarget`
- `studyTargetLow`
- `studyTargetHigh`
- `studyRationale`
- `explainability.targetRange.*`

Confidence:
- `confidence.sleep`
- `confidence.recovery`
- `confidence.physicalStrain`
- `confidence.mentalRecovery`
- `confidence.mentalStrain`
- `confidence.overall`

## 3) Calibration debugging

Physical phases:
- `uninitialized`
- `calibrating`
- `calibrated`
- `degraded`

Use:
- `effectiveTrainingDays28`
- `effectiveTrainingDays42`
- `qualifyingSessionCount42`
- `lastQualifyingSessionDate`
- `reasonCodes[]`

Mental phases:
- `sparse`
- `calibrating`
- `calibrated`

Use:
- `studyDays14`
- `studyDays42`
- `coverage14`
- `reasonCodes[]`

## 4) MAI explosion prevention checks

For sparse study history, validate:
- `denominatorDiagnostics.mental.mclRefEffective >= 100`
- `components.mai` within `[-0.25, 0.75]`
- `components.maiShrinkFactor` follows `sqrt(cov14)` behavior
- `denominatorDiagnostics.mental.stateGated` toggles when sparse/floored
- high-risk mental states are suppressed when gating conditions apply

## 5) Sleep timing checks

When timing feels wrong, check:
- bed/wake timestamps exist in input day
- `components.sleepSRI14`
- `components.sleepSocialJetlag`
- `components.sleepDrift`
- `explainability.sleep.reasonCodes`
- `sleep_timing_sparse` fallback flag

## 6) Chart hover checks

Physical chart payload should include:
- raw load
- normalized score
- qualifying vs fallback contributions
- confidence

Mental chart payload should include:
- study load
- bounded background load
- pressure score
- MAI raw/clamped context
- confidence

## 7) Common fallback flags

- `sleep_tst_from_tib`
- `sleep_invalid_duration`
- `sleep_stage_missing`
- `sleep_stage_neutral`
- `sleep_timing_sparse`
- `sleep_midpoint_missing`
- `physical_unscored_workouts`
- `mental_background_from_pressure`
- `mental_from_exam_urgency`
- `hrv_outlier`
- `rhr_jump`

