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
  fileType: "aggregate" | "workout_summary" | "workout_stream" | "ignored" | "unknown";
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

export interface PerformanceGoals {
  sleepHoursTarget: number;
  baselineStudyHours: number;
  weeklyWorkoutTarget: number;
  weekdayWakeTime: string;
  weekendWakeTime: string;
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
}

export interface DailyRecommendation {
  date: string;
  studyTargetHours: number;
  workoutType: WorkoutType;
  workoutDurationMin: number;
  workoutSuggestion: string;
  bedtimeIso: string;
  bedtimeLabel: string;
}

export type PlannerApplyMode = "recommend_only" | "write_targets";
export type PlannerBlockMode = "targets_only" | "time_blocks";
export type PlannerRunSource = "manual" | "auto";
export type PlannerBlockIntensity = "light" | "moderate" | "deep";

export interface PlannerTimeWindow {
  start: string;
  end: string;
  label?: string;
}

export interface PlannerDayTemplate {
  dayOfWeek: number;
  studyWindows: PlannerTimeWindow[];
  blockedWindows: PlannerTimeWindow[];
  minStudyHours: number;
  maxStudyHours: number;
  defaultSessionMin: number;
}

export interface PlannerDateOverride {
  date: string;
  unavailable?: boolean;
  minStudyHours?: number;
  maxStudyHours?: number;
  studyWindows?: PlannerTimeWindow[];
  blockedWindows?: PlannerTimeWindow[];
  note?: string;
}

export interface PlannerWeights {
  examUrgency: number;
  todoUrgency: number;
  readiness: number;
  consistency: number;
  lifeBalance: number;
}

export interface PlannerProfile {
  version: number;
  timezone: string;
  horizonDays: number;
  applyMode: PlannerApplyMode;
  blockMode: PlannerBlockMode;
  includeWorkoutPlanning: boolean;
  includeBedtimeGuidance: boolean;
  defaultSessionMin: number;
  minSessionMin: number;
  maxSessionMin: number;
  breakMin: number;
  maxConsecutiveStudyDays: number;
  recoveryProtectionThreshold: number;
  allowWeekendStudy: boolean;
  weeklyTemplate: PlannerDayTemplate[];
  dateOverrides: PlannerDateOverride[];
  weights: PlannerWeights;
  updatedAt: string;
}

export interface PlannerSubjectAllocation {
  subjectId: SubjectId;
  hours: number;
  reason: string;
}

export interface PlannerStudyBlock {
  startIso: string;
  endIso: string;
  durationMin: number;
  subjectId: SubjectId;
  intensity: PlannerBlockIntensity;
  reason: string;
}

export interface PlannerDayPlan {
  date: string;
  readinessScore: number;
  sleepScore: number;
  recommendedStudyHours: number;
  plannedStudyHours: number;
  availableStudyHours: number;
  minStudyHours: number;
  maxStudyHours: number;
  constrained: boolean;
  notes: string[];
  bedtimeLabel?: string;
  workoutSuggestion?: string;
  subjectAllocations: PlannerSubjectAllocation[];
  blocks: PlannerStudyBlock[];
}

export interface PlannerRunSummary {
  totalPlannedHours: number;
  avgPlannedHours: number;
  constrainedDays: number;
  lowReadinessDays: number;
  highReadinessDays: number;
}

export interface PlannerRun {
  id: string;
  createdAt: string;
  source: PlannerRunSource;
  horizonDays: number;
  startDate: string;
  profile: PlannerProfile;
  summary: PlannerRunSummary;
  days: PlannerDayPlan[];
  applied: boolean;
  appliedAt?: string;
}

export interface PlannedDayTarget {
  date: string;
  studyTargetHours: number;
  workoutType: WorkoutType;
  workoutDurationMin: number;
  bedtimeLabel: string;
  sourceRunId: string;
  createdAt: string;
}

export interface HealthIngestReconcileReport {
  id: string;
  createdAt: string;
  filesProcessed: number;
  filesSkipped: number;
  filesIgnored: number;
  importedHealthDays: number;
  importedWorkouts: number;
  linkedStreams: number;
  canonicalWorkoutCount: number;
  streamBucketCount: number;
  inferredWorkoutCount: number;
  unresolvedStreamBucketCount: number;
  duplicateFilesIgnored: number;
  unknownFilesIgnored: number;
  routeFilesIgnored: number;
  emptyFilesSkipped: number;
  warnings: string[];
}

export interface AppData {
  exams: Exam[];
  studySessions: StudySession[];
  todos: TodoItem[];
  dailyHealth: DailyHealthFact[];
  workouts: WorkoutEntry[];
  workoutDetails: WorkoutDetail[];
  healthRawFiles: HealthRawFile[];
  healthRawRows: HealthRawRow[];
  plannerProfile: PlannerProfile;
  plannerRuns: PlannerRun[];
  plannedTargets: PlannedDayTarget[];
  healthIngestReports: HealthIngestReconcileReport[];
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
    };
