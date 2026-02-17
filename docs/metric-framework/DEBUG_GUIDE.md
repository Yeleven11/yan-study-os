# Metric Framework Debug Guide

This guide explains where each model output comes from and how to debug discrepancies.

## Source of Truth in Code

- Core engine: `src/lib/health-engine.ts`
- Shared data types: `src/lib/types.ts`
- Mobile ingest route: `src/app/api/integrations/health/mobile-sync/route.ts`
- Mobile payload merge: `src/lib/server/health-mobile.ts`
- iOS payload producer: `ios/StudyHealthSync/StudyHealthSync/HealthKit/HealthKitService.swift`

## Daily Outputs

The engine computes a full daily row internally, then publishes three maps:

- `readinessByDate` (legacy-compatible high-level scores)
- `recommendationsByDate` (study/workout/bedtime guidance)
- `scientificByDate` (full scientific model state and diagnostics)

Primary fields for debugging:

- Sleep: `sleepNeedHours`, `sleepHours`, `sleepScore`, `components.sleep*`
- Recovery: `recoveryScore`, `components.z*`
- Physical: `physicalRawLoad`, `physicalStrain`, `physicalAcuteLoad`, `physicalChronicLoad`, `physicalTarget`
- Mental: `mentalRawLoad`, `mentalStrain`, `mentalRecovery`, `mentalAcuteLoad`, `mentalChronicLoad`, `mentalTarget`
- Confidence: `confidence.*`
- Diagnostics: `fallbackFlags[]`

## Fallback Flags

The engine appends deterministic fallback flags whenever proxy logic is used.

Common flags:

- `sleep_tst_from_tib`: TST imputed from `0.85 * TIB`
- `sleep_regularity_proxy`: true SRI unavailable; regularity proxy used
- `sleep_timing_proxy`: timing baseline unavailable
- `sleep_stage_neutral`: stage component set to neutral
- `sleep_bedtime_default`: bedtime defaulted to preferred goal center
- `workout_hrr_from_energy`: HRR inferred from energy rate
- `workout_hrr_from_speed`: HRR inferred from speed
- `physical_nonworkout_load`: no HR workout load, used steps/energy fallback
- `physical_no_activity_data`: little/no physical load signal
- `mental_background_only`: no study sessions, pressure background still applied
- `pressure_context_missing`: no upcoming exam/deadline context
- `recovery_missing_hrv`: HRV term dropped from recovery
- `recovery_missing_rhr`: RHR term dropped from recovery
- `recovery_missing_rr`: RR term dropped from recovery
- `physical_target_guardrail`: day-over-day center change clamped

## Personalization Windows

- Acute state: 7-day EWMA
- Chronic state: 28-day EWMA
- Baselines: up to 180 days
- Sleep-need personalization starts once >=30 valid days are available.

If users only have ~90 days synced, the model still runs; confidence is lower and caps/baselines are less stable than at 180+ days.

## iOS and Ingest Notes

The iOS payload now includes:

- `sleepMidpointHour`
- `sleepBedtimeHour`
- `sleepRegularitySRI` (reserved; currently optional)

These fields are accepted by the mobile sync route and persisted to daily health rows.

## Validation Checklist

When investigating a suspicious day:

1. Check `fallbackFlags` for proxy logic.
2. Check `confidence.overall` and component confidences.
3. Verify raw inputs for impossible physiology values.
4. Verify pressure context (upcoming exams/todos) when mental metrics shift.
5. Verify 7d/28d dynamics (`physicalAcuteLoad`, `physicalChronicLoad`, `mentalAcuteLoad`, `mentalChronicLoad`).

