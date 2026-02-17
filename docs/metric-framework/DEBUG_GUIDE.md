# Scientific Engine Debug Guide

This guide explains how to debug day-level outputs from `src/lib/health-engine.ts`.

## Source Files

- Engine: `src/lib/health-engine.ts`
- Shared contracts: `src/lib/types.ts`
- Scientific dashboard: `src/components/scientific-dashboard.tsx`
- Formula reference: `docs/metric-framework/FORMULAS.md`

## Output Maps

`buildPerformanceInsights` emits three per-day maps:

- `readinessByDate`: high-level readiness view (legacy-compatible)
- `recommendationsByDate`: study/workout/bedtime guidance
- `scientificByDate`: full deterministic scientific payload

## High-Value Debug Fields

Sleep:

- `sleepNeedHours`
- `sleepHours`
- `sleepEfficiency`
- `sleepWasoMinutes`
- `sleepMidpointDeltaMinutes`
- `sleepScore`
- `components.sleepDuration`, `components.sleepContinuity`, `components.sleepRegularity`, `components.sleepStages`

Recovery:

- `recoveryScore`
- `components.zLhrv`, `components.zRhr`, `components.zRr`
- `components.compHrv`, `components.compRhr`, `components.compRr`

Physical load:

- `physicalRawLoad` (`u(t)`)
- `physicalChronicLoad` (`CTL`)
- `physicalAcuteLoad` (`ATL`)
- `components.fi`, `components.ai`
- `physicalState`
- `cardioLoad.state`, `cardioLoad.stateScore`

Mental load:

- `mentalRawLoad` (`m(t)`)
- `mentalChronicLoad` (`MCL`)
- `mentalAcuteLoad` (`MAL`)
- `components.mfi`, `components.mai`
- `mentalState`
- `mentalLoadState.state`, `mentalLoadState.stateScore`

Targets and guidance:

- `physicalTarget`, `mentalTarget`
- `studyTargetLow`, `studyTargetHigh`, `studyRationale`

Explainability and confidence:

- `explainability.*`
- `confidence.*`
- `fallbackFlags[]`

Chart hover payloads:

- `chartPayloads.physicalStrain`
- `chartPayloads.mentalStrain`

## Fallback Flags

Most common deterministic flags:

- `sleep_tst_from_tib`: TST estimated from TIB (`0.85 * TIB`)
- `sleep_stage_missing`: stage component unavailable
- `sleep_stage_neutral`: stage component neutralized for compatibility
- `sleep_midpoint_missing`: midpoint unavailable
- `physical_unscored_workouts`: workouts existed but no valid scoring inputs
- `mental_from_exam_urgency`: study missing, mental impulse estimated from exam urgency
- `hrv_outlier`: implausible HRV sample affected consistency factor
- `rhr_jump`: large day-to-day RHR jump affected consistency factor

## State Debugging Checklist

1. Check `components.fi` and `components.ai` for physical state assignment.
2. Check `components.mfi` and `components.mai` for mental state assignment.
3. Verify persistence logic using recent 10-day history:
- overtraining risk: `AI >= 0.35` on >=7 days + low recovery streak
- burnout risk: high `MAI`/low mental recovery persistence
4. Validate threshold records in:
- `cardioLoad.stateThresholds`
- `mentalLoadState.stateThresholds`

## Explainability Debugging

For any day, inspect:

- `explainability.sleep.lowReasons` and `explainability.sleep.highReasons`
- `explainability.physicalRecovery.reasons`
- `explainability.mentalRecovery.reasons`
- `explainability.targetRange.physicalReasons`
- `explainability.targetRange.mentalReasons`
- `explainability.targetRange.studyRationale`

Contribution breakdowns are numeric, additive diagnostics for UI and troubleshooting.

## Confidence Debugging

Per-metric confidence is built from:

- base availability confidence (sleep/recovery/physical/mental)
- history factor (`<7d=0.3`, `7-13d=0.7`, `>=14d=1.0`)
- consistency factor (outlier penalties)

If confidence unexpectedly drops, inspect:

- missing physiological channels (`HRV`, `RHR`, `RR`)
- missing sleep midpoint/stage channels
- fallback workout scoring usage
- recent outlier flags

## Quick Triage Flow

1. Confirm inputs for that date (sleep, physiology, workouts, study, exams/todos).
2. Inspect `fallbackFlags`.
3. Inspect state metrics (`fi/ai/mfi/mai`) and `stateRationale` strings.
4. Inspect explainability reason codes/messages.
5. Confirm chart payload contributions match raw loads.
