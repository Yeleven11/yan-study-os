# Scientific Output Schema (Practical Reference)

This file documents the most important fields exposed to the frontend.

## `ScientificDailyMetrics`

Core score fields:

- `sleepScore`
- `recoveryScore`
- `mentalRecovery`
- `physicalStrain`
- `mentalStrain`

Raw/load dynamics:

- `physicalRawLoad`, `mentalRawLoad`
- `physicalChronicLoad`, `physicalAcuteLoad`
- `mentalChronicLoad`, `mentalAcuteLoad`
- `physicalLoadRatio` (AI proxy), `mentalLoadRatio` (MAI proxy)

State outputs:

- `physicalState`
- `mentalState`
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

Targets and guidance:

- `physicalTarget.{low,center,high}`
- `mentalTarget.{low,center,high}`
- `studyTargetLow`
- `studyTargetHigh`
- `studyRationale`

Confidence:

- `confidence.sleep`
- `confidence.recovery`
- `confidence.physicalStrain`
- `confidence.mentalRecovery`
- `confidence.mentalStrain`
- `confidence.overall`

Fallback and narrative:

- `fallbackFlags[]`
- `narrative`

## Chart Metadata Payloads

`chartPayloads` currently contains:

- `physicalStrain`
- `mentalStrain`

Each payload object has:

- `timestamp`
- `rawValue`
- `normalizedValue`
- `componentContributions`
- `confidence`

This is the hover contract used by the scientific charts.

## Explainability Blocks

`explainability.sleep`:

- `reasonCodes[]`
- `userMessages[]`
- `contributionBreakdown`
- `lowReasons[]`
- `highReasons[]`

`explainability.physicalRecovery`:

- `reasonCodes[]`
- `userMessages[]`
- `contributionBreakdown`
- `reasons[]`

`explainability.mentalRecovery`:

- `reasonCodes[]`
- `userMessages[]`
- `contributionBreakdown`
- `reasons[]`

`explainability.targetRange`:

- `reasonCodes[]`
- `userMessages[]`
- `contributionBreakdown`
- `physicalReasons[]`
- `mentalReasons[]`
- `studyRationale`

## Recommendation Cross-Fields

`DailyRecommendation` mirrors study guidance and state for legacy cards:

- `studyTargetHoursLow`, `studyTargetHoursHigh`
- `studyTargetLow`, `studyTargetHigh`
- `studyRationale`
- `physicalState`, `mentalState`
