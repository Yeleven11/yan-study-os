import {
  createDefaultPerformanceGoals,
  DEFAULT_BASELINE_STUDY_HOURS,
  DEFAULT_SLEEP_HOURS_TARGET,
  DEFAULT_WEEKLY_WORKOUT_TARGET,
} from "@/lib/constants";
import { toDateKey } from "@/lib/dashboard-utils";
import type {
  AppData,
  DailyHealthFact,
  DailyReadiness,
  DailyRecommendation,
  Exam,
  MentalLoadState,
  PerformanceGoals,
  PhysicalLoadState,
  ScientificDailyMetrics,
  SleepDriverKey,
  StudySession,
  TodoItem,
  TrainingCategory,
  WorkoutDetail,
  WorkoutEntry,
} from "@/lib/types";

const EPSILON = 1e-6;
const MIN_BASELINE_DAYS = 21;
const SLEEP_NEED_ANCHOR_MIN = 480;
const SLEEP_NEED_MIN = 420;
const SLEEP_NEED_MAX = 600;
const DURATION_DEFICIT_SCALE = 0.35;
const OVERSLEEP_GRACE_MIN = 60;
const OVERSLEEP_PENALTY_WINDOW_MIN = 240;
const SLEEP_OVERSLEEP_MAX_PENALTY = 10;

const CONTINUITY_EFF_MIN = 0.75;
const CONTINUITY_EFF_SPAN = 0.15;
const CONTINUITY_AWAKE_PENALTY_MAX = 20;
const CONTINUITY_AWAKE_BASE_MIN = 20;
const CONTINUITY_AWAKE_SPAN = 80;

const REGULARITY_SCALE_MIN = 90;
const STAGE_DEEP_FLOOR = 0.13;
const STAGE_REM_FLOOR = 0.2;

const SLEEP_WEIGHT_DURATION = 0.5;
const SLEEP_WEIGHT_CONTINUITY = 0.25;
const SLEEP_WEIGHT_REGULARITY = 0.15;
const SLEEP_WEIGHT_STAGES = 0.1;

const TAU_CTL_DAYS = 42;
const TAU_ATL_DAYS = 7;
const TAU_MCL_DAYS = 21;
const TAU_MAL_DAYS = 3;

const PHYSICAL_STRAIN_U0 = 30;
const PHYSICAL_STRAIN_COLD_REF = 300;
const PHYSICAL_STRAIN_MIN_REF = 150;

const MENTAL_STRAIN_M0 = 60;
const MENTAL_STRAIN_COLD_REF = 600;
const MENTAL_STRAIN_MIN_REF = 200;

const RECOVERY_SLEEP_WEIGHT = 0.25;
const RECOVERY_HRV_WEIGHT = 0.35;
const RECOVERY_RHR_WEIGHT = 0.25;
const RECOVERY_RR_WEIGHT = 0.15;

const EXAM_DECAY_DAYS = 10;

const DAYS_10 = 10;
const DAYS_14 = 14;
const DAYS_21 = 21;
const DAYS_28 = 28;
const DAYS_30 = 30;
const DAYS_42 = 42;
const DAYS_56 = 56;
const DAYS_90 = 90;
const DAYS_180 = 180;
const DAYS_365 = 365;

const TRAINING_CATEGORY_RANK: Record<TrainingCategory, number> = {
  rest_walk: 0,
  recovery: 1,
  easy_run: 2,
  steady_run: 3,
  quality_run: 4,
};

type TrainingPrescription = {
  category: TrainingCategory;
  label: string;
  runMinutesMin: number;
  runMinutesMax: number;
  walkMinutesMin: number;
  walkMinutesMax: number;
  targetRpeMin: number;
  targetRpeMax: number;
  isRunRecommended: boolean;
};

const TRAINING_PRESCRIPTIONS: Record<TrainingCategory, TrainingPrescription> = {
  rest_walk: {
    category: "rest_walk",
    label: "Rest + Walk",
    runMinutesMin: 0,
    runMinutesMax: 0,
    walkMinutesMin: 30,
    walkMinutesMax: 60,
    targetRpeMin: 1,
    targetRpeMax: 2,
    isRunRecommended: false,
  },
  recovery: {
    category: "recovery",
    label: "Recovery Run",
    runMinutesMin: 20,
    runMinutesMax: 35,
    walkMinutesMin: 20,
    walkMinutesMax: 40,
    targetRpeMin: 3,
    targetRpeMax: 4,
    isRunRecommended: true,
  },
  easy_run: {
    category: "easy_run",
    label: "Easy Run",
    runMinutesMin: 35,
    runMinutesMax: 55,
    walkMinutesMin: 15,
    walkMinutesMax: 30,
    targetRpeMin: 4,
    targetRpeMax: 5,
    isRunRecommended: true,
  },
  steady_run: {
    category: "steady_run",
    label: "Steady Run",
    runMinutesMin: 45,
    runMinutesMax: 70,
    walkMinutesMin: 10,
    walkMinutesMax: 25,
    targetRpeMin: 6,
    targetRpeMax: 7,
    isRunRecommended: true,
  },
  quality_run: {
    category: "quality_run",
    label: "Quality Run",
    runMinutesMin: 50,
    runMinutesMax: 80,
    walkMinutesMin: 10,
    walkMinutesMax: 20,
    targetRpeMin: 7,
    targetRpeMax: 9,
    isRunRecommended: true,
  },
};

export type PerformanceInsights = {
  usingSampleData: boolean;
  goals: PerformanceGoals;
  healthDays: DailyHealthFact[];
  workouts: WorkoutEntry[];
  readinessByDate: Record<string, DailyReadiness>;
  recommendationsByDate: Record<string, DailyRecommendation>;
  scientificByDate: Record<string, ScientificDailyMetrics>;
  todayReadiness: DailyReadiness;
  todayRecommendation: DailyRecommendation;
  todayScientific: ScientificDailyMetrics;
  weeklyWorkoutCount: number;
  weeklyWorkoutTarget: number;
  daysSinceWorkout: number;
  daysSinceRun: number;
  trendDelta7d: number;
};

