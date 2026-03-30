export type SubjectId =
  | "math_aa_hl"
  | "physics_hl"
  | "computer_science_hl"
  | "german_lang_lit_sl"
  | "english_lang_lit_sl"
  | "business_sl";

export interface SubjectDefinition {
  id: SubjectId;
  name: string;
  shortName: string;
  color: string;
}

export interface Exam {
  id: string;
  subjectId: SubjectId;
  title: string;
  paper: string;
  startsAt: string;
  importance?: number;
}

export interface StudySession {
  id: string;
  subjectId: SubjectId;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  createdAt: string;
}

export interface TodoItem {
  id: string;
  title: string;
  subjectId: SubjectId;
  deadline: string;
  ultraPriority: boolean;
  completed: boolean;
  archived: boolean;
  createdAt: string;
  completedAt?: string;
}

export type FlashcardStatus = "new" | "learning" | "review" | "relearning";
export type FlashcardOutcome = "correct" | "incorrect";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  status: FlashcardStatus;
  dueAt: string;
  createdAt: string;
  updatedAt: string;
  intervalDays: number;
  easeFactor: number;
  learningStepIndex?: number;
  reviewCount: number;
  lapseCount: number;
  consecutiveCorrect: number;
  lastReviewedAt?: string;
  lastOutcome?: FlashcardOutcome;
}

export interface FlashcardGradeInput {
  cardId: string;
  outcome: FlashcardOutcome;
  reviewedAt: string;
}

export interface FlashcardSessionSnapshot {
  generatedAt: string;
  timezone: string;
  totalCards: number;
  dueNowCount: number;
  criticalTodayCount: number;
  optionalCount: number;
  nextDueAt?: string;
  currentCardId?: string;
  currentCardDueNow: boolean;
  currentCardCritical: boolean;
}

export type SubjectTotals = Record<SubjectId, number>;

export interface DayStudyAggregate {
  date: string;
  totalSec: number;
  dominantSubjectId?: SubjectId;
  bySubject: SubjectTotals;
  sessionCount: number;
}

export interface AppSettings {
  timezone: string;
  examHighlightColor: string;
}

export type WorkoutType = "cardio" | "strength" | "mobility" | "recovery";
export type TrainingCategory =
  | "rest_walk"
  | "recovery"
  | "easy_run"
  | "steady_run"
  | "quality_run";
export type SleepDriverKey =
  | "debt"
  | "duration"
  | "regularity"
  | "stage"
  | "awake"
  | "schedule";
export type WorkoutStreamType =
  | "summary"
  | "heart_rate"
  | "distance"
  | "steps"
  | "active_energy"
  | "resting_energy"
  | "hr_recovery"
  | "other";

export interface WorkoutEntry {
  id: string;
  sourceWorkoutKey?: string;
  workoutNameRaw?: string;
  workoutDisplayLabel?: string;
  mergeConfidence?: number;
  streamCount?: number;
  type: WorkoutType;
  startedAt: string;
  endedAt: string;
  durationMin: number;
  activeKcal?: number;
  activeEnergyKj?: number;
  restingEnergyKj?: number;
  avgHeartRate?: number;
  hrMin?: number;
  hrMax?: number;
  hrAvg?: number;
  distanceKm?: number;
  avgSpeedKmh?: number;
  maxSpeedKmh?: number;
  stepCount?: number;
  avgCadenceSpm?: number;
  flights?: number;
  elevationAscM?: number;
  elevationDescM?: number;
  intensityKcalHrKg?: number;
  difficultyAuto?: number;
  difficultyUser?: number;
  difficultyEffective?: number;
  trainingLoad?: number;
  source: "manual" | "health_import" | "sample";
  createdAt: string;
}

