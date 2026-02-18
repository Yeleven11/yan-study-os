# Scientific Output Schema (Deterministic Audit Version)

This describes the high-value backend contract emitted by `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/health-engine.ts`.

## ScientificDailyMetrics

Core:
- `sleepScore`
- `recoveryScore`
- `mentalRecovery`
- `physicalStrain`
- `mentalStrain`

Load dynamics:
- `physicalRawLoad`
- `mentalRawLoad`
- `physicalAcuteLoad` (`ATL` on qualifying impulse)
- `physicalChronicLoad` (`CTL` on qualifying impulse)
- `mentalAcuteLoad` (`MAL`)
- `mentalChronicLoad` (`MCL`)
- `physicalLoadRatio` (AI)
- `mentalLoadRatio` (stabilized MAI)

Targets/guidance:
- `physicalTarget.{low,center,high}`
- `mentalTarget.{low,center,high}`
- `studyTargetLow`
- `studyTargetHigh`
- `studyRationale`

States:
- `physicalState` (`no_status` | detraining | maintaining | productive | peaking | fatigued | overtraining_risk)
- `mentalState` (underloaded | maintaining | productive | peaking | fatigued | burnout_risk)
- `cardioLoad`:
  - `state`
  - `stateScore`
  - `stateThresholds`
  - `stateRationale`
- `mentalLoadState`:
  - `state`
  - `stateScore`
  - `stateThresholds`
  - `stateRationale`

Calibration + diagnostics:
- `calibrationStatus.physical`:
  - `phase`
  - `effectiveTrainingDays28`
  - `effectiveTrainingDays42`
  - `qualifyingSessionCount42`
  - `lastQualifyingSessionDate`
  - `reasonCodes[]`
  - `readiness`
- `calibrationStatus.mental`:
  - `phase`
  - `studyDays14`
  - `studyDays42`
  - `coverage14`
  - `reasonCodes[]`
  - `readiness`
- `denominatorDiagnostics.physical`:
  - `ctlRef`
  - `ctlRefEffective`
  - `floored`
  - `validDays`
  - `shrinkWeight`
- `denominatorDiagnostics.mental`:
  - `mclRef`
  - `mclRefEffective`
  - `floored`
  - `validDays`
  - `shrinkWeight`
  - `studyCoverage14`
  - `maiRaw`
  - `maiClamped`
  - `maiShrinkFactor`
  - `stateGated`

Components (`components` object):
- Sleep: `sleepDuration`, `sleepContinuity`, `sleepTiming`, `sleepRegularity`, `sleepSocialJetlag`, `sleepDrift`, `sleepSRI14`, `sleepStages`
- Physiology/load: `zLhrv`, `zRhr`, `zRr`, `compHrv`, `compRhr`, `compRr`, `zApl`, `zAml`, `ctl`, `atl`, `tsb`, `mcl`, `mal`, `fi`, `ai`, `mfi`, `mai`
- MAI diagnostics: `maiRaw`, `maiShrinkFactor`, `mclRefEffective`, `ctlRefEffective`
- Context: `examUrgency`, `pressureScore`, `recoveryPhysOnly`
- Calibration: `qualifyingTrainingDays28`, `qualifyingTrainingDays42`, `qualifyingSessions42`

Confidence (`confidence` object):
- `sleep`
- `recovery`
- `physicalStrain`
- `mentalRecovery`
- `mentalStrain`
- `overall`

Explainability (`explainability` object):
- `sleep`:
  - `reasonCodes[]`
  - `userMessages[]`
  - `contributionBreakdown`
  - `lowReasons[]`
  - `highReasons[]`
- `physicalRecovery`:
  - `reasonCodes[]`
  - `userMessages[]`
  - `contributionBreakdown`
  - `reasons[]`
- `mentalRecovery`:
  - `reasonCodes[]`
  - `userMessages[]`
  - `contributionBreakdown`
  - `reasons[]`
- `targetRange`:
  - `reasonCodes[]`
  - `userMessages[]`
  - `contributionBreakdown`
  - `physicalReasons[]`
  - `mentalReasons[]`
  - `studyRationale`

Chart hover payloads (`chartPayloads`):
- `physicalStrain`:
  - `timestamp`
  - `rawValue`
  - `normalizedValue`
  - `componentContributions`
  - `confidence`
- `mentalStrain`:
  - `timestamp`
  - `rawValue`
  - `normalizedValue`
  - `componentContributions`
  - `confidence`

Other:
- `fallbackFlags[]`
- `narrative`

## DailyRecommendation parity fields

Recommendation mirrors scientific guidance for UI compatibility:
- `studyTargetHoursLow`, `studyTargetHoursHigh`
- `studyTargetLow`, `studyTargetHigh`
- `studyRationale`
- `physicalTargetLow`, `physicalTargetHigh`
- `mentalTargetLow`, `mentalTargetHigh`
- `physicalState`, `mentalState`