type DailyRow = {
  date: string;
  sleepNeedMin: number;
  sleepAsleepMin?: number;
  sleepInBedMin?: number;
  sleepEfficiency?: number;
  sleepWasoMin?: number;
  sleepMidpointMin?: number;
  sleepMidpointDeltaMin?: number;
  sleepDurationScore?: number;
  sleepContinuityScore?: number;
  sleepRegularityScore?: number;
  sleepStagesScore?: number;
  sleepScore: number;
  sleepReasonCodes: string[];
  sleepLowReasons: string[];
  sleepHighReasons: string[];
  sleepContribution: Record<string, number>;
  sleepMessages: string[];

  hrvLn?: number;
  zHrv?: number;
  zRhr?: number;
  zRr?: number;
  compHrv?: number;
  compRhr?: number;
  compRr?: number;

  examUrgency: number;
  physicalImpulse: number;
  physicalImpulseWorkout: number;
  physicalImpulseFallback: number;
  workoutMethod: "hr_series" | "avg_hr" | "pace" | "energy" | "none";
  ctl: number;
  atl: number;
  tsb: number;
  physicalRef: number;
  physicalStrain: number;

  mentalImpulse: number;
  mentalSessionImpulse: number;
  mcl: number;
  mal: number;
  mentalRef: number;
  mentalStrain: number;

  recoveryBase: number;
  recoveryScore: number;
  recoveryReasonCodes: string[];
  recoveryReasons: string[];
  recoveryMessages: string[];
  recoveryContribution: Record<string, number>;

  mentalRecovery: number;
  mentalRecoveryReasonCodes: string[];
  mentalRecoveryReasons: string[];
  mentalRecoveryMessages: string[];
  mentalRecoveryContribution: Record<string, number>;
  underload: number;
  gate: number;
  gUnder: number;

  fi: number;
  ai: number;
  mfi: number;
  mai: number;
  physicalState: PhysicalLoadState;
  mentalState: MentalLoadState;

  physicalTargetCenterRaw: number;
  physicalTargetMinRaw: number;
  physicalTargetMaxRaw: number;
  physicalTargetCenter: number;
  physicalTargetLow: number;
  physicalTargetHigh: number;

  mentalTargetCenterRaw: number;
  mentalTargetMinRaw: number;
  mentalTargetMaxRaw: number;
  mentalTargetCenter: number;
  mentalTargetLow: number;
  mentalTargetHigh: number;

  studyTargetLow: number;
  studyTargetHigh: number;
  studyRationale: string;

  targetReasonCodes: string[];
  targetPhysicalReasons: string[];
  targetMentalReasons: string[];
  targetMessages: string[];
  targetContribution: Record<string, number>;

  sleepConfidence: number;
  recoveryConfidence: number;
  physicalConfidence: number;
  mentalConfidence: number;
  overallConfidence: number;

  fallbackFlags: string[];
  narrative: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function quantile(values: number[], q: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) {
    return sorted[0];
  }

  const position = clamp(q, 0, 1) * (sorted.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) {
    return sorted[lower];
  }

  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function mad(values: number[], center = median(values)): number {
  if (values.length === 0) {
    return 0;
  }

  const deviations = values.map((value) => Math.abs(value - center));
  return median(deviations);
}

function robustScale(values: number[]): number {
  return 1.4826 * mad(values);
}

function robustZ(value: number, history: number[], invert = false): number {
  if (!Number.isFinite(value) || history.length < 7) {
    return 0;
  }

  const center = median(history);
  const scale = Math.max(robustScale(history), EPSILON);
  const raw = invert ? (center - value) / scale : (value - center) / scale;
  return clamp(raw, -4, 4);
}

function circularDistanceMinutes(left: number, right: number): number {
  const a = ((left % 1440) + 1440) % 1440;
  const b = ((right % 1440) + 1440) % 1440;
  const diff = Math.abs(a - b);
  return Math.min(diff, 1440 - diff);
}

function circularMedianMinutes(values: number[]): number | undefined {
  if (values.length === 0) {
    return undefined;
  }

  let best = values[0];
  let bestCost = Number.POSITIVE_INFINITY;

  for (const candidate of values) {
    const cost = values.reduce(
      (sum, value) => sum + circularDistanceMinutes(candidate, value),
      0,
    );

    if (cost < bestCost) {
      bestCost = cost;
      best = candidate;
    }
  }

  return ((best % 1440) + 1440) % 1440;
}

function ewmaTau(previous: number, current: number, tauDays: number): number {
  const k = 1 - Math.exp(-1 / Math.max(tauDays, 1));
  return previous + k * (current - previous);
}

function safeFinite(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

function positiveFinite(value: unknown): number | undefined {
  const parsed = safeFinite(value);
  if (typeof parsed !== "number" || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function shiftDate(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function buildDateRange(startDateKey: string, endDateKey: string): string[] {
  const start = new Date(`${startDateKey}T00:00:00`);
  const end = new Date(`${endDateKey}T00:00:00`);
  const result: string[] = [];

  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end) {
    return result;
  }

  const cursor = new Date(start);
  while (cursor <= end) {
    result.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

function parseClockToMinutes(timeValue: string, fallbackMinutes: number): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeValue.trim());
  if (!match) {
    return fallbackMinutes;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return fallbackMinutes;
  }

  return hours * 60 + minutes;
}

function formatClockLabel(minutesFromMidnight: number): string {
  const safe = ((Math.floor(minutesFromMidnight) % 1440) + 1440) % 1440;
  const hours = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (safe % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function toIsoOnDate(dateKey: string, minutesFromMidnight: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  const safeMinutes = ((Math.floor(minutesFromMidnight) % 1440) + 1440) % 1440;
  date.setHours(0, 0, 0, 0);
  date.setMinutes(safeMinutes);
  return date.toISOString();
}

function normalizeGoals(goals: Partial<PerformanceGoals> | undefined): PerformanceGoals {
  const defaults = createDefaultPerformanceGoals();

  return {
    sleepHoursTarget:
      typeof goals?.sleepHoursTarget === "number" && Number.isFinite(goals.sleepHoursTarget)
        ? goals.sleepHoursTarget
        : DEFAULT_SLEEP_HOURS_TARGET,
    baselineStudyHours:
      typeof goals?.baselineStudyHours === "number" && Number.isFinite(goals.baselineStudyHours)
        ? goals.baselineStudyHours
        : DEFAULT_BASELINE_STUDY_HOURS,
    weeklyWorkoutTarget:
      typeof goals?.weeklyWorkoutTarget === "number" &&
      Number.isFinite(goals.weeklyWorkoutTarget)
        ? goals.weeklyWorkoutTarget
        : DEFAULT_WEEKLY_WORKOUT_TARGET,
    weekdayWakeTime:
      typeof goals?.weekdayWakeTime === "string" && goals.weekdayWakeTime.trim().length > 0
        ? goals.weekdayWakeTime
        : defaults.weekdayWakeTime,
    weekendWakeTime:
      typeof goals?.weekendWakeTime === "string" && goals.weekendWakeTime.trim().length > 0
        ? goals.weekendWakeTime
        : defaults.weekendWakeTime,
    preferredBedtimeStart:
      typeof goals?.preferredBedtimeStart === "string" &&
      goals.preferredBedtimeStart.trim().length > 0
        ? goals.preferredBedtimeStart
        : defaults.preferredBedtimeStart,
    preferredBedtimeEnd:
      typeof goals?.preferredBedtimeEnd === "string" && goals.preferredBedtimeEnd.trim().length > 0
        ? goals.preferredBedtimeEnd
        : defaults.preferredBedtimeEnd,
    ageYears:
      typeof goals?.ageYears === "number" && Number.isFinite(goals.ageYears)
        ? goals.ageYears
        : defaults.ageYears,
  };
}

function windowCenterMinutes(startMinutes: number, endMinutes: number): number {
  if (endMinutes >= startMinutes) {
    return Math.round((startMinutes + endMinutes) / 2);
  }

  const wrappedEnd = endMinutes + 1440;
  const centerWrapped = Math.round((startMinutes + wrappedEnd) / 2);
  return centerWrapped % 1440;
}

function sentenceForDriver(mode: "negative" | "positive", key: SleepDriverKey): string {
  if (mode === "negative") {
    if (key === "duration") {
      return "Sleep score is mainly limited by sleep duration relative to your current need.";
    }
    if (key === "regularity") {
      return "Sleep score is mainly limited by irregular sleep midpoint timing.";
    }
    if (key === "stage") {
      return "Sleep score is mainly limited by low deep/REM stage composition.";
    }
    if (key === "awake") {
      return "Sleep score is mainly limited by fragmentation and awake time.";
    }
    if (key === "schedule") {
      return "Sleep score is mainly limited by midpoint shifts from your baseline.";
    }
    return "Sleep score is mainly limited by accumulated sleep debt.";
  }

  if (key === "duration") {
    return "Sleep score is mainly supported by strong duration relative to your current need.";
  }
  if (key === "regularity") {
    return "Sleep score is mainly supported by consistent midpoint timing.";
  }
  if (key === "stage") {
    return "Sleep score is mainly supported by healthy deep/REM composition.";
  }
  if (key === "awake") {
    return "Sleep score is mainly supported by good continuity and low awake time.";
  }
  if (key === "schedule") {
    return "Sleep score is mainly supported by stable circadian timing.";
  }
  return "Sleep score is mainly supported by low sleep debt.";
}

function zoneForScore(score: number): DailyReadiness["zone"] {
  if (score >= 75) {
    return "green";
  }
  if (score >= 55) {
    return "yellow";
  }
  if (score >= 40) {
    return "orange";
  }
  return "red";
}

function getWeekStartDate(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateKey(date);
}

function isWalkSession(workout: WorkoutEntry): boolean {
  const label = `${workout.workoutNameRaw || ""} ${workout.workoutDisplayLabel || ""}`.toLowerCase();
  return workout.type === "recovery" || label.includes("walk");
}

function isRunSession(workout: WorkoutEntry): boolean {
  const label = `${workout.workoutNameRaw || ""} ${workout.workoutDisplayLabel || ""}`.toLowerCase();
  if (label.includes("run") || label.includes("jog")) {
    return true;
  }
  return workout.type === "cardio" && !isWalkSession(workout);
}

function classifyWorkoutMode(workout: WorkoutEntry): "walk" | "run" | "cycle" | "swim" | "other" {
  const label = `${workout.workoutNameRaw || ""} ${workout.workoutDisplayLabel || ""}`.toLowerCase();
  if (label.includes("walk") || workout.type === "recovery") {
    return "walk";
  }
  if (label.includes("run") || label.includes("jog")) {
    return "run";
  }
  if (label.includes("cycle") || label.includes("bike") || label.includes("cycling")) {
    return "cycle";
  }
  if (label.includes("swim")) {
    return "swim";
  }
  return "other";
}

function workoutAverageHeartRate(workout: WorkoutEntry): number | undefined {
  if (typeof workout.hrAvg === "number" && Number.isFinite(workout.hrAvg)) {
    return workout.hrAvg;
  }
  if (typeof workout.avgHeartRate === "number" && Number.isFinite(workout.avgHeartRate)) {
    return workout.avgHeartRate;
  }
  return undefined;
}

function computeWorkoutDifficultyAuto(
  workout: WorkoutEntry,
  goals: PerformanceGoals,
  restingHr: number,
): number {
  const durationNorm = clamp((workout.durationMin || 0) / 70, 0, 1);
  const distanceNorm = clamp((workout.distanceKm || 0) / 12, 0, 1);
  const avgHr = workoutAverageHeartRate(workout);
  const hrMax = 208 - 0.7 * goals.ageYears;

  const hrr =
    typeof avgHr === "number" && hrMax - restingHr > 1
      ? clamp((avgHr - restingHr) / (hrMax - restingHr), 0, 1)
      : undefined;

  const intensityNorm =
    typeof hrr === "number"
      ? hrr
      : typeof workout.avgSpeedKmh === "number" && Number.isFinite(workout.avgSpeedKmh)
      ? clamp(workout.avgSpeedKmh / 15, 0, 1)
      : clamp(0.55 * durationNorm + 0.45 * distanceNorm, 0, 1);

  const loadIndex = clamp(0.55 * intensityNorm + 0.25 * durationNorm + 0.2 * distanceNorm, 0, 1);
  return clamp(Math.round(1 + 9 * loadIndex), 1, 10);
}

function examImportance(exam: Exam): number {
  if (typeof exam.importance === "number" && Number.isFinite(exam.importance)) {
    return clamp(exam.importance, 1, 5);
  }

  const text = `${exam.title} ${exam.paper}`.toLowerCase();
  if (text.includes("internal") || text.includes("oral") || text.includes("ia")) {
    return 3;
  }
  if (text.includes("paper 3")) {
    return 5;
  }
  return 4;
}

function todoImportance(todo: TodoItem): number {
  if (todo.ultraPriority) {
    return 3;
  }
  return 2;
}

function daysUntil(dateFromMs: number, eventIso: string): number {
  const eventMs = new Date(eventIso).getTime();
  if (!Number.isFinite(eventMs)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.floor((eventMs - dateFromMs) / 86_400_000);
}

function computeExamUrgency(dateKey: string, exams: Exam[], todos: TodoItem[]): number {
  const dateStartMs = new Date(`${dateKey}T00:00:00`).getTime();
  if (!Number.isFinite(dateStartMs)) {
    return 0;
  }

  let urgency = 0;

  for (const exam of exams) {
    const daysRemaining = daysUntil(dateStartMs, exam.startsAt);
    if (daysRemaining < 0) {
      continue;
    }

    const u =
      clamp(examImportance(exam) / 5, 0, 1) * Math.exp(-daysRemaining / EXAM_DECAY_DAYS);
    urgency = Math.max(urgency, u);
  }

  for (const todo of todos) {
    if (todo.archived || todo.completed) {
      continue;
    }

    const daysRemaining = daysUntil(dateStartMs, todo.deadline);
    if (daysRemaining < 0) {
      continue;
    }

    const u =
      clamp(todoImportance(todo) / 5, 0, 1) * Math.exp(-daysRemaining / EXAM_DECAY_DAYS);
    urgency = Math.max(urgency, u);
  }

  return clamp(urgency, 0, 1);
}

function physicalStrainFromImpulse(impulse: number, impulseRef: number): number {
  const safeRef = Math.max(impulseRef, PHYSICAL_STRAIN_MIN_REF);
  const numerator = Math.log(1 + Math.max(impulse, 0) / PHYSICAL_STRAIN_U0);
  const denominator = Math.log(1 + safeRef / PHYSICAL_STRAIN_U0);
  return clamp(100 * (numerator / Math.max(denominator, EPSILON)), 0, 100);
}

function mentalStrainFromImpulse(impulse: number, impulseRef: number): number {
  const safeRef = Math.max(impulseRef, MENTAL_STRAIN_MIN_REF);
  const numerator = Math.log(1 + Math.max(impulse, 0) / MENTAL_STRAIN_M0);
  const denominator = Math.log(1 + safeRef / MENTAL_STRAIN_M0);
  return clamp(100 * (numerator / Math.max(denominator, EPSILON)), 0, 100);
}

function rollingP95(values: number[], fallback: number, floor: number): number {
  if (values.length === 0) {
    return fallback;
  }

  return Math.max(quantile(values, 0.95), floor);
}

function sleepReasonText(code: string): string {
  if (code === "SLEEP_UNDERSLEPT") {
    return "Sleep duration was below your personalized need.";
  }
  if (code === "SLEEP_FRAGMENTED") {
    return "Continuity was reduced by low efficiency or high awake time.";
  }
  if (code === "SLEEP_IRREGULAR_TIMING") {
    return "Sleep midpoint shifted significantly from your 21-day baseline.";
  }
  if (code === "SLEEP_STAGE_LOW_CONFIDENCE") {
    return "Stage data is incomplete or low-confidence, so stage effects are conservative.";
  }
  if (code === "SLEEP_OVERSLEPT_NEUTRAL") {
    return "Sleep exceeded need, but the model treats this mostly neutral when continuity is good.";
  }
  if (code === "SLEEP_LONG_IN_BED_LOW_EFF") {
    return "Time in bed was much longer than time asleep, which can indicate fragmentation.";
  }
  return code;
}

function recoveryReasonText(code: string): string {
  if (code === "RECOVERY_HRV_LOW") {
    return "HRV is below your recent baseline.";
  }
  if (code === "RECOVERY_RHR_HIGH") {
    return "Resting HR is above your recent baseline.";
  }
  if (code === "RECOVERY_RR_HIGH") {
    return "Respiratory rate is above your recent baseline.";
  }
  if (code === "RECOVERY_SLEEP_LOW") {
    return "Sleep score is currently low.";
  }
  if (code === "RECOVERY_LOAD_PENALTY") {
    return "Yesterday’s physical or mental strain applied a recovery penalty.";
  }
  if (code === "RECOVERY_DATA_SPARSE") {
    return "Missing physiology channels reduced certainty in recovery scoring.";
  }
  return code;
}

function targetReasonText(code: string): string {
  if (code === "TARGET_PHYSICAL_DETRAINING") {
    return "Cardio load is below your reference, so targets bias upward to rebuild.";
  }
  if (code === "TARGET_PHYSICAL_MAINTAINING") {
    return "Cardio load is in a maintenance band, so targets stay moderate.";
  }
  if (code === "TARGET_PHYSICAL_PRODUCTIVE") {
    return "Cardio load is in the productive band, so targets support progressive work.";
  }
  if (code === "TARGET_PHYSICAL_PEAKING") {
    return "Cardio load is high and stable, so targets taper volume while preserving readiness.";
  }
  if (code === "TARGET_PHYSICAL_FATIGUED") {
    return "Acute overload or low recovery was detected, so physical targets were reduced.";
  }
  if (code === "TARGET_PHYSICAL_OVERTRAINING_RISK") {
    return "Sustained overload risk was detected, so physical targets were strongly reduced.";
  }
  if (code === "TARGET_MENTAL_UNDERLOADED") {
    return "Mental load is below your reference, so study targets are raised to re-enter productive range.";
  }
  if (code === "TARGET_MENTAL_PRODUCTIVE") {
    return "Mental load is in a productive band, so targets support steady distributed practice.";
  }
  if (code === "TARGET_MENTAL_PEAKING") {
    return "Exam-linked peaking conditions are present, so study targets are intentionally elevated.";
  }
  if (code === "TARGET_MENTAL_FATIGUED") {
    return "Mental fatigue signals are elevated, so study targets are reduced today.";
  }
  if (code === "TARGET_MENTAL_BURNOUT_RISK") {
    return "Burnout-risk persistence was detected, so study targets were cut and recovery is prioritized.";
  }
  if (code === "TARGET_EXAM_URGENCY_HIGH") {
    return "High exam urgency shifted targets toward strategic, focused workload.";
  }
  if (code === "TARGET_EXAM_URGENCY_MODERATE") {
    return "Moderate exam urgency slightly adjusted today’s targets.";
  }
  return code;
}

function sanitizeHealthDay(raw: DailyHealthFact): DailyHealthFact {
  const next: DailyHealthFact = { ...raw };

  const rhr = safeFinite(raw.restingHrBpm);
  if (typeof rhr === "number" && (rhr < 25 || rhr > 140)) {
    next.restingHrBpm = undefined;
  }

  const rr = safeFinite(raw.respiratoryRateBpm);
  if (typeof rr === "number" && (rr < 6 || rr > 40)) {
    next.respiratoryRateBpm = undefined;
  }

  const hrv = safeFinite(raw.hrvMs);
  if (typeof hrv === "number") {
    if (hrv < 5 || hrv > 400) {
      next.hrvMs = undefined;
    }
  }

  const sleepHours = positiveFinite(raw.sleepHours);
  if (typeof sleepHours === "number" && sleepHours > 16) {
    next.sleepHours = 0;
    next.sleepAsleepHours = undefined;
  }

  if (typeof raw.sleepMidpointHour === "number" && Number.isFinite(raw.sleepMidpointHour)) {
    const normalized = ((raw.sleepMidpointHour % 24) + 24) % 24;
    next.sleepMidpointHour = normalized;
  }

  if (typeof raw.sleepBedtimeHour === "number" && Number.isFinite(raw.sleepBedtimeHour)) {
    const normalized = ((raw.sleepBedtimeHour % 24) + 24) % 24;
    next.sleepBedtimeHour = normalized;
  }

  return next;
}

function sleepNeedForDay(index: number, rows: DailyRow[]): number {
  if (index < MIN_BASELINE_DAYS || rows.length < MIN_BASELINE_DAYS) {
    return SLEEP_NEED_ANCHOR_MIN;
  }

  const start = Math.max(0, rows.length - DAYS_56);
  const goodDayDurations: number[] = [];

  for (let i = start; i < rows.length; i += 1) {
    const row = rows[i];
    const prev = i > 0 ? rows[i - 1] : undefined;

    if (
      typeof row.sleepAsleepMin === "number" &&
      typeof row.sleepEfficiency === "number" &&
      row.recoveryScore >= 60 &&
      row.sleepEfficiency >= 0.85 &&
      (prev?.physicalStrain ?? 0) <= 70
    ) {
      goodDayDurations.push(row.sleepAsleepMin);
    }
  }

  if (goodDayDurations.length < 7) {
    return SLEEP_NEED_ANCHOR_MIN;
  }

  return clamp(median(goodDayDurations), SLEEP_NEED_MIN, SLEEP_NEED_MAX);
}

function physicalStateRationale(state: PhysicalLoadState, fi: number, ai: number, recovery: number): string {
  return `Physical state ${state} (FI ${fi.toFixed(2)}, AI ${ai.toFixed(2)}, Recovery ${Math.round(recovery)}).`;
}

function mentalStateRationale(state: MentalLoadState, mfi: number, mai: number, mentalRecovery: number): string {
  return `Mental state ${state} (MFI ${mfi.toFixed(2)}, MAI ${mai.toFixed(2)}, Mental recovery ${Math.round(mentalRecovery)}).`;
}

function buildTrainingCategory(
  physicalState: PhysicalLoadState,
  recoveryScore: number,
  targetCenter: number,
  daysSinceRun: number,
): TrainingCategory {
  let category: TrainingCategory;

  if (physicalState === "overtraining_risk" || physicalState === "fatigued") {
    category = "rest_walk";
  } else if (physicalState === "detraining") {
    category = recoveryScore >= 60 ? "steady_run" : "easy_run";
  } else if (physicalState === "peaking") {
    category = recoveryScore >= 70 ? "easy_run" : "recovery";
  } else if (targetCenter >= 70 && recoveryScore >= 70) {
    category = "quality_run";
  } else if (targetCenter >= 55) {
    category = "steady_run";
  } else if (targetCenter >= 35) {
    category = "easy_run";
  } else {
    category = "recovery";
  }

  if (daysSinceRun >= 14) {
    category = TRAINING_CATEGORY_RANK[category] < TRAINING_CATEGORY_RANK.easy_run ? "easy_run" : category;
  } else if (daysSinceRun >= 7) {
    category = TRAINING_CATEGORY_RANK[category] < TRAINING_CATEGORY_RANK.recovery ? "recovery" : category;
  }

  return category;
}

function computeDaysSinceRun(dateKey: string, workoutsByDate: Map<string, WorkoutEntry[]>): number {
  for (let daysBack = 0; daysBack <= 180; daysBack += 1) {
    const candidate = shiftDate(dateKey, -daysBack);
    const sessions = workoutsByDate.get(candidate) || [];
    if (sessions.some((session) => isRunSession(session))) {
      return daysBack;
    }
  }

  return 181;
}

function recentValues(values: number[], count: number): number[] {
  if (values.length <= count) {
    return values;
  }
  return values.slice(values.length - count);
}

function extractSeriesHr(detail: WorkoutDetail | undefined): number[] {
  if (!detail?.heartRateSeries || detail.heartRateSeries.length === 0) {
    return [];
  }

  return detail.heartRateSeries
    .map((point) => {
      if (typeof point.value === "number" && Number.isFinite(point.value)) {
        return point.value;
      }
      if (typeof point.avg === "number" && Number.isFinite(point.avg)) {
        return point.avg;
      }
      return undefined;
    })
    .filter((value): value is number => typeof value === "number");
}

function workoutDayKey(workout: WorkoutEntry): string {
  return toDateKey(workout.startedAt);
}

function runModel({
  dateWindow,
  healthByDate,
  workoutsByDate,
  sessionsByDate,
  workoutDetailsByWorkoutId,
  goals,
  exams,
  todos,
}: {
  dateWindow: string[];
  healthByDate: Map<string, DailyHealthFact>;
  workoutsByDate: Map<string, WorkoutEntry[]>;
  sessionsByDate: Map<string, StudySession[]>;
  workoutDetailsByWorkoutId: Map<string, WorkoutDetail>;
  goals: PerformanceGoals;
  exams: Exam[];
  todos: TodoItem[];
}): DailyRow[] {
  const rows: DailyRow[] = [];

  let ctl = 0;
  let atl = 0;
  let mcl = 0;
  let mal = 0;

  let sleepDebtHours = 0;

  const sleepMidpointHistory: number[] = [];
  const hrvLnHistory: number[] = [];
  const rhrHistory: number[] = [];
  const rrHistory: number[] = [];
  const impulseHistory: number[] = [];
  const mentalImpulseHistory: number[] = [];
  const ctlHistory: number[] = [];
  const atlHistory: number[] = [];
  const mclHistory: number[] = [];
  const malHistory: number[] = [];
  const physicalStrainHistory: number[] = [];
  const mentalStrainHistory: number[] = [];
  const aiHistory: number[] = [];
  const maiHistory: number[] = [];
  const recoveryHistory: number[] = [];
  const mentalRecoveryHistory: number[] = [];

  const hrMaxCandidates: Array<{ date: string; value: number }> = [];

  const energyRateByMode = new Map<string, number[]>();

  for (let dayIndex = 0; dayIndex < dateWindow.length; dayIndex += 1) {
    const date = dateWindow[dayIndex];
    const health = healthByDate.get(date);
    const workouts = workoutsByDate.get(date) || [];
    const sessions = sessionsByDate.get(date) || [];
    const fallbackFlags: string[] = [];

    const sleepNeedMin = sleepNeedForDay(dayIndex, rows);

    let sleepAsleepMin =
      positiveFinite(health?.sleepAsleepHours) !== undefined
        ? (positiveFinite(health?.sleepAsleepHours) as number) * 60
        : positiveFinite(health?.sleepHours) !== undefined
        ? (positiveFinite(health?.sleepHours) as number) * 60
        : undefined;

    const sleepInBedMin =
      positiveFinite(health?.sleepInBedHours) !== undefined
        ? (positiveFinite(health?.sleepInBedHours) as number) * 60
        : undefined;

    if (typeof sleepAsleepMin !== "number" && typeof sleepInBedMin === "number") {
      sleepAsleepMin = 0.85 * sleepInBedMin;
      fallbackFlags.push("sleep_tst_from_tib");
    }

    if (typeof sleepAsleepMin === "number" && sleepAsleepMin > 16 * 60) {
      sleepAsleepMin = undefined;
      fallbackFlags.push("sleep_invalid_duration");
    }

    let sleepMidpointMin =
      typeof health?.sleepMidpointHour === "number" && Number.isFinite(health.sleepMidpointHour)
        ? ((health.sleepMidpointHour % 24) + 24) % 24 * 60
        : undefined;

    const sleepBedtimeMin =
      typeof health?.sleepBedtimeHour === "number" && Number.isFinite(health.sleepBedtimeHour)
        ? ((health.sleepBedtimeHour % 24) + 24) % 24 * 60
        : undefined;

    if (
      typeof sleepMidpointMin !== "number" &&
      typeof sleepBedtimeMin === "number" &&
      typeof sleepAsleepMin === "number"
    ) {
      sleepMidpointMin = (sleepBedtimeMin + sleepAsleepMin / 2) % 1440;
    }

    const wasoMin =
      positiveFinite(health?.sleepAwakeHours) !== undefined
        ? (positiveFinite(health?.sleepAwakeHours) as number) * 60
        : typeof sleepInBedMin === "number" && typeof sleepAsleepMin === "number"
        ? Math.max(0, sleepInBedMin - sleepAsleepMin)
        : undefined;

    const sleepEfficiency =
      typeof sleepAsleepMin === "number" && typeof sleepInBedMin === "number"
        ? clamp(sleepAsleepMin / Math.max(sleepInBedMin, 1), 0, 1.5)
        : undefined;

    const durationScore = (() => {
      if (typeof sleepAsleepMin !== "number") {
        return undefined;
      }

      const deficit = Math.max(0, sleepNeedMin - sleepAsleepMin);
      if (deficit > 0) {
        const ratio = deficit / Math.max(DURATION_DEFICIT_SCALE * sleepNeedMin, 1);
        return clamp(100 * Math.max(0, 1 - ratio ** 2), 0, 100);
      }

      const excess = Math.max(0, sleepAsleepMin - sleepNeedMin);
      const ratio = Math.max(0, excess - OVERSLEEP_GRACE_MIN) / OVERSLEEP_PENALTY_WINDOW_MIN;
      return clamp(100 - SLEEP_OVERSLEEP_MAX_PENALTY * ratio ** 2, 0, 100);
    })();

    const continuityScore = (() => {
      if (typeof sleepEfficiency !== "number") {
        return undefined;
      }

      const scoreEff = clamp(
        (100 * (sleepEfficiency - CONTINUITY_EFF_MIN)) / CONTINUITY_EFF_SPAN,
        0,
        100,
      );
      const penaltyAwake =
        typeof wasoMin === "number"
          ? CONTINUITY_AWAKE_PENALTY_MAX *
            clamp(
              (wasoMin - CONTINUITY_AWAKE_BASE_MIN) / CONTINUITY_AWAKE_SPAN,
              0,
              1,
            )
          : 0;
      return clamp(scoreEff - penaltyAwake, 0, 100);
    })();

    const midpointBaseline = circularMedianMinutes(
      recentValues(sleepMidpointHistory, DAYS_21),
    );

    const midpointDelta =
      typeof sleepMidpointMin === "number" && typeof midpointBaseline === "number"
        ? circularDistanceMinutes(sleepMidpointMin, midpointBaseline)
        : undefined;

    const regularityScore =
      typeof midpointDelta === "number"
        ? clamp(100 / (1 + (midpointDelta / REGULARITY_SCALE_MIN) ** 2), 0, 100)
        : undefined;

    const deepMin =
      positiveFinite(health?.sleepDeepHours) !== undefined
        ? (positiveFinite(health?.sleepDeepHours) as number) * 60
        : undefined;
    const remMin =
      positiveFinite(health?.sleepRemHours) !== undefined
        ? (positiveFinite(health?.sleepRemHours) as number) * 60
        : undefined;

    const stagesScore =
      typeof sleepAsleepMin === "number" &&
      sleepAsleepMin > 0 &&
      typeof deepMin === "number" &&
      typeof remMin === "number"
        ? clamp(
            100 -
              400 * Math.max(0, STAGE_DEEP_FLOOR - deepMin / sleepAsleepMin) -
              250 * Math.max(0, STAGE_REM_FLOOR - remMin / sleepAsleepMin),
            0,
            100,
          )
        : undefined;

    const sleepComponents: Array<{ key: string; value: number; weight: number }> = [];

    if (typeof durationScore === "number") {
      sleepComponents.push({
        key: "duration",
        value: durationScore,
        weight: SLEEP_WEIGHT_DURATION,
      });
    }
    if (typeof continuityScore === "number") {
      sleepComponents.push({
        key: "continuity",
        value: continuityScore,
        weight: SLEEP_WEIGHT_CONTINUITY,
      });
    }
    if (typeof regularityScore === "number") {
      sleepComponents.push({
        key: "regularity",
        value: regularityScore,
        weight: SLEEP_WEIGHT_REGULARITY,
      });
    }
    if (typeof stagesScore === "number") {
      sleepComponents.push({
        key: "stages",
        value: stagesScore,
        weight: SLEEP_WEIGHT_STAGES,
      });
    } else {
      fallbackFlags.push("sleep_stage_missing");
      fallbackFlags.push("sleep_stage_neutral");
    }

    if (typeof sleepMidpointMin !== "number") {
      fallbackFlags.push("sleep_midpoint_missing");
    }

    const sleepWeightSum = sleepComponents.reduce((sum, item) => sum + item.weight, 0);
    const sleepScore =
      sleepWeightSum > 0
        ? clamp(
            sleepComponents.reduce(
              (sum, item) => sum + item.value * (item.weight / sleepWeightSum),
              0,
            ),
            0,
            100,
          )
        : 50;

    const sleepContribution: Record<string, number> = {
      duration: 0,
      continuity: 0,
      regularity: 0,
      stages: 0,
    };

    for (const item of sleepComponents) {
      sleepContribution[item.key] = round(item.value * (item.weight / Math.max(sleepWeightSum, EPSILON)), 2);
    }

    const sleepReasonCodes: string[] = [];

    if (typeof sleepAsleepMin === "number" && sleepAsleepMin < sleepNeedMin - 30) {
      sleepReasonCodes.push("SLEEP_UNDERSLEPT");
    }
    if (
      (typeof sleepEfficiency === "number" && sleepEfficiency < 0.85) ||
      (typeof wasoMin === "number" && wasoMin > 30)
    ) {
      sleepReasonCodes.push("SLEEP_FRAGMENTED");
    }
    if (typeof midpointDelta === "number" && midpointDelta > 60) {
      sleepReasonCodes.push("SLEEP_IRREGULAR_TIMING");
    }
    if (typeof stagesScore !== "number") {
      sleepReasonCodes.push("SLEEP_STAGE_LOW_CONFIDENCE");
    }
    if (
      typeof sleepAsleepMin === "number" &&
      sleepAsleepMin > sleepNeedMin + 60 &&
      (sleepEfficiency || 0) >= 0.85
    ) {
      sleepReasonCodes.push("SLEEP_OVERSLEPT_NEUTRAL");
    }
    if (
      typeof sleepInBedMin === "number" &&
      typeof sleepAsleepMin === "number" &&
      sleepInBedMin - sleepAsleepMin > 90
    ) {
      sleepReasonCodes.push("SLEEP_LONG_IN_BED_LOW_EFF");
    }

    const sleepLowReasons = sleepReasonCodes
      .filter((code) => code !== "SLEEP_OVERSLEPT_NEUTRAL")
      .map(sleepReasonText);

    const sleepHighReasons: string[] = [];
    if ((durationScore || 0) >= 85) {
      sleepHighReasons.push("Sleep duration was close to your personalized need.");
    }
    if ((continuityScore || 0) >= 80) {
      sleepHighReasons.push("Sleep continuity was strong with limited awake time.");
    }
    if ((regularityScore || 0) >= 75) {
      sleepHighReasons.push("Sleep midpoint remained stable versus baseline.");
    }

    const sleepMessages = [
      `You slept ${(sleepAsleepMin || 0) / 60 >= 0 ? ((sleepAsleepMin || 0) / 60).toFixed(1) : "0.0"}h vs need ${(sleepNeedMin / 60).toFixed(1)}h.`,
      ...sleepReasonCodes.slice(0, 3).map(sleepReasonText),
    ];

    const restingHr = safeFinite(health?.restingHrBpm);
    const respRate = safeFinite(health?.respiratoryRateBpm);
    const hrvMs = safeFinite(health?.hrvMs);

    if (typeof restingHr === "number") {
      rhrHistory.push(restingHr);
    }
    if (typeof respRate === "number") {
      rrHistory.push(respRate);
    }

    if (typeof hrvMs === "number") {
      hrvLnHistory.push(Math.log(Math.max(hrvMs, EPSILON)));
    }

    const hrvLn = typeof hrvMs === "number" ? Math.log(Math.max(hrvMs, EPSILON)) : undefined;

    const zHrv =
      typeof hrvLn === "number"
        ? robustZ(
            hrvLn,
            recentValues(hrvLnHistory.slice(0, Math.max(0, hrvLnHistory.length - 1)), DAYS_28),
          )
        : undefined;

    const zRhr =
      typeof restingHr === "number"
        ? robustZ(
            restingHr,
            recentValues(rhrHistory.slice(0, Math.max(0, rhrHistory.length - 1)), DAYS_28),
            true,
          )
        : undefined;

    const zRr =
      typeof respRate === "number"
        ? robustZ(
            respRate,
            recentValues(rrHistory.slice(0, Math.max(0, rrHistory.length - 1)), DAYS_28),
            true,
          )
        : undefined;

    const compHrv = typeof zHrv === "number" ? clamp(50 + 20 * zHrv, 0, 100) : undefined;
    const compRhr = typeof zRhr === "number" ? clamp(50 + 20 * zRhr, 0, 100) : undefined;
    const compRr = typeof zRr === "number" ? clamp(50 + 15 * zRr, 0, 100) : undefined;

    const hrMaxCandidatesBefore = hrMaxCandidates.filter(
      (item) =>
        new Date(`${date}T00:00:00`).getTime() - new Date(`${item.date}T00:00:00`).getTime() <=
        DAYS_365 * 86_400_000,
    );

    hrMaxCandidates.length = 0;
    hrMaxCandidates.push(...hrMaxCandidatesBefore);

    for (const workout of workouts) {
      if (
        typeof workout.hrMax === "number" &&
        Number.isFinite(workout.hrMax) &&
        workout.hrMax >= 140 &&
        workout.durationMin >= 5
      ) {
        hrMaxCandidates.push({ date, value: workout.hrMax });
      }
    }

    const hrMaxEst =
      hrMaxCandidates.length > 0
        ? Math.max(...hrMaxCandidates.map((item) => item.value))
        : 200;

    const rhrBaseline = (() => {
      const candidates = recentValues(rhrHistory, DAYS_14);
      if (candidates.length > 0) {
        return median(candidates);
      }
      if (typeof restingHr === "number") {
        return restingHr;
      }
      return 55;
    })();

    let physicalImpulse = 0;
    let physicalImpulseWorkout = 0;
    let physicalImpulseFallback = 0;
    let methodUsed: DailyRow["workoutMethod"] = "none";

    for (const workout of workouts) {
      const durationMin = Math.max(0, workout.durationMin || 0);
      if (durationMin <= 0) {
        continue;
      }

      const detail = workoutDetailsByWorkoutId.get(workout.id);
      const hrSeries = extractSeriesHr(detail);

      let sessionTrimp = 0;
      let sessionMethod: DailyRow["workoutMethod"] = "none";

      if (hrSeries.length > 0 && hrMaxEst - rhrBaseline > 1) {
        const avgContribution =
          hrSeries.reduce((sum, hr) => {
            const hrr = clamp((hr - rhrBaseline) / Math.max(hrMaxEst - rhrBaseline, 1), 0, 1);
            return sum + hrr * Math.exp(1.8 * hrr);
          }, 0) / hrSeries.length;
        sessionTrimp = durationMin * avgContribution;
        sessionMethod = "hr_series";
      } else {
        const avgHr = workoutAverageHeartRate(workout);
        if (typeof avgHr === "number" && hrMaxEst - rhrBaseline > 1) {
          const hrr = clamp((avgHr - rhrBaseline) / Math.max(hrMaxEst - rhrBaseline, 1), 0, 1);
          sessionTrimp = durationMin * hrr * Math.exp(1.8 * hrr);
          sessionMethod = "avg_hr";
        } else {
          const mode = classifyWorkoutMode(workout);
          if (
            (mode === "walk" || mode === "run") &&
            typeof workout.distanceKm === "number" &&
            Number.isFinite(workout.distanceKm) &&
            workout.distanceKm > 0
          ) {
            const speedMPerMin = (workout.distanceKm * 1000) / durationMin;
            const vo2 = mode === "walk" ? 0.1 * speedMPerMin + 3.5 : 0.2 * speedMPerMin + 3.5;
            const met = Math.max(1, vo2 / 3.5);
            const hrrProxy = clamp((met - 1.5) / 10, 0.2, 0.95);
            sessionTrimp = durationMin * hrrProxy * Math.exp(1.8 * hrrProxy);
            sessionMethod = "pace";
          } else {
            const activeKcal =
              typeof workout.activeKcal === "number" && Number.isFinite(workout.activeKcal)
                ? workout.activeKcal
                : typeof workout.activeEnergyKj === "number" && Number.isFinite(workout.activeEnergyKj)
                ? workout.activeEnergyKj / 4.184
                : undefined;

            if (typeof activeKcal === "number" && activeKcal > 0) {
              const modeKey = classifyWorkoutMode(workout);
              const historyKey = `energy:${modeKey}`;
              const history = energyRateByMode.get(historyKey) || [];
              const kcalPerMin = activeKcal / Math.max(durationMin, 1);
              const baselineRate = history.length >= 3 ? median(recentValues(history, DAYS_42)) : kcalPerMin;
              const norm = kcalPerMin / Math.max(baselineRate, 0.1);
              const hrrProxy = clamp(0.35 + 0.25 * (norm - 1), 0.2, 0.9);
              sessionTrimp = durationMin * hrrProxy * Math.exp(1.8 * hrrProxy);
              sessionMethod = "energy";

              history.push(kcalPerMin);
              energyRateByMode.set(historyKey, recentValues(history, DAYS_42));
            }
          }
        }
      }

      physicalImpulse += sessionTrimp;
      if (sessionMethod === "hr_series" || sessionMethod === "avg_hr") {
        physicalImpulseWorkout += sessionTrimp;
      } else {
        physicalImpulseFallback += sessionTrimp;
      }

      if (sessionMethod === "hr_series") {
        methodUsed = "hr_series";
      } else if (sessionMethod === "avg_hr" && methodUsed !== "hr_series") {
        methodUsed = "avg_hr";
      } else if (sessionMethod === "pace" && methodUsed === "none") {
        methodUsed = "pace";
      } else if (sessionMethod === "energy" && methodUsed === "none") {
        methodUsed = "energy";
      }
    }

    if (physicalImpulse === 0 && workouts.length > 0) {
      fallbackFlags.push("physical_unscored_workouts");
    }

    const examUrgency = computeExamUrgency(date, exams, todos);

    const sessionImpulseBase = sessions.reduce((sum, session) => {
      const durationMin = Math.max(0, session.durationSec / 60);
      if (!Number.isFinite(durationMin) || durationMin <= 0) {
        return sum;
      }

      return sum + durationMin * (1 + 0.003 * Math.max(0, durationMin - 60));
    }, 0);

    let mentalImpulse = sessionImpulseBase * (1 + 0.5 * examUrgency);
    if (sessions.length === 0) {
      mentalImpulse = MENTAL_STRAIN_COLD_REF * examUrgency;
      if (examUrgency > 0) {
        fallbackFlags.push("mental_from_exam_urgency");
      }
    }

    ctl = ewmaTau(ctl, physicalImpulse, TAU_CTL_DAYS);
    atl = ewmaTau(atl, physicalImpulse, TAU_ATL_DAYS);
    mcl = ewmaTau(mcl, mentalImpulse, TAU_MCL_DAYS);
    mal = ewmaTau(mal, mentalImpulse, TAU_MAL_DAYS);

    const physicalRef =
      impulseHistory.length >= 14
        ? rollingP95(recentValues(impulseHistory, DAYS_180), PHYSICAL_STRAIN_COLD_REF, PHYSICAL_STRAIN_MIN_REF)
        : PHYSICAL_STRAIN_COLD_REF;

    const mentalRef =
      mentalImpulseHistory.length >= 14
        ? rollingP95(recentValues(mentalImpulseHistory, DAYS_180), MENTAL_STRAIN_COLD_REF, MENTAL_STRAIN_MIN_REF)
        : MENTAL_STRAIN_COLD_REF;

    const physicalStrain = physicalStrainFromImpulse(physicalImpulse, physicalRef);
    const mentalStrain = mentalStrainFromImpulse(mentalImpulse, mentalRef);

    const prevPhysicalStrain = physicalStrainHistory.length > 0 ? physicalStrainHistory[physicalStrainHistory.length - 1] : 0;
    const prevMentalStrain = mentalStrainHistory.length > 0 ? mentalStrainHistory[mentalStrainHistory.length - 1] : 0;

    const recoveryComponents: Array<{ key: string; value: number; weight: number }> = [
      { key: "sleep", value: sleepScore, weight: RECOVERY_SLEEP_WEIGHT },
    ];
    if (typeof compHrv === "number") {
      recoveryComponents.push({ key: "hrv", value: compHrv, weight: RECOVERY_HRV_WEIGHT });
    }
    if (typeof compRhr === "number") {
      recoveryComponents.push({ key: "rhr", value: compRhr, weight: RECOVERY_RHR_WEIGHT });
    }
    if (typeof compRr === "number") {
      recoveryComponents.push({ key: "rr", value: compRr, weight: RECOVERY_RR_WEIGHT });
    }

    const recoveryWeightSum = recoveryComponents.reduce((sum, item) => sum + item.weight, 0);
    const recoveryBase =
      recoveryWeightSum > 0
        ? recoveryComponents.reduce(
            (sum, item) => sum + item.value * (item.weight / recoveryWeightSum),
            0,
          )
        : sleepScore;

    const recoveryScore = clamp(
      recoveryBase - 0.1 * prevPhysicalStrain - 0.05 * prevMentalStrain,
      0,
      100,
    );

    const mentalRecoveryWeightSleep = 0.6;
    const mentalRecoveryWeightRegularity = 0.2;
    const mentalRecoveryWeightHrv = typeof compHrv === "number" ? 0.2 : 0;
    const mentalRecoveryDen =
      mentalRecoveryWeightSleep + mentalRecoveryWeightRegularity + mentalRecoveryWeightHrv;

    const mentalRecoveryBase =
      (mentalRecoveryWeightSleep * sleepScore +
        mentalRecoveryWeightRegularity * (regularityScore || 50) +
        mentalRecoveryWeightHrv * (compHrv || 0)) /
      Math.max(mentalRecoveryDen, EPSILON);

    const mentalRecovery = clamp(mentalRecoveryBase - 0.05 * prevMentalStrain, 0, 100);

    const recoveryReasonCodes: string[] = [];
    if ((zHrv || 0) <= -1) {
      recoveryReasonCodes.push("RECOVERY_HRV_LOW");
    }
    if ((zRhr || 0) <= -1) {
      recoveryReasonCodes.push("RECOVERY_RHR_HIGH");
    }
    if ((zRr || 0) <= -1) {
      recoveryReasonCodes.push("RECOVERY_RR_HIGH");
    }
    if (sleepScore < 60) {
      recoveryReasonCodes.push("RECOVERY_SLEEP_LOW");
    }
    if (prevPhysicalStrain > 70 || prevMentalStrain > 70) {
      recoveryReasonCodes.push("RECOVERY_LOAD_PENALTY");
    }
    if (typeof compHrv !== "number" || typeof compRr !== "number") {
      recoveryReasonCodes.push("RECOVERY_DATA_SPARSE");
    }

    const recoveryReasons = recoveryReasonCodes.map(recoveryReasonText);

    const recoveryContribution: Record<string, number> = {
      sleep: round((RECOVERY_SLEEP_WEIGHT / recoveryWeightSum) * sleepScore, 2),
      hrv:
        typeof compHrv === "number"
          ? round((RECOVERY_HRV_WEIGHT / recoveryWeightSum) * compHrv, 2)
          : 0,
      rhr:
        typeof compRhr === "number"
          ? round((RECOVERY_RHR_WEIGHT / recoveryWeightSum) * compRhr, 2)
          : 0,
      rr:
        typeof compRr === "number"
          ? round((RECOVERY_RR_WEIGHT / recoveryWeightSum) * compRr, 2)
          : 0,
      loadPenalty: round(-0.1 * prevPhysicalStrain - 0.05 * prevMentalStrain, 2),
    };

    const recoveryMessages = [
      `Recovery score ${Math.round(recoveryScore)} from baseline physiology + sleep inputs.`,
      ...recoveryReasonCodes.slice(0, 3).map(recoveryReasonText),
    ];

    const mentalRecoveryReasonCodes: string[] = [];
    if (sleepScore < 60) {
      mentalRecoveryReasonCodes.push("RECOVERY_SLEEP_LOW");
    }
    if ((regularityScore || 50) < 60) {
      mentalRecoveryReasonCodes.push("SLEEP_IRREGULAR_TIMING");
    }
    if (prevMentalStrain > 70) {
      mentalRecoveryReasonCodes.push("RECOVERY_LOAD_PENALTY");
    }

    const mentalRecoveryReasons = mentalRecoveryReasonCodes.map((code) =>
      code.startsWith("SLEEP") ? sleepReasonText(code) : recoveryReasonText(code),
    );

    const mentalRecoveryContribution: Record<string, number> = {
      sleep: round((mentalRecoveryWeightSleep / mentalRecoveryDen) * sleepScore, 2),
      regularity: round(
        (mentalRecoveryWeightRegularity / mentalRecoveryDen) * (regularityScore || 50),
        2,
      ),
      hrv:
        typeof compHrv === "number"
          ? round((mentalRecoveryWeightHrv / mentalRecoveryDen) * compHrv, 2)
          : 0,
      strainPenalty: round(-0.05 * prevMentalStrain, 2),
    };

    const mentalRecoveryMessages = [
      `Mental recovery ${Math.round(mentalRecovery)} combines sleep quality, regularity, HRV, and prior mental strain.`,
      ...mentalRecoveryReasons.slice(0, 3),
    ];

    const recentMentalStrainHistory = recentValues(mentalStrainHistory, DAYS_180);
    const recentMentalStrain2d = recentValues(mentalStrainHistory, 2);
    const mentalStrain2d =
      recentMentalStrain2d.length === 0
        ? mentalStrain
        : recentMentalStrain2d.length === 1
        ? recentMentalStrain2d[0]
        : (recentMentalStrain2d[0] + recentMentalStrain2d[1]) / 2;

    const q25Mental =
      recentMentalStrainHistory.length >= 7
        ? quantile(recentMentalStrainHistory, 0.25)
        : quantile([...recentMentalStrainHistory, mentalStrain], 0.25);

    const underload = clamp(sigmoid((q25Mental - mentalStrain2d) / 8), 0, 1);
    const gate = clamp(sigmoid((mentalRecovery - 70) / 10), 0, 1);
    const gUnder = 1 + 0.25 * underload * gate;

    const ctlRefCandidates90 = recentValues(ctlHistory, DAYS_90).filter((value) => value > 0);
    const ctlRefCandidates30 = recentValues(ctlHistory, DAYS_30).filter((value) => value > 0);
    const ctlRef =
      ctlRefCandidates90.length > 0
        ? median(ctlRefCandidates90)
        : ctlRefCandidates30.length > 0
        ? median(ctlRefCandidates30)
        : 50;

    const mclRefCandidates90 = recentValues(mclHistory, DAYS_90).filter((value) => value > 0);
    const mclRefCandidates30 = recentValues(mclHistory, DAYS_30).filter((value) => value > 0);
    const mclRef =
      mclRefCandidates90.length > 0
        ? median(mclRefCandidates90)
        : mclRefCandidates30.length > 0
        ? median(mclRefCandidates30)
        : 50;

    const fi = ctl / Math.max(ctlRef, EPSILON);
    const ai = (atl - ctl) / Math.max(ctlRef, EPSILON);
    const mfi = mcl / Math.max(mclRef, EPSILON);
    const mai = (mal - mcl) / Math.max(mclRef, EPSILON);

    aiHistory.push(ai);
    maiHistory.push(mai);
    recoveryHistory.push(recoveryScore);
    mentalRecoveryHistory.push(mentalRecovery);

    const overtrainPersist =
      recentValues(aiHistory, DAYS_10).filter((value) => value >= 0.35).length >= 7;

    const recoveryLow3 =
      recentValues(recoveryHistory, 3).length >= 3 &&
      recentValues(recoveryHistory, 3).every((value) => value <= 45);

    let physicalState: PhysicalLoadState;
    if (overtrainPersist && recoveryLow3) {
      physicalState = "overtraining_risk";
    } else if (ai >= 0.25 || (ai >= 0.15 && recoveryScore < 45)) {
      physicalState = "fatigued";
    } else if (fi >= 1.15 && ai >= -0.1 && ai <= 0.15 && recoveryScore >= 55) {
      physicalState = "peaking";
    } else if (fi >= 0.9 && fi <= 1.15 && ai >= 0.05 && ai <= 0.25 && recoveryScore >= 45) {
      physicalState = "productive";
    } else if (fi >= 0.75 && fi < 0.95 && ai >= -0.05 && ai < 0.15) {
      physicalState = "maintaining";
    } else if (fi < 0.75) {
      physicalState = "detraining";
    } else {
      physicalState = "maintaining";
    }

    const burnoutPersist =
      recentValues(maiHistory, DAYS_10).filter((value) => value >= 0.25).length +
        recentValues(mentalRecoveryHistory, DAYS_10).filter((value) => value < 50).length >=
      7;

    let mentalState: MentalLoadState;
    if (burnoutPersist && (mentalRecovery < 50 || mai >= 0.25)) {
      mentalState = "burnout_risk";
    } else if (
      (mentalRecovery < 40 && mfi >= 0.75) ||
      mai >= 0.25 ||
      (mai >= 0.15 && mentalRecovery < 50)
    ) {
      mentalState = "fatigued";
    } else if (
      mfi >= 1.15 &&
      mai >= -0.1 &&
      mai <= 0.15 &&
      mentalRecovery >= 60 &&
      examUrgency >= 0.4
    ) {
      mentalState = "peaking";
    } else if (
      mfi >= 0.9 &&
      mfi <= 1.15 &&
      mai >= 0.05 &&
      mai <= 0.25 &&
      mentalRecovery >= 55
    ) {
      mentalState = "productive";
    } else if (mfi >= 0.75 && mfi < 0.95 && mai >= -0.05 && mai < 0.15) {
      mentalState = "maintaining";
    } else if (mfi < 0.75 && examUrgency < 0.4) {
      mentalState = "underloaded";
    } else {
      mentalState = "maintaining";
    }

    const physicalBaseMult: Record<PhysicalLoadState, number> = {
      detraining: 1.25,
      maintaining: 1,
      productive: 1.35,
      peaking: 0.6,
      fatigued: 0.3,
      overtraining_risk: 0.1,
    };

    const mentalBaseMult: Record<MentalLoadState, number> = {
      underloaded: 1.2,
      maintaining: 1,
      productive: 1.1,
      peaking: 1.25,
      fatigued: 0.7,
      burnout_risk: 0.5,
    };

    const physicalMultRecovery = 0.5 + recoveryScore / 200;
    const physicalMultExam = examUrgency >= 0.7 ? 0.85 : examUrgency >= 0.4 ? 0.95 : 1;

    const physicalTargetCenterRaw =
      ctl * physicalBaseMult[physicalState] * physicalMultRecovery * physicalMultExam;

    let physicalTargetMinRaw: number;
    let physicalTargetMaxRaw: number;

    if (physicalState === "fatigued" || physicalState === "overtraining_risk") {
      physicalTargetMinRaw = 0;
      physicalTargetMaxRaw = physicalTargetCenterRaw;
    } else {
      physicalTargetMinRaw = 0.8 * physicalTargetCenterRaw;
      physicalTargetMaxRaw = 1.2 * physicalTargetCenterRaw;
    }

    const buildState =
      physicalState === "detraining" ||
      physicalState === "maintaining" ||
      physicalState === "productive";

    const physicalHardCap = buildState ? 1.6 * ctl : 1.3 * ctl;
    if (physicalHardCap > 0) {
      physicalTargetMaxRaw = Math.min(physicalTargetMaxRaw, physicalHardCap);
    }
    physicalTargetMinRaw = clamp(physicalTargetMinRaw, 0, Math.max(physicalTargetMaxRaw, 0));

    const physicalTargetLow = physicalStrainFromImpulse(physicalTargetMinRaw, physicalRef);
    const physicalTargetCenter = physicalStrainFromImpulse(physicalTargetCenterRaw, physicalRef);
    const physicalTargetHigh = physicalStrainFromImpulse(physicalTargetMaxRaw, physicalRef);

    const mentalMultRecovery = 0.5 + mentalRecovery / 200;
    const mentalMultExam = examUrgency >= 0.7 ? 1.25 : examUrgency >= 0.4 ? 1.1 : 1;
    const mentalMultPhysical =
      physicalState === "fatigued" || physicalState === "overtraining_risk" ? 0.9 : 1;

    const mentalTargetCenterRaw =
      mcl *
      mentalBaseMult[mentalState] *
      mentalMultRecovery *
      mentalMultExam *
      mentalMultPhysical;

    let mentalTargetMinRaw: number;
    let mentalTargetMaxRaw: number;

    if (mentalState === "fatigued" || mentalState === "burnout_risk") {
      mentalTargetMinRaw = 0;
      mentalTargetMaxRaw = mentalTargetCenterRaw;
    } else {
      mentalTargetMinRaw = 0.8 * mentalTargetCenterRaw;
      mentalTargetMaxRaw = 1.2 * mentalTargetCenterRaw;
    }

    if (mcl > 0) {
      mentalTargetMaxRaw = Math.min(mentalTargetMaxRaw, 1.6 * mcl);
    }
    mentalTargetMinRaw = clamp(mentalTargetMinRaw, 0, Math.max(mentalTargetMaxRaw, 0));

    const mentalTargetLow = mentalStrainFromImpulse(mentalTargetMinRaw, mentalRef);
    const mentalTargetCenter = mentalStrainFromImpulse(mentalTargetCenterRaw, mentalRef);
    const mentalTargetHigh = mentalStrainFromImpulse(mentalTargetMaxRaw, mentalRef);

    const studyCenterHours = clamp(
      goals.baselineStudyHours * (0.65 + 0.9 * (mentalTargetCenter / 100)),
      0.5,
      11,
    );
    const studyHalfWidth = Math.max(0.4, ((mentalTargetHigh - mentalTargetLow) / 100) * 2.2);
    const studyTargetLow = round(clamp(studyCenterHours - studyHalfWidth, 0.5, 12), 1);
    const studyTargetHigh = round(
      clamp(studyCenterHours + studyHalfWidth, studyTargetLow + 0.3, 12),
      1,
    );

    const studyRationale =
      mentalState === "burnout_risk" || mentalState === "fatigued"
        ? "Mental load is elevated relative to recovery; keep study focused and shorter today."
        : mentalState === "underloaded"
        ? "Mental load is below your productive range; increase distributed study volume today."
        : examUrgency >= 0.7
        ? "Exam urgency is high and recovery is adequate, so study targets are elevated strategically."
        : "Study range is set to keep you in the productive mental load zone.";

    const targetReasonCodes = [
      `TARGET_PHYSICAL_${physicalState.toUpperCase()}`,
      `TARGET_MENTAL_${mentalState.toUpperCase()}`,
    ];

    if (examUrgency >= 0.7) {
      targetReasonCodes.push("TARGET_EXAM_URGENCY_HIGH");
    } else if (examUrgency >= 0.4) {
      targetReasonCodes.push("TARGET_EXAM_URGENCY_MODERATE");
    }

    const targetPhysicalReasons = targetReasonCodes
      .filter((code) => code.startsWith("TARGET_PHYSICAL") || code.startsWith("TARGET_EXAM"))
      .map(targetReasonText);

    const targetMentalReasons = targetReasonCodes
      .filter((code) => code.startsWith("TARGET_MENTAL") || code.startsWith("TARGET_EXAM"))
      .map(targetReasonText);

    const targetMessages = [
      `Today’s cardio target is ${physicalTargetLow.toFixed(1)}-${physicalTargetHigh.toFixed(1)} strain (${physicalState}).`,
      `Today’s study target is ${studyTargetLow.toFixed(1)}-${studyTargetHigh.toFixed(1)}h (${mentalState}).`,
      ...targetReasonCodes.slice(0, 2).map(targetReasonText),
    ];

    const targetContribution: Record<string, number> = {
      physicalBaseMult: round(physicalBaseMult[physicalState], 3),
      physicalRecoveryMult: round(physicalMultRecovery, 3),
      physicalExamMult: round(physicalMultExam, 3),
      mentalBaseMult: round(mentalBaseMult[mentalState], 3),
      mentalRecoveryMult: round(mentalMultRecovery, 3),
      mentalExamMult: round(mentalMultExam, 3),
      mentalPhysicalMult: round(mentalMultPhysical, 3),
    };

    const historyFactor = rows.length < 7 ? 0.3 : rows.length < 14 ? 0.7 : 1;

    let consistencyFactor = 1;
    if (typeof hrvMs === "number" && (hrvMs < 5 || hrvMs > 400)) {
      consistencyFactor *= 0.75;
      fallbackFlags.push("hrv_outlier");
    }

    const prevRhr = rhrHistory.length > 1 ? rhrHistory[rhrHistory.length - 2] : undefined;
    if (typeof restingHr === "number" && typeof prevRhr === "number" && Math.abs(restingHr - prevRhr) > 25) {
      consistencyFactor *= 0.85;
      fallbackFlags.push("rhr_jump");
    }

    const sleepConfBase =
      1 *
      (typeof sleepMidpointMin === "number" ? 1 : 0.9) *
      (typeof stagesScore === "number" ? 1 : 0.85);

    const recoveryConfBase = clamp(recoveryWeightSum / 1, 0, 1);

    const physicalConfBase =
      methodUsed === "hr_series" || methodUsed === "avg_hr"
        ? 0.9
        : methodUsed === "pace" || methodUsed === "energy"
        ? 0.65
        : 0.45;

    const mentalConfBase = sessions.length > 0 ? 0.9 : 0.7;

    const sleepConfidence = clamp(sleepConfBase * historyFactor * consistencyFactor, 0, 1);
    const recoveryConfidence = clamp(recoveryConfBase * historyFactor * consistencyFactor, 0, 1);
    const physicalConfidence = clamp(physicalConfBase * historyFactor * consistencyFactor, 0, 1);
    const mentalConfidence = clamp(mentalConfBase * historyFactor * consistencyFactor, 0, 1);
    const overallConfidence = clamp(
      0.25 * sleepConfidence +
        0.35 * recoveryConfidence +
        0.25 * physicalConfidence +
        0.15 * mentalConfidence,
      0,
      1,
    );

    sleepDebtHours =
      0.7 * sleepDebtHours +
      (typeof sleepAsleepMin === "number" ? Math.max(0, (sleepNeedMin - sleepAsleepMin) / 60) : 0);

    const narrative =
      `Sleep ${Math.round(sleepScore)}/100 (${((sleepAsleepMin || 0) / 60).toFixed(1)}h vs need ${(sleepNeedMin / 60).toFixed(1)}h). ` +
      `Recovery ${Math.round(recoveryScore)}/100, mental recovery ${Math.round(mentalRecovery)}/100. ` +
      `Physical state ${physicalState}, mental state ${mentalState}. ` +
      `Study target ${studyTargetLow.toFixed(1)}-${studyTargetHigh.toFixed(1)}h.`;

    const row: DailyRow = {
      date,
      sleepNeedMin,
      sleepAsleepMin,
      sleepInBedMin,
      sleepEfficiency,
      sleepWasoMin: wasoMin,
      sleepMidpointMin,
      sleepMidpointDeltaMin: midpointDelta,
      sleepDurationScore: durationScore,
      sleepContinuityScore: continuityScore,
      sleepRegularityScore: regularityScore,
      sleepStagesScore: stagesScore,
      sleepScore,
      sleepReasonCodes,
      sleepLowReasons,
      sleepHighReasons,
      sleepContribution,
      sleepMessages,

      hrvLn,
      zHrv,
      zRhr,
      zRr,
      compHrv,
      compRhr,
      compRr,

      examUrgency,
      physicalImpulse,
      physicalImpulseWorkout,
      physicalImpulseFallback,
      workoutMethod: methodUsed,
      ctl,
      atl,
      tsb: ctl - atl,
      physicalRef,
      physicalStrain,

      mentalImpulse,
      mentalSessionImpulse: sessionImpulseBase,
      mcl,
      mal,
      mentalRef,
      mentalStrain,

      recoveryBase,
      recoveryScore,
      recoveryReasonCodes,
      recoveryReasons,
      recoveryMessages,
      recoveryContribution,

      mentalRecovery,
      mentalRecoveryReasonCodes,
      mentalRecoveryReasons,
      mentalRecoveryMessages,
      mentalRecoveryContribution,
      underload,
      gate,
      gUnder,

      fi,
      ai,
      mfi,
      mai,
      physicalState,
      mentalState,

      physicalTargetCenterRaw,
      physicalTargetMinRaw,
      physicalTargetMaxRaw,
      physicalTargetCenter,
      physicalTargetLow,
      physicalTargetHigh,

      mentalTargetCenterRaw,
      mentalTargetMinRaw,
      mentalTargetMaxRaw,
      mentalTargetCenter,
      mentalTargetLow,
      mentalTargetHigh,

      studyTargetLow,
      studyTargetHigh,
      studyRationale,

      targetReasonCodes,
      targetPhysicalReasons,
      targetMentalReasons,
      targetMessages,
      targetContribution,

      sleepConfidence,
      recoveryConfidence,
      physicalConfidence,
      mentalConfidence,
      overallConfidence,

      fallbackFlags,
      narrative,
    };

    rows.push(row);

    if (typeof sleepMidpointMin === "number") {
      sleepMidpointHistory.push(sleepMidpointMin);
    }

    impulseHistory.push(physicalImpulse);
    mentalImpulseHistory.push(mentalImpulse);
    ctlHistory.push(ctl);
    atlHistory.push(atl);
    mclHistory.push(mcl);
    malHistory.push(mal);
    physicalStrainHistory.push(physicalStrain);
    mentalStrainHistory.push(mentalStrain);
  }

  return rows;
}

function defaultScientificMetric(todayKey: string): ScientificDailyMetrics {
  return {
    date: todayKey,
    sleepNeedHours: 8,
    sleepHours: 0,
    sleepEfficiency: 0,
    sleepWasoMinutes: 0,
    sleepMidpointDeltaMinutes: 0,
    sleepScore: 50,
    recoveryScore: 50,
    physicalStrain: 0,
    mentalRecovery: 50,
    mentalStrain: 0,
    physicalRawLoad: 0,
    mentalRawLoad: 0,
    pressure: 0,
    physicalAcuteLoad: 0,
    physicalChronicLoad: 0,
    mentalAcuteLoad: 0,
    mentalChronicLoad: 0,
    physicalLoadRatio: 0,
    mentalLoadRatio: 0,
    physicalCap: PHYSICAL_STRAIN_COLD_REF,
    mentalCap: MENTAL_STRAIN_COLD_REF,
    physicalTarget: { low: 0, center: 0, high: 0 },
    mentalTarget: { low: 0, center: 0, high: 0 },
    physicalState: "maintaining",
    mentalState: "maintaining",
    cardioLoad: {
      state: "maintaining",
      stateScore: 50,
      stateThresholds: {
        fi_detraining: 0.75,
        fi_productive_low: 0.9,
        fi_productive_high: 1.15,
        ai_fatigued: 0.25,
        ai_overtraining: 0.35,
      },
      stateRationale: "Insufficient data for stable physical state classification.",
    },
    mentalLoadState: {
      state: "maintaining",
      stateScore: 50,
      stateThresholds: {
        mfi_underloaded: 0.75,
        mfi_productive_low: 0.9,
        mfi_productive_high: 1.15,
        mai_fatigued: 0.25,
      },
      stateRationale: "Insufficient data for stable mental state classification.",
    },
    studyTargetLow: DEFAULT_BASELINE_STUDY_HOURS - 0.8,
    studyTargetHigh: DEFAULT_BASELINE_STUDY_HOURS + 0.8,
    studyRationale: "Default study guidance used while model confidence is low.",
    components: {
      sleepDuration: 50,
      sleepContinuity: 50,
      sleepRegularity: 50,
      sleepStages: 50,
      zLhrv: 0,
      zRhr: 0,
      zRr: 0,
      zApl: 0,
      zAml: 0,
      compHrv: 50,
      compRhr: 50,
      compRr: 50,
      underload: 0.5,
      gate: 0.5,
      gUnder: 1,
      ctl: 0,
      atl: 0,
      tsb: 0,
      mcl: 0,
      mal: 0,
      fi: 1,
      ai: 0,
      mfi: 1,
      mai: 0,
      examUrgency: 0,
    },
    confidence: {
      sleep: 0.2,
      recovery: 0.2,
      physicalStrain: 0.2,
      mentalRecovery: 0.2,
      mentalStrain: 0.2,
      overall: 0.2,
    },
    chartPayloads: {
      physicalStrain: {
        timestamp: `${todayKey}T00:00:00.000Z`,
        rawValue: 0,
        normalizedValue: 0,
        componentContributions: {
          workoutLoad: 0,
          fallbackLoad: 0,
        },
        confidence: 0.2,
      },
      mentalStrain: {
        timestamp: `${todayKey}T00:00:00.000Z`,
        rawValue: 0,
        normalizedValue: 0,
        componentContributions: {
          studyLoad: 0,
          examUrgencyAmplifier: 0,
        },
        confidence: 0.2,
      },
    },
    explainability: {
      sleep: {
        reasonCodes: ["NO_DATA"],
        userMessages: ["Sleep data is not sufficient yet for personalized scoring."],
        contributionBreakdown: {
          duration: 0,
          continuity: 0,
          regularity: 0,
          stages: 0,
        },
        lowReasons: ["Need more sleep and timing data for model certainty."],
        highReasons: [],
      },
      physicalRecovery: {
        reasonCodes: ["NO_DATA"],
        userMessages: ["Recovery physiology data is sparse."],
        contributionBreakdown: {
          sleep: 0,
          hrv: 0,
          rhr: 0,
          rr: 0,
          loadPenalty: 0,
        },
        reasons: ["Need HRV/RHR/RR history for robust baseline-relative recovery."],
      },
      mentalRecovery: {
        reasonCodes: ["NO_DATA"],
        userMessages: ["Mental recovery uses sleep + load history and is currently low-confidence."],
        contributionBreakdown: {
          sleep: 0,
          regularity: 0,
          hrv: 0,
          strainPenalty: 0,
        },
        reasons: ["Need more study and sleep history for stable mental-recovery scoring."],
      },
      targetRange: {
        reasonCodes: ["NO_DATA"],
        userMessages: ["Targets are conservative until enough history is available."],
        contributionBreakdown: {
          physicalBaseMult: 1,
          physicalRecoveryMult: 1,
          physicalExamMult: 1,
          mentalBaseMult: 1,
          mentalRecoveryMult: 1,
          mentalExamMult: 1,
          mentalPhysicalMult: 1,
        },
        physicalReasons: ["No physical state signal yet."],
        mentalReasons: ["No mental state signal yet."],
        studyRationale: "Default study guidance while calibration builds.",
      },
    },
    fallbackFlags: ["no_data"],
    narrative:
      "No sufficient health, workout, or study data for full model output yet. Import more data to unlock personalized guidance.",
  };
}

function defaultReadiness(todayKey: string): DailyReadiness {
  return {
    date: todayKey,
    score: 50,
    zone: "yellow",
    confidence: 0.2,
    sleepScore: 50,
    sleepDurationScore: 50,
    sleepRegularityScore: 50,
    sleepStageScore: 50,
    sleepAwakeScore: 50,
    sleepScheduleScore: 50,
    sleepDriverMode: "negative",
    sleepDriverKey: "duration",
    sleepDriverImpact: 0,
    sleepDriverSentence: "Sleep score is mainly limited by sleep duration relative to your current need.",
    sleepComponent: 50,
    autonomicComponent: 50,
    loadComponent: 50,
    cognitiveComponent: 50,
    penalty: 0,
    sleepDebtHours: 0,
    sleepHours: 0,
    loadRatio: 0,
    zHrv: 0,
    zRhr: 0,
    recoveryScore: 50,
    mentalRecoveryScore: 50,
    physicalStrain: 0,
    mentalStrain: 0,
    physicalTargetLow: 0,
    physicalTargetHigh: 0,
    mentalTargetLow: 0,
    mentalTargetHigh: 0,
    pressure: 0,
    confidenceSleep: 0.2,
    confidenceRecovery: 0.2,
    confidencePhysical: 0.2,
    confidenceMental: 0.2,
  };
}

function defaultRecommendation(todayKey: string): DailyRecommendation {
  const bedtimeCenter = 21 * 60 + 30;
  const halfRange = 20;
  const start = bedtimeCenter - halfRange;
  const end = bedtimeCenter + halfRange;

  return {
    date: todayKey,
    studyTargetHours: DEFAULT_BASELINE_STUDY_HOURS,
    trainingCategory: "easy_run",
    trainingLabel: "Easy Run",
    runMinutesMin: 35,
    runMinutesMax: 50,
    walkMinutesMin: 15,
    walkMinutesMax: 25,
    targetRpeMin: 4,
    targetRpeMax: 5,
    trainingRationale: "Default recommendation used because recent readiness data is limited.",
    isRunRecommended: true,
    workoutType: "cardio",
    workoutDurationMin: 50,
    workoutSuggestion: "easy run",
    bedtimeIso: toIsoOnDate(todayKey, bedtimeCenter),
    bedtimeLabel: formatClockLabel(bedtimeCenter),
    bedtimeRangeStartIso: toIsoOnDate(todayKey, start),
    bedtimeRangeEndIso: toIsoOnDate(todayKey, end),
    bedtimeRangeStartLabel: formatClockLabel(start),
    bedtimeRangeEndLabel: formatClockLabel(end),
    bedtimeRangeLabel: `${formatClockLabel(start)}-${formatClockLabel(end)}`,
    bedtimeRangeMinutes: halfRange * 2,
    studyTargetHoursLow: DEFAULT_BASELINE_STUDY_HOURS - 0.8,
    studyTargetHoursHigh: DEFAULT_BASELINE_STUDY_HOURS + 0.8,
    studyTargetLow: DEFAULT_BASELINE_STUDY_HOURS - 0.8,
    studyTargetHigh: DEFAULT_BASELINE_STUDY_HOURS + 0.8,
    studyRationale: "Default study guidance while model confidence is low.",
    recommendedFreshAirMinutes: 30,
    physicalTargetLow: 0,
    physicalTargetHigh: 0,
    mentalTargetLow: 0,
    mentalTargetHigh: 0,
    physicalState: "maintaining",
    mentalState: "maintaining",
    scientificSummary:
      "Model confidence is low today. Keep study and training moderate while collecting more consistent health data.",
  };
}

function freshnessMinutes(mentalRecovery: number): number {
  if (mentalRecovery < 40) {
    return 60;
  }
  if (mentalRecovery < 55) {
    return 45;
  }
  if (mentalRecovery < 70) {
    return 30;
  }
  return 20;
}

export function buildPerformanceInsights(data: AppData, now = new Date()): PerformanceInsights {
  const goals = normalizeGoals(data.goals);
  const usingSampleData = false;

  const healthDays = data.dailyHealth
    .slice()
    .filter((day) => typeof day?.date === "string")
    .map((day) => sanitizeHealthDay(day))
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

  const healthByDate = new Map(healthDays.map((day) => [day.date, day]));

  const workoutDetailsByWorkoutId = new Map<string, WorkoutDetail>();
  for (const detail of data.workoutDetails || []) {
    if (detail.workoutId) {
      workoutDetailsByWorkoutId.set(detail.workoutId, detail);
    }
  }

  const enrichedWorkouts = data.workouts
    .slice()
    .sort(
      (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
    )
    .map((workout) => {
      const workoutDate = workoutDayKey(workout);
      const restingHr = healthByDate.get(workoutDate)?.restingHrBpm ?? 55;
      const difficultyAuto = computeWorkoutDifficultyAuto(workout, goals, restingHr);
      const difficultyUser =
        typeof workout.difficultyUser === "number" && Number.isFinite(workout.difficultyUser)
          ? clamp(Math.round(workout.difficultyUser), 1, 10)
          : undefined;
      const difficultyEffective = difficultyUser ?? difficultyAuto;
      const trainingLoad =
        isRunSession(workout) && Number.isFinite(workout.durationMin)
          ? round(Math.max(0, workout.durationMin) * difficultyEffective, 2)
          : undefined;

      return {
        ...workout,
        difficultyAuto,
        difficultyUser,
        difficultyEffective,
        trainingLoad,
      };
    });

  const workoutsByDate = new Map<string, WorkoutEntry[]>();
  for (const workout of enrichedWorkouts) {
    const dateKey = workoutDayKey(workout);
    if (!workoutsByDate.has(dateKey)) {
      workoutsByDate.set(dateKey, []);
    }
    workoutsByDate.get(dateKey)!.push(workout);
  }

  const sessionsByDate = new Map<string, StudySession[]>();
  for (const session of data.studySessions) {
    const dateKey = toDateKey(session.startedAt);
    if (!sessionsByDate.has(dateKey)) {
      sessionsByDate.set(dateKey, []);
    }
    sessionsByDate.get(dateKey)!.push(session);
  }

  const todayKey = toDateKey(now);
  const minimumStart = shiftDate(todayKey, -365);

  const dataDateCandidates: string[] = [minimumStart];
  if (healthDays.length > 0) {
    dataDateCandidates.push(healthDays[0].date);
  }
  if (enrichedWorkouts.length > 0) {
    dataDateCandidates.push(toDateKey(enrichedWorkouts[0].startedAt));
  }
  if (data.studySessions.length > 0) {
    dataDateCandidates.push(toDateKey(data.studySessions[0].startedAt));
  }

  dataDateCandidates.sort();
  const startKey = dataDateCandidates[0] || minimumStart;
  const dateWindow = buildDateRange(startKey, todayKey);

  const rows = runModel({
    dateWindow,
    healthByDate,
    workoutsByDate,
    sessionsByDate,
    workoutDetailsByWorkoutId,
    goals,
    exams: data.exams,
    todos: data.todos,
  });

  const readinessByDate: Record<string, DailyReadiness> = {};
  const recommendationsByDate: Record<string, DailyRecommendation> = {};
  const scientificByDate: Record<string, ScientificDailyMetrics> = {};

  const preferredBedtimeStartMinutes = parseClockToMinutes(goals.preferredBedtimeStart, 21 * 60);
  const preferredBedtimeEndMinutes = parseClockToMinutes(goals.preferredBedtimeEnd, 22 * 60);
  const preferredBedtimeCenterMinutes = windowCenterMinutes(
    preferredBedtimeStartMinutes,
    preferredBedtimeEndMinutes,
  );

  let runningSleepDebt = 0;

  for (const row of rows) {
    const daysSinceRun = computeDaysSinceRun(row.date, workoutsByDate);

    const trainingCategory = buildTrainingCategory(
      row.physicalState,
      row.recoveryScore,
      row.physicalTargetCenter,
      daysSinceRun,
    );

    const prescription = TRAINING_PRESCRIPTIONS[trainingCategory];

    runningSleepDebt =
      0.7 * runningSleepDebt +
      Math.max(0, (row.sleepNeedMin - (row.sleepAsleepMin || 0)) / 60);

    const sleepDriverMode: "negative" | "positive" = row.sleepScore < 65 ? "negative" : "positive";
    const sleepDriverKey =
      row.sleepContribution.duration >= row.sleepContribution.continuity &&
      row.sleepContribution.duration >= row.sleepContribution.regularity
        ? "duration"
        : row.sleepContribution.regularity >= row.sleepContribution.continuity
        ? "regularity"
        : "awake";

    const autonomicComponent = clamp(
      ((row.compHrv || 50) * 0.45 + (row.compRhr || 50) * 0.35 + (row.compRr || 50) * 0.2),
      0,
      100,
    );

    const loadComponent = clamp(100 - 0.65 * row.physicalStrain - 0.35 * row.mentalStrain, 0, 100);
    const cognitiveComponent = clamp(0.6 * row.mentalRecovery + 0.4 * row.sleepScore, 0, 100);

    const readinessScore = clamp(
      0.5 * row.recoveryScore + 0.3 * row.mentalRecovery + 0.2 * row.sleepScore,
      0,
      100,
    );

    const readiness: DailyReadiness = {
      date: row.date,
      score: round(readinessScore, 1),
      zone: zoneForScore(readinessScore),
      confidence: round(row.overallConfidence, 2),
      sleepScore: round(row.sleepScore, 1),
      sleepDurationScore: round(row.sleepDurationScore || 50, 1),
      sleepRegularityScore: round(row.sleepRegularityScore || 50, 1),
      sleepStageScore: round(row.sleepStagesScore || 50, 1),
      sleepAwakeScore: round(row.sleepContinuityScore || 50, 1),
      sleepScheduleScore: round(row.sleepRegularityScore || 50, 1),
      sleepDriverMode,
      sleepDriverKey,
      sleepDriverImpact: round(
        row.sleepContribution.duration + row.sleepContribution.continuity + row.sleepContribution.regularity,
        1,
      ),
      sleepDriverSentence: sentenceForDriver(sleepDriverMode, sleepDriverKey),
      sleepComponent: round(row.sleepScore, 1),
      autonomicComponent: round(autonomicComponent, 1),
      loadComponent: round(loadComponent, 1),
      cognitiveComponent: round(cognitiveComponent, 1),
      penalty: round(0.1 * row.physicalStrain + 0.05 * row.mentalStrain, 1),
      sleepDebtHours: round(runningSleepDebt, 2),
      sleepHours: round((row.sleepAsleepMin || 0) / 60, 2),
      loadRatio: round(row.ai, 3),
      zHrv: round(row.zHrv || 0, 3),
      zRhr: round(row.zRhr || 0, 3),
      recoveryScore: round(row.recoveryScore, 1),
      mentalRecoveryScore: round(row.mentalRecovery, 1),
      physicalStrain: round(row.physicalStrain, 2),
      mentalStrain: round(row.mentalStrain, 2),
      physicalTargetLow: round(row.physicalTargetLow, 2),
      physicalTargetHigh: round(row.physicalTargetHigh, 2),
      mentalTargetLow: round(row.mentalTargetLow, 2),
      mentalTargetHigh: round(row.mentalTargetHigh, 2),
      pressure: round(row.examUrgency, 3),
      confidenceSleep: round(row.sleepConfidence, 3),
      confidenceRecovery: round(row.recoveryConfidence, 3),
      confidencePhysical: round(row.physicalConfidence, 3),
      confidenceMental: round(row.mentalConfidence, 3),
    };

    const bedtimeCenter = preferredBedtimeCenterMinutes;
    const bedtimeAdjustMinutes = Math.round(
      clamp((60 - row.recoveryScore) / 2, -15, 20) +
        clamp((55 - row.mentalRecovery) / 2, -10, 15) +
        clamp(runningSleepDebt * 8, 0, 25),
    );

    const bedtimeMinutes = bedtimeCenter - bedtimeAdjustMinutes;
    const bedtimeHalfRange = Math.round(10 + (1 - row.overallConfidence) * 20);

    const recommendation: DailyRecommendation = {
      date: row.date,
      studyTargetHours: round((row.studyTargetLow + row.studyTargetHigh) / 2, 2),
      trainingCategory,
      trainingLabel: prescription.label,
      runMinutesMin: prescription.runMinutesMin,
      runMinutesMax: prescription.runMinutesMax,
      walkMinutesMin: prescription.walkMinutesMin,
      walkMinutesMax: prescription.walkMinutesMax,
      targetRpeMin: prescription.targetRpeMin,
      targetRpeMax: prescription.targetRpeMax,
      trainingRationale: physicalStateRationale(row.physicalState, row.fi, row.ai, row.recoveryScore),
      isRunRecommended: prescription.isRunRecommended,
      workoutType: prescription.isRunRecommended ? "cardio" : "recovery",
      workoutDurationMin: prescription.isRunRecommended ? prescription.runMinutesMax : 0,
      workoutSuggestion: prescription.isRunRecommended
        ? `${prescription.label}: ${prescription.runMinutesMin}-${prescription.runMinutesMax}m at RPE ${prescription.targetRpeMin}-${prescription.targetRpeMax}`
        : `Walk ${prescription.walkMinutesMin}-${prescription.walkMinutesMax}m`,
      bedtimeIso: toIsoOnDate(row.date, bedtimeMinutes),
      bedtimeLabel: formatClockLabel(bedtimeMinutes),
      bedtimeRangeStartIso: toIsoOnDate(row.date, bedtimeMinutes - bedtimeHalfRange),
      bedtimeRangeEndIso: toIsoOnDate(row.date, bedtimeMinutes + bedtimeHalfRange),
      bedtimeRangeStartLabel: formatClockLabel(bedtimeMinutes - bedtimeHalfRange),
      bedtimeRangeEndLabel: formatClockLabel(bedtimeMinutes + bedtimeHalfRange),
      bedtimeRangeLabel: `${formatClockLabel(bedtimeMinutes - bedtimeHalfRange)}-${formatClockLabel(bedtimeMinutes + bedtimeHalfRange)}`,
      bedtimeRangeMinutes: bedtimeHalfRange * 2,
      studyTargetHoursLow: row.studyTargetLow,
      studyTargetHoursHigh: row.studyTargetHigh,
      studyTargetLow: row.studyTargetLow,
      studyTargetHigh: row.studyTargetHigh,
      studyRationale: row.studyRationale,
      recommendedFreshAirMinutes: freshnessMinutes(row.mentalRecovery),
      physicalTargetLow: round(row.physicalTargetLow, 2),
      physicalTargetHigh: round(row.physicalTargetHigh, 2),
      mentalTargetLow: round(row.mentalTargetLow, 2),
      mentalTargetHigh: round(row.mentalTargetHigh, 2),
      physicalState: row.physicalState,
      mentalState: row.mentalState,
      scientificSummary: row.narrative,
    };

    const scientific: ScientificDailyMetrics = {
      date: row.date,
      sleepNeedHours: round(row.sleepNeedMin / 60, 2),
      sleepHours: round((row.sleepAsleepMin || 0) / 60, 2),
      sleepEfficiency: round(row.sleepEfficiency || 0, 3),
      sleepWasoMinutes: round(row.sleepWasoMin || 0, 1),
      sleepMidpointDeltaMinutes: round(row.sleepMidpointDeltaMin || 0, 1),
      sleepScore: round(row.sleepScore, 1),
      recoveryScore: round(row.recoveryScore, 1),
      physicalStrain: round(row.physicalStrain, 2),
      mentalRecovery: round(row.mentalRecovery, 1),
      mentalStrain: round(row.mentalStrain, 2),
      physicalRawLoad: round(row.physicalImpulse, 2),
      mentalRawLoad: round(row.mentalImpulse, 2),
      pressure: round(row.examUrgency, 3),
      physicalAcuteLoad: round(row.atl, 2),
      physicalChronicLoad: round(row.ctl, 2),
      mentalAcuteLoad: round(row.mal, 2),
      mentalChronicLoad: round(row.mcl, 2),
      physicalLoadRatio: round(row.ai, 3),
      mentalLoadRatio: round(row.mai, 3),
      physicalCap: round(row.physicalRef, 2),
      mentalCap: round(row.mentalRef, 2),
      physicalTarget: {
        low: round(row.physicalTargetLow, 2),
        center: round(row.physicalTargetCenter, 2),
        high: round(row.physicalTargetHigh, 2),
      },
      mentalTarget: {
        low: round(row.mentalTargetLow, 2),
        center: round(row.mentalTargetCenter, 2),
        high: round(row.mentalTargetHigh, 2),
      },
      physicalState: row.physicalState,
      mentalState: row.mentalState,
      cardioLoad: {
        state: row.physicalState,
        stateScore: round(
          clamp(
            100 -
              Math.abs(row.fi - 1) * 70 -
              Math.max(0, row.ai - 0.15) * 120 -
              Math.max(0, 45 - row.recoveryScore),
            0,
            100,
          ),
          1,
        ),
        stateThresholds: {
          fi_detraining: 0.75,
          fi_productive_low: 0.9,
          fi_productive_high: 1.15,
          ai_fatigued: 0.25,
          ai_overtraining: 0.35,
          recovery_low: 45,
        },
        stateRationale: physicalStateRationale(row.physicalState, row.fi, row.ai, row.recoveryScore),
      },
      mentalLoadState: {
        state: row.mentalState,
        stateScore: round(
          clamp(
            100 -
              Math.abs(row.mfi - 1) * 70 -
              Math.max(0, row.mai - 0.15) * 120 -
              Math.max(0, 55 - row.mentalRecovery),
            0,
            100,
          ),
          1,
        ),
        stateThresholds: {
          mfi_underloaded: 0.75,
          mfi_productive_low: 0.9,
          mfi_productive_high: 1.15,
          mai_fatigued: 0.25,
          mental_recovery_low: 50,
        },
        stateRationale: mentalStateRationale(row.mentalState, row.mfi, row.mai, row.mentalRecovery),
      },
      studyTargetLow: row.studyTargetLow,
      studyTargetHigh: row.studyTargetHigh,
      studyRationale: row.studyRationale,
      components: {
        sleepDuration: round(row.sleepDurationScore || 50, 2),
        sleepContinuity: round(row.sleepContinuityScore || 50, 2),
        sleepRegularity: round(row.sleepRegularityScore || 50, 2),
        sleepStages: round(row.sleepStagesScore || 50, 2),
        zLhrv: round(row.zHrv || 0, 3),
        zRhr: round(row.zRhr || 0, 3),
        zRr: round(row.zRr || 0, 3),
        zApl: round(row.ai, 3),
        zAml: round(row.mai, 3),
        compHrv: round(row.compHrv || 50, 2),
        compRhr: round(row.compRhr || 50, 2),
        compRr: round(row.compRr || 50, 2),
        underload: round(row.underload, 3),
        gate: round(row.gate, 3),
        gUnder: round(row.gUnder, 3),
        ctl: round(row.ctl, 2),
        atl: round(row.atl, 2),
        tsb: round(row.tsb, 2),
        mcl: round(row.mcl, 2),
        mal: round(row.mal, 2),
        fi: round(row.fi, 3),
        ai: round(row.ai, 3),
        mfi: round(row.mfi, 3),
        mai: round(row.mai, 3),
        examUrgency: round(row.examUrgency, 3),
      },
      confidence: {
        sleep: round(row.sleepConfidence, 3),
        recovery: round(row.recoveryConfidence, 3),
        physicalStrain: round(row.physicalConfidence, 3),
        mentalRecovery: round(row.mentalConfidence, 3),
        mentalStrain: round(row.mentalConfidence, 3),
        overall: round(row.overallConfidence, 3),
      },
      chartPayloads: {
        physicalStrain: {
          timestamp: `${row.date}T00:00:00.000Z`,
          rawValue: round(row.physicalImpulse, 2),
          normalizedValue: round(row.physicalStrain / 100, 4),
          componentContributions: {
            workoutLoad: round(row.physicalImpulseWorkout, 2),
            fallbackLoad: round(row.physicalImpulseFallback, 2),
            ctl: round(row.ctl, 2),
            atl: round(row.atl, 2),
          },
          confidence: round(row.physicalConfidence, 3),
        },
        mentalStrain: {
          timestamp: `${row.date}T00:00:00.000Z`,
          rawValue: round(row.mentalImpulse, 2),
          normalizedValue: round(row.mentalStrain / 100, 4),
          componentContributions: {
            studyLoad: round(row.mentalSessionImpulse, 2),
            examUrgencyAmplifier: round(row.mentalImpulse - row.mentalSessionImpulse, 2),
            mcl: round(row.mcl, 2),
            mal: round(row.mal, 2),
          },
          confidence: round(row.mentalConfidence, 3),
        },
      },
      explainability: {
        sleep: {
          reasonCodes: row.sleepReasonCodes,
          userMessages: row.sleepMessages,
          contributionBreakdown: row.sleepContribution,
          lowReasons: row.sleepLowReasons,
          highReasons: row.sleepHighReasons,
        },
        physicalRecovery: {
          reasonCodes: row.recoveryReasonCodes,
          userMessages: row.recoveryMessages,
          contributionBreakdown: row.recoveryContribution,
          reasons: row.recoveryReasons,
        },
        mentalRecovery: {
          reasonCodes: row.mentalRecoveryReasonCodes,
          userMessages: row.mentalRecoveryMessages,
          contributionBreakdown: row.mentalRecoveryContribution,
          reasons: row.mentalRecoveryReasons,
        },
        targetRange: {
          reasonCodes: row.targetReasonCodes,
          userMessages: row.targetMessages,
          contributionBreakdown: row.targetContribution,
          physicalReasons: row.targetPhysicalReasons,
          mentalReasons: row.targetMentalReasons,
          studyRationale: row.studyRationale,
        },
      },
      fallbackFlags: [...new Set(row.fallbackFlags)],
      narrative: row.narrative,
    };

    readinessByDate[row.date] = readiness;
    recommendationsByDate[row.date] = recommendation;
    scientificByDate[row.date] = scientific;
  }

  const todayReadiness = readinessByDate[todayKey] || defaultReadiness(todayKey);
  const todayRecommendation = recommendationsByDate[todayKey] || defaultRecommendation(todayKey);
  const todayScientific = scientificByDate[todayKey] || defaultScientificMetric(todayKey);

  const thisWeekStart = getWeekStartDate(todayKey);
  const weeklyWorkoutCount = enrichedWorkouts.filter((workout) => {
    const workoutDate = toDateKey(workout.startedAt);
    return workoutDate >= thisWeekStart && workoutDate <= todayKey && isRunSession(workout);
  }).length;

  const daysSinceRun = computeDaysSinceRun(todayKey, workoutsByDate);

  const orderedScores = dateWindow
    .map((dateKey) => readinessByDate[dateKey]?.score)
    .filter((value): value is number => typeof value === "number");

  const recent7 = orderedScores.slice(-7);
  const previous7 = orderedScores.slice(-14, -7);

  const avgRecent7 =
    recent7.length > 0
      ? recent7.reduce((sum, value) => sum + value, 0) / recent7.length
      : todayReadiness.score;

  const avgPrevious7 =
    previous7.length > 0
      ? previous7.reduce((sum, value) => sum + value, 0) / previous7.length
      : avgRecent7;

  return {
    usingSampleData,
    goals,
    healthDays,
    workouts: enrichedWorkouts,
    readinessByDate,
    recommendationsByDate,
    scientificByDate,
    todayReadiness,
    todayRecommendation,
    todayScientific,
    weeklyWorkoutCount,
    weeklyWorkoutTarget: goals.weeklyWorkoutTarget,
    daysSinceWorkout: daysSinceRun,
    daysSinceRun,
    trendDelta7d: round(avgRecent7 - avgPrevious7, 1),
  };
}