export interface DailyHealthFact {
  date: string;
  sleepHours: number;
  sleepAsleepHours?: number;
  sleepInBedHours?: number;
  sleepCoreHours?: number;
  sleepDeepHours?: number;
  sleepRemHours?: number;
  sleepAwakeHours?: number;
  hrvMs?: number;
  restingHrBpm?: number;
  heartRateMinBpm?: number;
  heartRateMaxBpm?: number;
  heartRateAvgBpm?: number;
  respiratoryRateBpm?: number;
  sleepMidpointHour?: number;
  sleepBedtimeHour?: number;
  sleepBedtimeAt?: string;
  sleepWakeupAt?: string;
  sleepRegularitySRI?: number;
  steps?: number;
  walkRunDistanceKm?: number;
  activeEnergyKj?: number;
  restingEnergyKj?: number;
  physicalEffort?: number;
  exerciseTimeMin?: number;
  standHours?: number;
  standTimeMin?: number;
  wristTemperatureC?: number;
  source: "health_import" | "sample" | "manual";
  createdAt: string;
}

export interface WorkoutStreamPoint {
  timestamp: string;
  value?: number;
  min?: number;
  max?: number;
  avg?: number;
  context?: string;
}

export interface WorkoutStream {
  id: string;
  workoutKey: string;
  streamType: WorkoutStreamType;
  sourceFile: string;
  startedAt?: string;
  endedAt?: string;
  rows: WorkoutStreamPoint[];
}

export interface WorkoutDetail {
  workoutId: string;
  workoutKey: string;
  workoutType: WorkoutType;
  workoutNameRaw?: string;
  workoutDisplayLabel?: string;
  startedAt: string;
  endedAt: string;
  durationMin: number;
  mergeConfidence: number;
  streamCount: number;
  distanceKm?: number;
  avgSpeedKmh?: number;
  maxSpeedKmh?: number;
  activeEnergyKj?: number;
  restingEnergyKj?: number;
  stepCount?: number;
  avgCadenceSpm?: number;
  flights?: number;
  elevationAscM?: number;
  elevationDescM?: number;
  hrMin?: number;
  hrMax?: number;
  hrAvg?: number;
  sourceFiles: string[];
  streams: WorkoutStream[];
  heartRateSeries?: WorkoutStreamPoint[];
  distanceSeries?: WorkoutStreamPoint[];
  stepSeries?: WorkoutStreamPoint[];
  activeEnergySeries?: WorkoutStreamPoint[];
  restingEnergySeries?: WorkoutStreamPoint[];
}

export interface HealthRawFile {
  id: string;
  hash: string;
  filename: string;
  fileType:
    | "aggregate"
    | "workout_summary"
    | "workout_stream"
    | "mobile_sync"
    | "ignored"
    | "unknown";
  rowCount: number;
  importedAt: string;
  ignoredReason?: string;
}

export interface HealthRawRow {
  id: string;
  fileId: string;
  rowIndex: number;
  timestamp?: string;
  workoutKey?: string;
  values: Record<string, string>;
}

export interface MobileSyncSeriesPoint {
  timestamp: string;
  value: number;
}

export interface MobileSyncWorkoutStreams {
  heartRateSeries?: MobileSyncSeriesPoint[];
  distanceSeries?: MobileSyncSeriesPoint[];
  stepSeries?: MobileSyncSeriesPoint[];
  activeEnergySeries?: MobileSyncSeriesPoint[];
  restingEnergySeries?: MobileSyncSeriesPoint[];
}

export interface MobileSyncWorkoutInput {
  hkWorkoutUuid: string;
  workoutType: string;
  startedAt: string;
  endedAt: string;
  durationMin: number;
  distanceKm?: number;
  activeEnergyKj?: number;
  restingEnergyKj?: number;
  avgHeartRate?: number;
  hrMin?: number;
  hrMax?: number;
  hrAvg?: number;
  stepCount?: number;
  streams?: MobileSyncWorkoutStreams;
}

export interface MobileSyncDailyHealthInput {
  date: string;
  sleepHours?: number;
  sleepAsleepHours?: number;
  sleepInBedHours?: number;
  sleepCoreHours?: number;
  sleepDeepHours?: number;
  sleepRemHours?: number;
  sleepAwakeHours?: number;
  sleepMidpointHour?: number;
  sleepBedtimeHour?: number;
  sleepBedtimeAt?: string;
  sleepWakeupAt?: string;
  sleepRegularitySRI?: number;
  hrvMs?: number;
  restingHrBpm?: number;
  heartRateMinBpm?: number;
  heartRateMaxBpm?: number;
  heartRateAvgBpm?: number;
  respiratoryRateBpm?: number;
  steps?: number;
  walkRunDistanceKm?: number;
  activeEnergyKj?: number;
  restingEnergyKj?: number;
  exerciseTimeMin?: number;
}

export interface MobileSyncDeletion {
  sampleType: string;
  uuid: string;
  deletedAt: string;
}

export interface MobileSyncRequest {
  schemaVersion: 1 | 2;
  batchId: string;
  idempotencyKey?: string;
  generatedAt: string;
  device: {
    deviceId: string;
    appVersion: string;
    osVersion: string;
    timezone: string;
  };
  syncWindow?: {
    from?: string;
    to?: string;
  };
  settings?: {
    syncIntervalMinutes?: number;
  };
  dailyHealth?: MobileSyncDailyHealthInput[];
  workouts?: MobileSyncWorkoutInput[];
  deletions?: MobileSyncDeletion[];
}

export interface MobileSyncResponse {
  ok: true;
  schemaVersion: 1 | 2;
  importedHealthDays: number;
  importedWorkouts: number;
  updatedWorkouts: number;
  filesProcessed: number;
  filesSkipped: number;
  linkedStreams: number;
  duplicateBatch: boolean;
  serverTime: string;
  nextSuggestedSyncSeconds: number;
}

export interface PerformanceGoals {
  sleepHoursTarget: number;
  baselineStudyHours: number;
  weeklyWorkoutTarget: number;
  weekdayWakeTime: string;
  weekendWakeTime: string;
  preferredBedtimeStart: string;
  preferredBedtimeEnd: string;
  ageYears: number;
}

export interface DailyReadiness {
  date: string;
  score: number;
  zone: "green" | "yellow" | "orange" | "red";
  confidence: number;
  sleepScore: number;
  sleepDurationScore: number;
  sleepRegularityScore: number;
  sleepStageScore: number;
  sleepAwakeScore: number;
  sleepScheduleScore: number;
  sleepDriverMode: "negative" | "positive";
  sleepDriverKey: SleepDriverKey;
  sleepDriverImpact: number;
  sleepDriverSentence: string;
  sleepComponent: number;
  autonomicComponent: number;
  loadComponent: number;
  cognitiveComponent: number;
  penalty: number;
  sleepDebtHours: number;
  sleepHours: number;
  loadRatio: number;
  zHrv: number;
  zRhr: number;
  recoveryScore?: number;
  mentalRecoveryScore?: number;
  physicalStrain?: number;
  mentalStrain?: number;
  physicalTargetLow?: number;
  physicalTargetHigh?: number;
  mentalTargetLow?: number;
  mentalTargetHigh?: number;
  pressure?: number;
  confidenceSleep?: number;
  confidenceRecovery?: number;
  confidencePhysical?: number;
  confidenceMental?: number;
}

export interface DailyRecommendation {
  date: string;
  studyTargetHours: number;
  trainingCategory: TrainingCategory;
  trainingLabel: string;
  runMinutesMin: number;
  runMinutesMax: number;
  walkMinutesMin: number;
  walkMinutesMax: number;
  targetRpeMin: number;
  targetRpeMax: number;
  trainingRationale: string;
  isRunRecommended: boolean;
  workoutType: WorkoutType;
  workoutDurationMin: number;
  workoutSuggestion: string;
  bedtimeIso: string;
  bedtimeLabel: string;
  bedtimeRangeStartIso: string;
  bedtimeRangeEndIso: string;
  bedtimeRangeStartLabel: string;
  bedtimeRangeEndLabel: string;
  bedtimeRangeLabel: string;
  bedtimeRangeMinutes: number;
  studyTargetHoursLow?: number;
  studyTargetHoursHigh?: number;
  studyTargetLow?: number;
  studyTargetHigh?: number;
  studyRationale?: string;
  recommendedFreshAirMinutes?: number;
  physicalTargetLow?: number;
  physicalTargetHigh?: number;
  mentalTargetLow?: number;
  mentalTargetHigh?: number;
  physicalState?: PhysicalLoadState;
  mentalState?: MentalLoadState;
  scientificSummary?: string;
}

export type PhysicalLoadState =
  | "no_status"
  | "detraining"
  | "maintaining"
  | "productive"
  | "peaking"
  | "fatigued"
  | "overtraining_risk";

export type MentalLoadState =
  | "underloaded"
  | "maintaining"
  | "productive"
  | "peaking"
  | "fatigued"
  | "burnout_risk";

export interface ScientificExplainabilityBlock {
  reasonCodes: string[];
  userMessages: string[];
  contributionBreakdown: Record<string, number>;
}

export interface ScientificSleepExplainability extends ScientificExplainabilityBlock {
  lowReasons: string[];
  highReasons: string[];
}

export interface ScientificRecoveryExplainability extends ScientificExplainabilityBlock {
  reasons: string[];
}

export interface ScientificTargetExplainability extends ScientificExplainabilityBlock {
  physicalReasons: string[];
  mentalReasons: string[];
  studyRationale: string;
}

export interface ScientificChartPointPayload {
  timestamp: string;
  rawValue: number;
  normalizedValue: number;
  componentContributions: Record<string, number>;
  confidence: number;
}

export interface ScientificCardioLoadState {
  state: PhysicalLoadState;
  stateScore: number;
  stateThresholds: Record<string, number>;
  stateRationale: string;
}

export interface ScientificMentalLoadState {
  state: MentalLoadState;
  stateScore: number;
  stateThresholds: Record<string, number>;
  stateRationale: string;
}

export interface ScientificMetricComponents {
  sleepDuration: number;
  sleepContinuity: number;
  sleepTiming: number;
  sleepRegularity: number;
  sleepSocialJetlag: number;
  sleepDrift: number;
  sleepSRI14: number;
  sleepStages: number;
  zLhrv: number;
  zRhr: number;
  zRr: number;
  zApl: number;
  zAml: number;
  compHrv: number;
  compRhr: number;
  compRr: number;
  underload: number;
  gate: number;
  gUnder: number;
  ctl: number;
  atl: number;
  tsb: number;
  mcl: number;
  mal: number;
  fi: number;
  ai: number;
  mfi: number;
  mai: number;
  maiRaw?: number;
  maiShrinkFactor?: number;
  mclRefEffective?: number;
  ctlRefEffective?: number;
  examUrgency: number;
  pressureScore?: number;
  recoveryPhysOnly?: number;
  qualifyingTrainingDays28?: number;
  qualifyingTrainingDays42?: number;
  qualifyingSessions42?: number;
}

export interface ScientificTargetRange {
  low: number;
  center: number;
  high: number;
}

export interface ScientificMetricConfidence {
  sleep: number;
  recovery: number;
  physicalStrain: number;
  mentalRecovery: number;
  mentalStrain: number;
  overall: number;
}

export type PhysicalCalibrationPhase =
  | "uninitialized"
  | "calibrating"
  | "calibrated"
  | "degraded";

export type MentalCalibrationPhase = "sparse" | "calibrating" | "calibrated";

export interface ScientificPhysicalCalibrationStatus {
  phase: PhysicalCalibrationPhase;
  effectiveTrainingDays28: number;
  effectiveTrainingDays42: number;
  qualifyingSessionCount42: number;
  lastQualifyingSessionDate?: string;
  reasonCodes: string[];
  readiness: number;
}

export interface ScientificMentalCalibrationStatus {
  phase: MentalCalibrationPhase;
  studyDays14: number;
  studyDays42: number;
  coverage14: number;
  reasonCodes: string[];
  readiness: number;
}

export interface ScientificCalibrationStatus {
  physical: ScientificPhysicalCalibrationStatus;
  mental: ScientificMentalCalibrationStatus;
}

export interface ScientificDenominatorDiagnostics {
  physical: {
    ctlRef: number;
    ctlRefEffective: number;
    floored: boolean;
    validDays: number;
    shrinkWeight: number;
  };
  mental: {
    mclRef: number;
    mclRefEffective: number;
    floored: boolean;
    validDays: number;
    shrinkWeight: number;
    studyCoverage14: number;
    maiRaw: number;
    maiClamped: number;
    maiShrinkFactor: number;
    stateGated: boolean;
  };
}

export interface ScientificDailyMetrics {
  date: string;
  sleepNeedHours: number;
  sleepHours: number;
  sleepEfficiency: number;
  sleepWasoMinutes: number;
  sleepMidpointDeltaMinutes: number;
  sleepScore: number;
  recoveryScore: number;
  physicalStrain: number;
  mentalRecovery: number;
  mentalStrain: number;
  physicalRawLoad: number;
  mentalRawLoad: number;
  pressure: number;
  physicalAcuteLoad: number;
  physicalChronicLoad: number;
  mentalAcuteLoad: number;
  mentalChronicLoad: number;
  physicalLoadRatio: number; // AI proxy relative to CTL_ref
  mentalLoadRatio: number; // MAI proxy relative to MCL_ref
  physicalCap: number;
  mentalCap: number;
  physicalTarget: ScientificTargetRange;
  mentalTarget: ScientificTargetRange;
  physicalState: PhysicalLoadState;
  mentalState: MentalLoadState;
  cardioLoad: ScientificCardioLoadState;
  mentalLoadState: ScientificMentalLoadState;
  calibrationStatus?: ScientificCalibrationStatus;
  denominatorDiagnostics?: ScientificDenominatorDiagnostics;
  studyTargetLow: number;
  studyTargetHigh: number;
  studyRationale: string;
  components: ScientificMetricComponents;
  confidence: ScientificMetricConfidence;
  chartPayloads: {
    physicalStrain: ScientificChartPointPayload;
    mentalStrain: ScientificChartPointPayload;
  };
  explainability: {
    sleep: ScientificSleepExplainability;
    physicalRecovery: ScientificRecoveryExplainability;
    mentalRecovery: ScientificRecoveryExplainability;
    targetRange: ScientificTargetExplainability;
  };
  fallbackFlags: string[];
  narrative: string;
}


export interface HealthImportDeadLetter {
  id: string;
  channel: "csv" | "mobile" | "batch";
  idempotencyKey?: string;
  schemaVersion?: number;
  requestHash: string;
  payloadPreview: string;
  firstFailedAt: string;
  lastFailedAt: string;
  retryCount: number;
  errorCode: string;
  errorMessage: string;
}

export interface AppData {
  exams: Exam[];
  studySessions: StudySession[];
  todos: TodoItem[];
  flashcards: Flashcard[];
  dailyHealth: DailyHealthFact[];
  workouts: WorkoutEntry[];
  workoutDetails: WorkoutDetail[];
  healthRawFiles: HealthRawFile[];
  healthRawRows: HealthRawRow[];
  healthImportDeadLetters: HealthImportDeadLetter[];
  goals: PerformanceGoals;
  settings: AppSettings;
}

export interface DashboardBootstrap extends AppData {
  generatedAt: string;
}

export interface ActiveTimerState {
  subjectId: SubjectId;
  startedAt: string;
  elapsedBeforePauseSec: number;
  isRunning: boolean;
  resumedAt?: string;
}

export type OfflineAction =
  | {
      id: string;
      type: "createStudySession";
      payload: StudySession;
      createdAt: string;
    }
  | {
      id: string;
      type: "createTodo";
      payload: TodoItem;
      createdAt: string;
    }
  | {
      id: string;
      type: "updateTodo";
      payload: { id: string; patch: Partial<TodoItem> };
      createdAt: string;
    }
  | {
      id: string;
      type: "archiveTodo";
      payload: { id: string };
      createdAt: string;
    }
  | {
      id: string;
      type: "restoreTodo";
      payload: { id: string };
      createdAt: string;
    }
  | {
      id: string;
      type: "updateExams";
      payload: { exams: Exam[] };
      createdAt: string;
    }
  | {
      id: string;
      type: "createFlashcard";
      payload: Flashcard;
      createdAt: string;
    }
  | {
      id: string;
      type: "gradeFlashcard";
      payload: FlashcardGradeInput;
      createdAt: string;
    };
