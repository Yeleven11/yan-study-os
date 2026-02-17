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
  PerformanceGoals,
  ScientificDailyMetrics,
  SleepDriverKey,
  StudySession,
  TodoItem,
  TrainingCategory,
  WorkoutEntry,
} from "@/lib/types";

const EPSILON = 1e-6;
const ROBUST_Z_MAX = 4;
const SLEEP_NEED_COLD_START_HOURS = 8.0;
const SLEEP_NEED_MIN_HOURS = 7.0;
const SLEEP_NEED_MAX_HOURS = 9.5;
const SLEEP_DURATION_SIGMA_NEGATIVE = 1.0;
const SLEEP_DURATION_SIGMA_POSITIVE = 1.5;
const SLEEP_TIMING_SIGMA_HOURS = 1.5;
const SLEEP_STAGE_SIGMA = 0.05;
const SLEEP_WEIGHT_DURATION = 0.35;
const SLEEP_WEIGHT_EFFICIENCY = 0.25;
const SLEEP_WEIGHT_REGULARITY = 0.25;
const SLEEP_WEIGHT_TIMING = 0.1;
const SLEEP_WEIGHT_STAGE = 0.05;
const PRESSURE_D0 = 14;
const PRESSURE_SD = 3;
const RAW_TO_STRAIN_MAX = 21;
const DEBT_DECAY = 0.7;
const STEPS_TO_LOAD = 0.003;
const ENERGY_TO_LOAD = 0.02;

const DAYS_FOR_ACUTE = 7;
const DAYS_FOR_CHRONIC = 28;
const DAYS_FOR_BASELINE = 180;

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
    walkMinutesMin: 35,
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

const TRAINING_CATEGORY_RANK: Record<TrainingCategory, number> = {
  rest_walk: 0,
  recovery: 1,
  easy_run: 2,
  steady_run: 3,
  quality_run: 4,
};

type DailyComputation = {
  date: string;
  sleepNeedHours: number;
  sleepHours: number;
  sleepScore: number;
  sleepDurationScore: number;
  sleepEfficiencyScore: number;
  sleepRegularityScore: number;
  sleepTimingScore: number;
  sleepStageScore: number;
  sleepAwakeScore: number;
  sleepDebtHours: number;
  recoveryScore: number;
  mentalRecovery: number;
  physicalStrain: number;
  mentalStrain: number;
  physicalRawLoad: number;
  mentalRawLoad: number;
  physicalAcuteLoad: number;
  physicalChronicLoad: number;
  mentalAcuteLoad: number;
  mentalChronicLoad: number;
  physicalLoadRatio: number;
  mentalLoadRatio: number;
  pressure: number;
  physicalCap: number;
  mentalCap: number;
  physicalTargetLow: number;
  physicalTargetCenter: number;
  physicalTargetHigh: number;
  mentalTargetLow: number;
  mentalTargetCenter: number;
  mentalTargetHigh: number;
  confidenceSleep: number;
  confidenceRecovery: number;
  confidencePhysical: number;
  confidenceMentalRecovery: number;
  confidenceMentalStrain: number;
  confidenceOverall: number;
  zLhrv: number;
  zRhr: number;
  zRr: number;
  zSleep: number;
  zApl: number;
  zAml: number;
  underload: number;
  gate: number;
  gUnder: number;
  fallbackFlags: string[];
  narrative: string;
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

  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

function quantile(values: number[], q: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
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

function stdDev(values: number[]): number {
  if (values.length <= 1) {
    return 0;
  }

  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function robustScale(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const center = median(values);
  const deviations = values.map((value) => Math.abs(value - center));
  return 1.4826 * median(deviations);
}

function robustZ(value: number, history: number[]): number {
  if (!Number.isFinite(value) || history.length < 7) {
    return 0;
  }

  const center = median(history);
  const scale = Math.max(robustScale(history), EPSILON);
  return clamp((value - center) / scale, -ROBUST_Z_MAX, ROBUST_Z_MAX);
}

function ewmaHalfLife(previous: number, current: number, halfLifeDays: number): number {
  const decay = Math.exp(-Math.log(2) / halfLifeDays);
  return decay * previous + (1 - decay) * current;
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

function wrappedHour(hour: number): number {
  const normalized = hour % 24;
  return normalized < 0 ? normalized + 24 : normalized;
}

function wrappedHourDelta(left: number, right: number): number {
  const diff = Math.abs(left - right);
  return Math.min(diff, 24 - diff);
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

function windowCenterMinutes(startMinutes: number, endMinutes: number): number {
  if (endMinutes >= startMinutes) {
    return Math.round((startMinutes + endMinutes) / 2);
  }

  const wrappedEnd = endMinutes + 1440;
  const centerWrapped = Math.round((startMinutes + wrappedEnd) / 2);
  return centerWrapped % 1440;
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

function sentenceForDriver(mode: "negative" | "positive", key: SleepDriverKey): string {
  if (mode === "negative") {
    if (key === "debt") {
      return "Your score is mainly held down by accumulated sleep debt from recent nights.";
    }
    if (key === "duration") {
      return "Your score is mainly held down by sleep duration falling short of your target.";
    }
    if (key === "regularity") {
      return "Your score is mainly held down by inconsistent sleep timing across recent nights.";
    }
    if (key === "stage") {
      return "Your score is mainly held down by less favorable deep and REM sleep balance.";
    }
    if (key === "awake") {
      return "Your score is mainly held down by too much awake time during your sleep window.";
    }

    return "Your score is mainly held down by mismatch with your target sleep schedule timing.";
  }

  if (key === "debt") {
    return "Your score is mainly boosted by low accumulated sleep debt from recent nights.";
  }
  if (key === "duration") {
    return "Your score is mainly boosted by strong sleep duration relative to your target.";
  }
  if (key === "regularity") {
    return "Your score is mainly boosted by consistent sleep timing across recent nights.";
  }
  if (key === "stage") {
    return "Your score is mainly boosted by favorable deep and REM sleep balance.";
  }
  if (key === "awake") {
    return "Your score is mainly boosted by low awake time during your sleep window.";
  }

  return "Your score is mainly boosted by good alignment with your target sleep schedule timing.";
}

function isWalkSession(workout: WorkoutEntry): boolean {
  const label = `${workout.workoutNameRaw || ""} ${workout.workoutDisplayLabel || ""}`.toLowerCase();
  return workout.type === "recovery" || label.includes("walk");
}

function isRunSession(workout: WorkoutEntry): boolean {
  return workout.type === "cardio" && !isWalkSession(workout);
}

function getWorkoutAverageHeartRate(workout: WorkoutEntry): number | undefined {
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

  const avgHr = getWorkoutAverageHeartRate(workout);
  const hrMax = 208 - 0.7 * goals.ageYears;
  const hrr =
    typeof avgHr === "number" && hrMax - restingHr > 1
      ? clamp((avgHr - restingHr) / (hrMax - restingHr), 0, 1)
      : undefined;

  let intensityNorm = hrr;
  if (typeof intensityNorm !== "number") {
    if (typeof workout.avgSpeedKmh === "number" && Number.isFinite(workout.avgSpeedKmh)) {
      intensityNorm = clamp(workout.avgSpeedKmh / 15, 0, 1);
    } else if (distanceNorm > 0 && durationNorm > 0) {
      intensityNorm = clamp(0.55 * durationNorm + 0.45 * distanceNorm, 0, 1);
    } else {
      intensityNorm = durationNorm;
    }
  }

  if (isWalkSession(workout)) {
    const walkIndex = clamp(0.65 * durationNorm + 0.35 * distanceNorm * 0.7, 0, 1);
    return clamp(Math.round(1 + 9 * walkIndex), 1, 10);
  }

  const loadIndex = clamp(0.55 * intensityNorm + 0.25 * durationNorm + 0.2 * distanceNorm, 0, 1);
  return clamp(Math.round(1 + 9 * loadIndex), 1, 10);
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

function examImportance(exam: Exam): number {
  const text = `${exam.title} ${exam.paper}`.toLowerCase();
  if (text.includes("internal") || text.includes("oral") || text.includes("ia")) {
    return 0.75;
  }
  if (text.includes("paper 3")) {
    return 0.95;
  }
  return 0.9;
}

function todoImportance(todo: TodoItem): number {
  if (todo.ultraPriority) {
    return 0.5;
  }
  return 0.25;
}

function daysUntil(dateFromMs: number, eventIso: string): number {
  const eventMs = new Date(eventIso).getTime();
  if (!Number.isFinite(eventMs)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.floor((eventMs - dateFromMs) / 86_400_000);
}

function computePressure(dateKey: string, exams: Exam[], todos: TodoItem[]): {
  pressure: number;
  hasContext: boolean;
} {
  const dateStartMs = new Date(`${dateKey}T00:00:00`).getTime();
  if (!Number.isFinite(dateStartMs)) {
    return { pressure: 0, hasContext: false };
  }

  const events: Array<{ daysRemaining: number; importance: number }> = [];

  for (const exam of exams) {
    const delta = daysUntil(dateStartMs, exam.startsAt);
    if (delta < 0 || delta > 120) {
      continue;
    }

    events.push({
      daysRemaining: delta,
      importance: examImportance(exam),
    });
  }

  for (const todo of todos) {
    if (todo.archived || todo.completed) {
      continue;
    }

    const delta = daysUntil(dateStartMs, todo.deadline);
    if (delta < 0 || delta > 45) {
      continue;
    }

    events.push({
      daysRemaining: delta,
      importance: todoImportance(todo),
    });
  }

  if (events.length === 0) {
    return { pressure: 0, hasContext: false };
  }

  let survival = 1;
  for (const event of events) {
    const eventPressure = event.importance * sigmoid((PRESSURE_D0 - event.daysRemaining) / PRESSURE_SD);
    survival *= 1 - clamp(eventPressure, 0, 1);
  }

  return {
    pressure: clamp(1 - survival, 0, 1),
    hasContext: true,
  };
}

function mapRawToStrain(raw: number, cap: number): number {
  const safeCap = Math.max(cap, 1);
  const ratio = Math.log(1 + Math.max(0, raw)) / Math.log(1 + safeCap);
  return RAW_TO_STRAIN_MAX * clamp(ratio, 0, 1);
}

function buildTrainingCategory({
  recoveryScore,
  physicalTargetCenter,
  physicalTargetHigh,
  daysSinceRun,
}: {
  recoveryScore: number;
  physicalTargetCenter: number;
  physicalTargetHigh: number;
  daysSinceRun: number;
}): TrainingCategory {
  let category: TrainingCategory;

  if (recoveryScore < 45 || physicalTargetHigh < 6) {
    category = "rest_walk";
  } else if (recoveryScore < 60 || physicalTargetCenter < 8) {
    category = "recovery";
  } else if (recoveryScore < 72 || physicalTargetCenter < 11) {
    category = "easy_run";
  } else if (recoveryScore < 84 || physicalTargetCenter < 15) {
    category = "steady_run";
  } else {
    category = "quality_run";
  }

  if (daysSinceRun >= 14) {
    category = TRAINING_CATEGORY_RANK[category] <= TRAINING_CATEGORY_RANK.recovery ? category : "recovery";
  } else if (daysSinceRun >= 7) {
    category = TRAINING_CATEGORY_RANK[category] <= TRAINING_CATEGORY_RANK.easy_run ? category : "easy_run";
  }

  return category;
}

function computeDaysSinceRun(dateKey: string, workoutsByDate: Map<string, WorkoutEntry[]>): number {
  for (let daysBack = 0; daysBack <= 120; daysBack += 1) {
    const candidate = shiftDate(dateKey, -daysBack);
    const sessions = workoutsByDate.get(candidate) || [];
    if (sessions.some((session) => isRunSession(session))) {
      return daysBack;
    }
  }

  return 121;
}

function trimHistory(values: number[], days = DAYS_FOR_BASELINE): number[] {
  if (values.length <= days) {
    return values;
  }

  return values.slice(values.length - days);
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
    if (hrv <= 0) {
      next.hrvMs = undefined;
    } else if (hrv > 500) {
      next.hrvMs = 500;
    }
  }

  const sleepHours = positiveFinite(raw.sleepHours);
  if (typeof sleepHours === "number" && sleepHours > 16) {
    next.sleepHours = 0;
    next.sleepAsleepHours = undefined;
  }

  if (typeof raw.sleepMidpointHour === "number" && Number.isFinite(raw.sleepMidpointHour)) {
    next.sleepMidpointHour = wrappedHour(raw.sleepMidpointHour);
  }

  if (typeof raw.sleepBedtimeHour === "number" && Number.isFinite(raw.sleepBedtimeHour)) {
    next.sleepBedtimeHour = wrappedHour(raw.sleepBedtimeHour);
  }

  if (typeof raw.sleepRegularitySRI === "number" && Number.isFinite(raw.sleepRegularitySRI)) {
    next.sleepRegularitySRI = clamp(raw.sleepRegularitySRI, 0, 100);
  }

  return next;
}

function estimateNeedMap(dateWindow: string[], rows: DailyComputation[]): Record<string, number> {
  const result: Record<string, number> = {};

  for (let index = 0; index < dateWindow.length; index += 1) {
    const dateKey = dateWindow[index];
    const lookbackRows = rows
      .slice(Math.max(0, index - DAYS_FOR_BASELINE), index)
      .filter((row) => row.sleepHours > 0);

    if (lookbackRows.length < 30) {
      result[dateKey] = SLEEP_NEED_COLD_START_HOURS;
      continue;
    }

    const recoveryScores = lookbackRows.map((row) => row.recoveryScore);
    const threshold = quantile(recoveryScores, 0.8);
    const goodDays = lookbackRows.filter(
      (row) => row.recoveryScore >= threshold && Math.max(row.physicalStrain, row.mentalStrain) <= 19,
    );

    if (goodDays.length < 5) {
      result[dateKey] = SLEEP_NEED_COLD_START_HOURS;
      continue;
    }

    result[dateKey] = clamp(
      median(goodDays.map((row) => row.sleepHours)),
      SLEEP_NEED_MIN_HOURS,
      SLEEP_NEED_MAX_HOURS,
    );
  }

  return result;
}

function buildNarrative({
  sleepScore,
  recoveryScore,
  mentalRecovery,
  physicalStrain,
  mentalStrain,
  studyLow,
  studyHigh,
  workoutSuggestion,
  freshAirMinutes,
}: {
  sleepScore: number;
  recoveryScore: number;
  mentalRecovery: number;
  physicalStrain: number;
  mentalStrain: number;
  studyLow: number;
  studyHigh: number;
  workoutSuggestion: string;
  freshAirMinutes: number;
}): string {
  const sleepLabel =
    sleepScore >= 75 ? "slept well" : sleepScore >= 60 ? "had acceptable sleep" : "had limited sleep";
  const physicalLabel =
    recoveryScore >= 70 ? "strong" : recoveryScore >= 55 ? "moderate" : "constrained";
  const mentalLabel =
    mentalRecovery >= 70 ? "strong" : mentalRecovery >= 55 ? "moderate" : "fatigued";

  return `Last night you ${sleepLabel} (Sleep ${Math.round(sleepScore)}). Physical recovery is ${physicalLabel} (Recovery ${Math.round(recoveryScore)}/100, strain ${physicalStrain.toFixed(1)}/21). Mental recovery is ${mentalLabel} (${Math.round(mentalRecovery)}/100, mental strain ${mentalStrain.toFixed(1)}/21). Today aim for roughly ${studyLow.toFixed(1)}-${studyHigh.toFixed(1)}h focused study, at least ${freshAirMinutes} minutes outside, and ${workoutSuggestion}`;
}

function runComputationModel({
  dateWindow,
  healthByDate,
  workoutsByDate,
  sessionsByDate,
  goals,
  exams,
  todos,
  sleepNeedOverride,
}: {
  dateWindow: string[];
  healthByDate: Map<string, DailyHealthFact>;
  workoutsByDate: Map<string, WorkoutEntry[]>;
  sessionsByDate: Map<string, StudySession[]>;
  goals: PerformanceGoals;
  exams: Exam[];
  todos: TodoItem[];
  sleepNeedOverride?: Record<string, number>;
}): DailyComputation[] {
  const results: DailyComputation[] = [];

  let physicalAcute = 0;
  let physicalChronic = 0;
  let mentalAcute = 0;
  let mentalChronic = 0;
  let sleepDebt = 0;

  let previousRecovery = 50;
  let previousPhysicalTargetCenter = 9;

  const validSleepHoursHistory: number[] = [];
  const sleepScoreHistory: number[] = [];
  const midpointHistory: number[] = [];
  const bedtimeHistory: number[] = [];
  const stageIndexHistory: number[] = [];

  const lhrvHistory: number[] = [];
  const rhrHistory: number[] = [];
  const rrHistory: number[] = [];
  const physicalAcuteHistory: number[] = [];
  const mentalAcuteHistory: number[] = [];
  const physicalRawHistory: number[] = [];
  const mentalRawHistory: number[] = [];
  const mentalStrainHistory: number[] = [];
  const workoutMaxHrHistory: number[] = [];

  let validHistoryDays = 0;

  const preferredBedtimeStartMinutes = parseClockToMinutes(goals.preferredBedtimeStart, 21 * 60);
  const preferredBedtimeEndMinutes = parseClockToMinutes(goals.preferredBedtimeEnd, 22 * 60);
  const preferredBedtimeCenterMinutes = windowCenterMinutes(
    preferredBedtimeStartMinutes,
    preferredBedtimeEndMinutes,
  );
  const preferredBedtimeCenterHour = preferredBedtimeCenterMinutes / 60;

  for (let index = 0; index < dateWindow.length; index += 1) {
    const dateKey = dateWindow[index];
    const health = healthByDate.get(dateKey);
    const workouts = workoutsByDate.get(dateKey) || [];
    const sessions = sessionsByDate.get(dateKey) || [];

    const fallbackFlags: string[] = [];

    const sleepNeedHours = clamp(
      sleepNeedOverride?.[dateKey] ?? SLEEP_NEED_COLD_START_HOURS,
      SLEEP_NEED_MIN_HOURS,
      SLEEP_NEED_MAX_HOURS,
    );

    const sleepInBed = positiveFinite(health?.sleepInBedHours);
    let sleepHours =
      positiveFinite(health?.sleepAsleepHours) ??
      positiveFinite(health?.sleepHours) ??
      undefined;

    if (typeof sleepHours !== "number" && typeof sleepInBed === "number") {
      sleepHours = 0.85 * sleepInBed;
      fallbackFlags.push("sleep_tst_from_tib");
    }

    if (typeof sleepHours === "number" && sleepHours > 16) {
      sleepHours = undefined;
      fallbackFlags.push("sleep_hours_invalid");
    }

    const deepHours = positiveFinite(health?.sleepDeepHours);
    const remHours = positiveFinite(health?.sleepRemHours);
    const coreHours = positiveFinite(health?.sleepCoreHours);
    const awakeHours = positiveFinite(health?.sleepAwakeHours);

    const durationDelta = typeof sleepHours === "number" ? sleepHours - sleepNeedHours : 0;
    const sigma = durationDelta < 0 ? SLEEP_DURATION_SIGMA_NEGATIVE : SLEEP_DURATION_SIGMA_POSITIVE;
    const sleepDurationScore =
      typeof sleepHours === "number"
        ? 100 * Math.exp(-(durationDelta ** 2) / (2 * sigma ** 2))
        : 50;

    const sleepEfficiency =
      typeof sleepHours === "number" && typeof sleepInBed === "number"
        ? sleepHours / Math.max(sleepInBed, 0.1)
        : undefined;
    const sleepEfficiencyScore =
      typeof sleepEfficiency === "number"
        ? 100 * clamp((sleepEfficiency - 0.7) / (0.95 - 0.7), 0, 1)
        : 50;

    let bedtimeHour = safeFinite(health?.sleepBedtimeHour);
    let midpointHour = safeFinite(health?.sleepMidpointHour);

    if (typeof midpointHour !== "number" && typeof bedtimeHour === "number" && typeof sleepHours === "number") {
      midpointHour = wrappedHour(bedtimeHour + sleepHours / 2);
    }

    if (typeof bedtimeHour !== "number" && typeof midpointHour === "number" && typeof sleepHours === "number") {
      bedtimeHour = wrappedHour(midpointHour - sleepHours / 2);
    }

    if (typeof bedtimeHour !== "number") {
      bedtimeHour = preferredBedtimeCenterHour;
      fallbackFlags.push("sleep_bedtime_default");
    }

    const regularitySRI = safeFinite(health?.sleepRegularitySRI);
    let sleepRegularityScore = 65;

    if (typeof regularitySRI === "number") {
      sleepRegularityScore = clamp(regularitySRI, 0, 100);
    } else {
      const midpointWindow = trimHistory([
        ...midpointHistory,
        ...(typeof midpointHour === "number" ? [midpointHour] : []),
      ], 7);
      const bedtimeWindow = trimHistory([
        ...bedtimeHistory,
        ...(typeof bedtimeHour === "number" ? [bedtimeHour] : []),
      ], 7);
      const sleepWindow = trimHistory(
        [
          ...validSleepHoursHistory,
          ...(typeof sleepHours === "number" ? [sleepHours] : []),
        ],
        7,
      );

      if (midpointWindow.length >= 4 && bedtimeWindow.length >= 4) {
        sleepRegularityScore = clamp(
          100 - 16 * stdDev(midpointWindow) - 10 * stdDev(bedtimeWindow),
          35,
          100,
        );
      } else if (sleepWindow.length >= 4) {
        sleepRegularityScore = clamp(100 - 12 * stdDev(sleepWindow), 30, 96);
      } else {
        sleepRegularityScore = 65;
      }
      fallbackFlags.push("sleep_regularity_proxy");
    }

    const midpointBaseline = midpointHistory.length > 0 ? median(trimHistory(midpointHistory, DAYS_FOR_CHRONIC)) : undefined;
    const sleepTimingScore =
      typeof midpointHour === "number" && typeof midpointBaseline === "number"
        ? 100 * Math.exp(-(wrappedHourDelta(midpointHour, midpointBaseline) ** 2) / (2 * SLEEP_TIMING_SIGMA_HOURS ** 2))
        : 60;

    if (typeof midpointBaseline !== "number") {
      fallbackFlags.push("sleep_timing_proxy");
    }

    let sleepStageScore = 50;
    let stageIndex: number | undefined;
    if (typeof sleepHours === "number" && sleepHours > 0 && (typeof deepHours === "number" || typeof remHours === "number")) {
      stageIndex = ((deepHours || 0) + (remHours || 0)) / Math.max(sleepHours, 0.1);
      const stageBaseline = stageIndexHistory.length > 0 ? median(trimHistory(stageIndexHistory, DAYS_FOR_BASELINE)) : undefined;
      if (typeof stageBaseline === "number") {
        sleepStageScore =
          100 * Math.exp(-((stageIndex - stageBaseline) ** 2) / (2 * SLEEP_STAGE_SIGMA ** 2));
      } else {
        sleepStageScore = 75;
      }
    } else {
      fallbackFlags.push("sleep_stage_neutral");
    }

    const sleepAwakeScore =
      typeof awakeHours === "number" && typeof sleepInBed === "number"
        ? clamp(100 - (awakeHours / Math.max(sleepInBed, 0.1)) * 220, 30, 100)
        : sleepEfficiencyScore;

    const sleepScore = clamp(
      SLEEP_WEIGHT_DURATION * sleepDurationScore +
        SLEEP_WEIGHT_EFFICIENCY * sleepEfficiencyScore +
        SLEEP_WEIGHT_REGULARITY * sleepRegularityScore +
        SLEEP_WEIGHT_TIMING * sleepTimingScore +
        SLEEP_WEIGHT_STAGE * sleepStageScore,
      0,
      100,
    );

    const dailyDebt = typeof sleepHours === "number" ? Math.max(0, sleepNeedHours - sleepHours) : 0;
    sleepDebt = sleepDebt * DEBT_DECAY + dailyDebt;

    const restingHr = safeFinite(health?.restingHrBpm);
    const respiratoryRate = safeFinite(health?.respiratoryRateBpm);
    const hrvMs = safeFinite(health?.hrvMs);

    const hrRestBase =
      rhrHistory.length > 0 ? median(trimHistory(rhrHistory, DAYS_FOR_BASELINE)) : 60;

    const healthHrMax = safeFinite(health?.heartRateMaxBpm);
    if (typeof healthHrMax === "number" && healthHrMax > 0) {
      workoutMaxHrHistory.push(healthHrMax);
    }

    for (const workout of workouts) {
      if (typeof workout.hrMax === "number" && Number.isFinite(workout.hrMax) && workout.hrMax > 0) {
        workoutMaxHrHistory.push(workout.hrMax);
      }
    }

    const hrMaxEstimate =
      workoutMaxHrHistory.length > 0
        ? Math.max(quantile(trimHistory(workoutMaxHrHistory, DAYS_FOR_BASELINE), 0.99), 170)
        : 190;

    let physicalRawLoad = 0;
    let hadHrWorkout = false;
    let hadWorkoutWithoutHr = false;

    for (const workout of workouts) {
      const durationMin = Math.max(0, workout.durationMin || 0);
      if (durationMin <= 0) {
        continue;
      }

      const avgHr = getWorkoutAverageHeartRate(workout);
      let hrr: number | undefined;

      if (typeof avgHr === "number" && hrMaxEstimate - hrRestBase > 5) {
        hrr = clamp((avgHr - hrRestBase) / (hrMaxEstimate - hrRestBase), 0, 1);
        hadHrWorkout = true;
      } else {
        const energyKj = safeFinite(workout.activeEnergyKj);
        if (typeof energyKj === "number" && energyKj > 0) {
          const energyRate = energyKj / durationMin;
          hrr = clamp((energyRate - 5) / 20, 0.25, 0.78);
          hadWorkoutWithoutHr = true;
          fallbackFlags.push("workout_hrr_from_energy");
        } else if (typeof workout.avgSpeedKmh === "number" && Number.isFinite(workout.avgSpeedKmh)) {
          hrr = clamp((workout.avgSpeedKmh - 6) / 10, 0.2, 0.8);
          hadWorkoutWithoutHr = true;
          fallbackFlags.push("workout_hrr_from_speed");
        }
      }

      if (typeof hrr !== "number") {
        continue;
      }

      const trimp = durationMin * hrr * 0.75 * Math.exp(1.8 * hrr);
      physicalRawLoad += trimp;
    }

    const steps = safeFinite(health?.steps) || 0;
    const activeEnergyKj = safeFinite(health?.activeEnergyKj) || 0;

    if (!hadHrWorkout) {
      const nonWorkoutLoad = STEPS_TO_LOAD * steps + ENERGY_TO_LOAD * activeEnergyKj;
      if (nonWorkoutLoad > 0) {
        physicalRawLoad += nonWorkoutLoad;
        fallbackFlags.push("physical_nonworkout_load");
      }
    }

    if (workouts.length === 0 && physicalRawLoad === 0) {
      fallbackFlags.push("physical_no_activity_data");
    }

    const { pressure, hasContext: hasPressureContext } = computePressure(dateKey, exams, todos);

    const switchFactor = clamp((sessions.length - 1) / 5, 0, 1);
    const bed28 =
      bedtimeHistory.length > 0
        ? median(trimHistory(bedtimeHistory, DAYS_FOR_CHRONIC))
        : preferredBedtimeCenterHour;

    let sessionImpulse = 0;

    for (const session of sessions) {
      const durationMin = Math.max(0, session.durationSec / 60);
      if (durationMin <= 0) {
        continue;
      }

      const sessionDate = new Date(session.startedAt);
      const startHour = Number.isFinite(sessionDate.getTime())
        ? sessionDate.getHours() + sessionDate.getMinutes() / 60
        : 12;

      const lateFactor = sigmoid((startHour - (bed28 - 2)) / 0.5);
      const intensity = (1 + 0.5 * pressure) * (1 + 0.3 * lateFactor) * (1 + 0.2 * switchFactor);
      sessionImpulse += durationMin * intensity;
    }

    const mentalBackground = 30 * pressure;
    const mentalRawLoad = sessionImpulse + mentalBackground;

    if (sessions.length === 0) {
      fallbackFlags.push("mental_background_only");
    }
    if (!hasPressureContext) {
      fallbackFlags.push("pressure_context_missing");
    }

    physicalAcute = ewmaHalfLife(physicalAcute, physicalRawLoad, DAYS_FOR_ACUTE);
    physicalChronic = ewmaHalfLife(physicalChronic, physicalRawLoad, DAYS_FOR_CHRONIC);
    mentalAcute = ewmaHalfLife(mentalAcute, mentalRawLoad, DAYS_FOR_ACUTE);
    mentalChronic = ewmaHalfLife(mentalChronic, mentalRawLoad, DAYS_FOR_CHRONIC);

    const zSleep = robustZ(sleepScore, trimHistory(sleepScoreHistory, DAYS_FOR_BASELINE));
    const zApl = robustZ(physicalAcute, trimHistory(physicalAcuteHistory, DAYS_FOR_BASELINE));
    const zAml = robustZ(mentalAcute, trimHistory(mentalAcuteHistory, DAYS_FOR_BASELINE));
    const zRhr =
      typeof restingHr === "number"
        ? robustZ(restingHr, trimHistory(rhrHistory, DAYS_FOR_BASELINE))
        : 0;
    const zRr =
      typeof respiratoryRate === "number"
        ? robustZ(respiratoryRate, trimHistory(rrHistory, DAYS_FOR_BASELINE))
        : 0;

    let lhrv: number | undefined;
    if (typeof hrvMs === "number") {
      const ibi = 60000 / Math.max(restingHr || hrRestBase, 1);
      const normalizedHrv = hrvMs / ibi;
      lhrv = Math.log(Math.max(normalizedHrv, EPSILON));
    }

    const zLhrv =
      typeof lhrv === "number"
        ? robustZ(lhrv, trimHistory(lhrvHistory, DAYS_FOR_BASELINE))
        : 0;

    let recoveryLogit = 0.6 * zSleep - 0.5 * zApl - 0.4 * zAml;

    if (typeof lhrv === "number") {
      recoveryLogit += 0.9 * zLhrv;
    } else {
      fallbackFlags.push("recovery_missing_hrv");
    }

    if (typeof restingHr === "number") {
      recoveryLogit -= 0.7 * zRhr;
    } else {
      fallbackFlags.push("recovery_missing_rhr");
    }

    if (typeof respiratoryRate === "number") {
      recoveryLogit -= 0.5 * zRr;
    } else {
      fallbackFlags.push("recovery_missing_rr");
    }

    let recoveryScore = 100 * sigmoid(recoveryLogit);
    const illnessLikeSpike =
      (typeof restingHr === "number" && zRhr > 1.5) ||
      (typeof respiratoryRate === "number" && zRr > 1.5);
    const maxRecoveryDelta = illnessLikeSpike ? 35 : 25;
    recoveryScore = clamp(recoveryScore, previousRecovery - maxRecoveryDelta, previousRecovery + maxRecoveryDelta);

    let mentalRecoveryLogit = 0.9 * zSleep - 0.7 * zAml - 0.4 * pressure;
    if (typeof lhrv === "number") {
      mentalRecoveryLogit += 0.6 * zLhrv;
    }
    if (typeof restingHr === "number") {
      mentalRecoveryLogit -= 0.5 * zRhr;
    }
    if (typeof respiratoryRate === "number") {
      mentalRecoveryLogit -= 0.4 * zRr;
    }
    const mentalRecovery = 100 * sigmoid(mentalRecoveryLogit);

    const physicalCapHistory = trimHistory([...physicalRawHistory, physicalRawLoad], DAYS_FOR_BASELINE).filter(
      (value) => Number.isFinite(value) && value >= 0,
    );
    const mentalCapHistory = trimHistory([...mentalRawHistory, mentalRawLoad], DAYS_FOR_BASELINE).filter(
      (value) => Number.isFinite(value) && value >= 0,
    );

    const p95Phys = quantile(physicalCapHistory, 0.95);
    const p95Mental = quantile(mentalCapHistory, 0.95);

    const physicalCap =
      physicalCapHistory.length < 30 ? Math.max(p95Phys, 200) : Math.max(p95Phys, 150);
    const mentalCap =
      mentalCapHistory.length < 30 ? Math.max(p95Mental, 180) : Math.max(p95Mental, 120);

    const physicalStrain = mapRawToStrain(physicalRawLoad, physicalCap);
    const mentalStrain = mapRawToStrain(mentalRawLoad, mentalCap);

    const hasSleepPresence = typeof sleepHours === "number";
    const hasStagePresence =
      typeof deepHours === "number" || typeof remHours === "number" || typeof coreHours === "number";

    const confHist = clamp(validHistoryDays / DAYS_FOR_BASELINE, 0.2, 1);

    const sleepAvail = clamp(
      (hasSleepPresence ? 0.4 : 0) +
        (typeof sleepInBed === "number" ? 0.2 : 0) +
        (typeof midpointHour === "number" ? 0.2 : 0) +
        (typeof regularitySRI === "number" ? 0.15 : 0.05) +
        (hasStagePresence ? 0.05 : 0),
      0,
      1,
    );

    const recoveryAvail =
      0.4 * (typeof lhrv === "number" ? 1 : 0) +
      0.3 * (typeof restingHr === "number" ? 1 : 0) +
      0.2 * (typeof respiratoryRate === "number" ? 1 : 0) +
      0.1 * (hasSleepPresence ? 1 : 0);

    const physicalAvail = hadHrWorkout
      ? 1
      : hadWorkoutWithoutHr
      ? 0.75
      : steps > 0 || activeEnergyKj > 0
      ? 0.6
      : 0.35;

    const mentalStrainAvail =
      sessions.length > 0 && hasPressureContext
        ? 1
        : sessions.length > 0
        ? 0.8
        : hasPressureContext
        ? 0.65
        : 0.45;

    const mentalRecoveryAvail = clamp(0.6 * recoveryAvail + 0.4 * mentalStrainAvail, 0, 1);

    const sourceCount = [
      typeof lhrv === "number",
      typeof restingHr === "number",
      typeof respiratoryRate === "number",
      hasSleepPresence,
    ].filter(Boolean).length;

    const extremeCount = [zLhrv, zRhr, zRr, zSleep]
      .map((value) => Math.abs(value))
      .filter((value) => value > 3).length;

    let confNoise = 1 - 0.1 * extremeCount;
    if (extremeCount > 0 && sourceCount <= 2) {
      confNoise -= 0.2;
    }
    confNoise = clamp(confNoise, 0.45, 1);

    const confidenceSleep = clamp(sleepAvail * confNoise * confHist, 0, 1);
    const confidenceRecovery = clamp(recoveryAvail * confNoise * confHist, 0, 1);
    const confidencePhysical = clamp(physicalAvail * confNoise * confHist, 0, 1);
    const confidenceMentalStrain = clamp(mentalStrainAvail * confNoise * confHist, 0, 1);
    const confidenceMentalRecovery = clamp(mentalRecoveryAvail * confNoise * confHist, 0, 1);
    const confidenceOverall =
      (confidenceSleep + confidenceRecovery + confidencePhysical + confidenceMentalStrain + confidenceMentalRecovery) / 5;

    const physicalLoadRatio = (physicalAcute + 1) / (physicalChronic + 1);
    const physicalRecoveryFactor = 0.7 + 0.9 * (recoveryScore / 100);
    const physicalOverreach = Math.exp(-0.35 * Math.max(physicalLoadRatio - 1.2, 0));

    const physicalTargetCenterRaw = physicalChronic * physicalRecoveryFactor * physicalOverreach;
    const widthPhysicalRaw =
      0.35 * physicalChronic * (1 + 0.5 * (1 - confidencePhysical));

    let physicalTargetCenter = mapRawToStrain(physicalTargetCenterRaw, physicalCap);
    let physicalTargetLow = mapRawToStrain(
      Math.max(physicalTargetCenterRaw - 0.5 * widthPhysicalRaw, 0),
      physicalCap,
    );
    let physicalTargetHigh = mapRawToStrain(
      physicalTargetCenterRaw + 0.5 * widthPhysicalRaw,
      physicalCap,
    );

    const clampedCenter = clamp(
      physicalTargetCenter,
      previousPhysicalTargetCenter - 3,
      previousPhysicalTargetCenter + 3,
    );
    if (Math.abs(clampedCenter - physicalTargetCenter) > EPSILON) {
      const shift = clampedCenter - physicalTargetCenter;
      physicalTargetCenter = clampedCenter;
      physicalTargetLow = clamp(physicalTargetLow + shift, 0, RAW_TO_STRAIN_MAX);
      physicalTargetHigh = clamp(physicalTargetHigh + shift, 0, RAW_TO_STRAIN_MAX);
      fallbackFlags.push("physical_target_guardrail");
    }

    const mentalLoadRatio = (mentalAcute + 1) / (mentalChronic + 1);
    const mentalRecoveryFactor = 0.7 + 0.9 * (mentalRecovery / 100);
    const mentalOverreach = Math.exp(-0.35 * Math.max(mentalLoadRatio - 1.2, 0));

    const recentMentalStrains = trimHistory(mentalStrainHistory, 2);
    const mentalStrain2d =
      recentMentalStrains.length >= 2
        ? (recentMentalStrains[recentMentalStrains.length - 1] + recentMentalStrains[recentMentalStrains.length - 2]) / 2
        : recentMentalStrains.length === 1
        ? recentMentalStrains[0]
        : mentalStrain;

    const recentMentalHistory = trimHistory(mentalStrainHistory, DAYS_FOR_BASELINE);
    const recentPositiveMentalHistory = recentMentalHistory.filter((value) => value > 0.1);
    const q25Mental =
      recentPositiveMentalHistory.length >= 7
        ? quantile(recentPositiveMentalHistory, 0.25)
        : quantile(recentMentalHistory, 0.25);
    const underload = sigmoid((q25Mental - mentalStrain2d) / 1.0);
    const gate = sigmoid((mentalRecovery - 70) / 10);

    const gUnder = mentalStrainHistory.length >= 14 ? 1 + 0.25 * underload * gate : 1;

    const mentalTargetCenterRaw =
      mentalChronic * mentalRecoveryFactor * mentalOverreach * gUnder;
    const widthMentalRaw =
      0.4 * mentalChronic * (1 + 0.5 * (1 - confidenceMentalStrain));

    const mentalTargetCenter = mapRawToStrain(mentalTargetCenterRaw, mentalCap);
    const mentalTargetLow = mapRawToStrain(
      Math.max(mentalTargetCenterRaw - 0.5 * widthMentalRaw, 0),
      mentalCap,
    );
    const mentalTargetHigh = mapRawToStrain(
      mentalTargetCenterRaw + 0.5 * widthMentalRaw,
      mentalCap,
    );

    const daysSinceRun = computeDaysSinceRun(dateKey, workoutsByDate);
    const trainingCategory = buildTrainingCategory({
      recoveryScore,
      physicalTargetCenter,
      physicalTargetHigh,
      daysSinceRun,
    });

    const prescription = TRAINING_PRESCRIPTIONS[trainingCategory];
    const workoutSuggestion = prescription.isRunRecommended
      ? `${prescription.label.toLowerCase()} (${prescription.runMinutesMin}-${prescription.runMinutesMax}m run, RPE ${prescription.targetRpeMin}-${prescription.targetRpeMax})`
      : `active recovery walk (${prescription.walkMinutesMin}-${prescription.walkMinutesMax}m)`;

    const studyTargetCenterHours = clamp(
      goals.baselineStudyHours * (0.55 + 0.9 * (mentalTargetCenter / RAW_TO_STRAIN_MAX)),
      0.5,
      9,
    );

    const studyHalfWidth = Math.max(
      0.5,
      ((mentalTargetHigh - mentalTargetLow) / RAW_TO_STRAIN_MAX) * 2.8,
    );
    const studyTargetHoursLow = round(clamp(studyTargetCenterHours - studyHalfWidth, 0.5, 10), 1);
    const studyTargetHoursHigh = round(
      clamp(studyTargetCenterHours + studyHalfWidth, studyTargetHoursLow + 0.3, 10),
      1,
    );

    const freshAirMinutes =
      mentalRecovery < 45 ? 60 : mentalRecovery < 55 || pressure > 0.55 ? 45 : mentalRecovery < 70 ? 30 : 20;

    const narrative = buildNarrative({
      sleepScore,
      recoveryScore,
      mentalRecovery,
      physicalStrain,
      mentalStrain,
      studyLow: studyTargetHoursLow,
      studyHigh: studyTargetHoursHigh,
      workoutSuggestion,
      freshAirMinutes,
    });

    const sleepNegativeDrivers: Array<{ key: SleepDriverKey; impact: number }> = [
      { key: "debt", impact: sleepDebt * 4 },
      { key: "duration", impact: (100 - sleepDurationScore) * SLEEP_WEIGHT_DURATION },
      { key: "regularity", impact: (100 - sleepRegularityScore) * SLEEP_WEIGHT_REGULARITY },
      { key: "stage", impact: (100 - sleepStageScore) * SLEEP_WEIGHT_STAGE },
      { key: "awake", impact: (100 - sleepAwakeScore) * 0.1 },
      { key: "schedule", impact: (100 - sleepTimingScore) * SLEEP_WEIGHT_TIMING },
    ];

    const sleepPositiveDrivers: Array<{ key: SleepDriverKey; impact: number }> = [
      { key: "duration", impact: sleepDurationScore * SLEEP_WEIGHT_DURATION },
      { key: "regularity", impact: sleepRegularityScore * SLEEP_WEIGHT_REGULARITY },
      { key: "stage", impact: sleepStageScore * SLEEP_WEIGHT_STAGE },
      { key: "awake", impact: sleepAwakeScore * 0.1 },
      { key: "schedule", impact: sleepTimingScore * SLEEP_WEIGHT_TIMING },
    ];

    const sleepDriverMode: "negative" | "positive" = sleepScore < 65 ? "negative" : "positive";
    const dominantSleepDriver =
      sleepDriverMode === "negative"
        ? sleepNegativeDrivers.slice().sort((left, right) => right.impact - left.impact)[0]
        : sleepPositiveDrivers.slice().sort((left, right) => right.impact - left.impact)[0];
    const sleepDriverKey = dominantSleepDriver?.key || "duration";
    const sleepDriverImpact = dominantSleepDriver?.impact || 0;

    const readinessScore = clamp(0.65 * recoveryScore + 0.35 * mentalRecovery, 0, 100);
    const autonomicComponent = clamp(50 + 18 * zLhrv - 12 * zRhr - 8 * zRr, 0, 100);
    const loadComponent = clamp(
      100 - 70 * Math.max(physicalLoadRatio - 1, 0) - 45 * Math.max(mentalLoadRatio - 1, 0),
      0,
      100,
    );
    const cognitiveComponent = clamp(
      0.55 * mentalRecovery + 0.45 * (100 - (mentalStrain / RAW_TO_STRAIN_MAX) * 100),
      0,
      100,
    );

    let bedtimeMinutes = preferredBedtimeCenterMinutes;
    bedtimeMinutes -= clamp(sleepDebt, 0, 3) * 10;
    bedtimeMinutes -= clamp((65 - recoveryScore) / 20, 0, 1) * 15;
    bedtimeMinutes -= clamp((70 - mentalRecovery) / 25, 0, 1) * 8;
    bedtimeMinutes += clamp((recoveryScore - 85) / 20, 0, 1) * 8;

    const bedtimeHalfRangeMinutes = Math.round(10 + (1 - confidenceOverall) * 16);

    const result: DailyComputation = {
      date: dateKey,
      sleepNeedHours,
      sleepHours: round(sleepHours || 0, 2),
      sleepScore: round(sleepScore, 1),
      sleepDurationScore: round(sleepDurationScore, 1),
      sleepEfficiencyScore: round(sleepEfficiencyScore, 1),
      sleepRegularityScore: round(sleepRegularityScore, 1),
      sleepTimingScore: round(sleepTimingScore, 1),
      sleepStageScore: round(sleepStageScore, 1),
      sleepAwakeScore: round(sleepAwakeScore, 1),
      sleepDebtHours: round(sleepDebt, 2),
      recoveryScore: round(recoveryScore, 1),
      mentalRecovery: round(mentalRecovery, 1),
      physicalStrain: round(physicalStrain, 2),
      mentalStrain: round(mentalStrain, 2),
      physicalRawLoad: round(physicalRawLoad, 2),
      mentalRawLoad: round(mentalRawLoad, 2),
      physicalAcuteLoad: round(physicalAcute, 2),
      physicalChronicLoad: round(physicalChronic, 2),
      mentalAcuteLoad: round(mentalAcute, 2),
      mentalChronicLoad: round(mentalChronic, 2),
      physicalLoadRatio: round(physicalLoadRatio, 3),
      mentalLoadRatio: round(mentalLoadRatio, 3),
      pressure: round(pressure, 3),
      physicalCap: round(physicalCap, 2),
      mentalCap: round(mentalCap, 2),
      physicalTargetLow: round(physicalTargetLow, 2),
      physicalTargetCenter: round(physicalTargetCenter, 2),
      physicalTargetHigh: round(physicalTargetHigh, 2),
      mentalTargetLow: round(mentalTargetLow, 2),
      mentalTargetCenter: round(mentalTargetCenter, 2),
      mentalTargetHigh: round(mentalTargetHigh, 2),
      confidenceSleep: round(confidenceSleep, 3),
      confidenceRecovery: round(confidenceRecovery, 3),
      confidencePhysical: round(confidencePhysical, 3),
      confidenceMentalRecovery: round(confidenceMentalRecovery, 3),
      confidenceMentalStrain: round(confidenceMentalStrain, 3),
      confidenceOverall: round(confidenceOverall, 3),
      zLhrv: round(zLhrv, 3),
      zRhr: round(zRhr, 3),
      zRr: round(zRr, 3),
      zSleep: round(zSleep, 3),
      zApl: round(zApl, 3),
      zAml: round(zAml, 3),
      underload: round(underload, 3),
      gate: round(gate, 3),
      gUnder: round(gUnder, 3),
      fallbackFlags: [...new Set(fallbackFlags)],
      narrative,
    };

    const hasAnyDailyData =
      hasSleepPresence ||
      typeof restingHr === "number" ||
      typeof respiratoryRate === "number" ||
      typeof hrvMs === "number" ||
      workouts.length > 0 ||
      sessions.length > 0;

    if (hasAnyDailyData) {
      validHistoryDays += 1;
    }

    if (typeof sleepHours === "number") {
      validSleepHoursHistory.push(sleepHours);
    }

    if (typeof midpointHour === "number") {
      midpointHistory.push(midpointHour);
    }

    if (typeof bedtimeHour === "number") {
      bedtimeHistory.push(bedtimeHour);
    }

    if (typeof stageIndex === "number") {
      stageIndexHistory.push(stageIndex);
    }

    if (typeof lhrv === "number") {
      lhrvHistory.push(lhrv);
    }

    if (typeof restingHr === "number") {
      rhrHistory.push(restingHr);
    }

    if (typeof respiratoryRate === "number") {
      rrHistory.push(respiratoryRate);
    }

    sleepScoreHistory.push(sleepScore);
    physicalAcuteHistory.push(physicalAcute);
    mentalAcuteHistory.push(mentalAcute);
    physicalRawHistory.push(physicalRawLoad);
    mentalRawHistory.push(mentalRawLoad);
    mentalStrainHistory.push(mentalStrain);

    previousRecovery = recoveryScore;
    previousPhysicalTargetCenter = physicalTargetCenter;

    // Attach recommendation fields to avoid recomputing below.
    (result as DailyComputation & {
      __trainingCategory?: TrainingCategory;
      __studyTargetHoursLow?: number;
      __studyTargetHoursHigh?: number;
      __workoutSuggestion?: string;
      __bedtimeMinutes?: number;
      __bedtimeHalfRange?: number;
      __freshAirMinutes?: number;
      __sleepDriverMode?: "negative" | "positive";
      __sleepDriverKey?: SleepDriverKey;
      __sleepDriverImpact?: number;
      __readinessScore?: number;
      __autonomicComponent?: number;
      __loadComponent?: number;
      __cognitiveComponent?: number;
    }).__trainingCategory = trainingCategory;
    (result as DailyComputation & { __studyTargetHoursLow?: number }).__studyTargetHoursLow =
      studyTargetHoursLow;
    (result as DailyComputation & { __studyTargetHoursHigh?: number }).__studyTargetHoursHigh =
      studyTargetHoursHigh;
    (result as DailyComputation & { __workoutSuggestion?: string }).__workoutSuggestion =
      workoutSuggestion;
    (result as DailyComputation & { __bedtimeMinutes?: number }).__bedtimeMinutes = bedtimeMinutes;
    (result as DailyComputation & { __bedtimeHalfRange?: number }).__bedtimeHalfRange =
      bedtimeHalfRangeMinutes;
    (result as DailyComputation & { __freshAirMinutes?: number }).__freshAirMinutes = freshAirMinutes;
    (result as DailyComputation & { __sleepDriverMode?: "negative" | "positive" }).__sleepDriverMode =
      sleepDriverMode;
    (result as DailyComputation & { __sleepDriverKey?: SleepDriverKey }).__sleepDriverKey =
      sleepDriverKey;
    (result as DailyComputation & { __sleepDriverImpact?: number }).__sleepDriverImpact =
      sleepDriverImpact;
    (result as DailyComputation & { __readinessScore?: number }).__readinessScore = readinessScore;
    (result as DailyComputation & { __autonomicComponent?: number }).__autonomicComponent =
      autonomicComponent;
    (result as DailyComputation & { __loadComponent?: number }).__loadComponent = loadComponent;
    (result as DailyComputation & { __cognitiveComponent?: number }).__cognitiveComponent =
      cognitiveComponent;

    results.push(result);
  }

  return results;
}

function defaultScientificMetric(todayKey: string): ScientificDailyMetrics {
  return {
    date: todayKey,
    sleepNeedHours: 8,
    sleepHours: 0,
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
    physicalLoadRatio: 1,
    mentalLoadRatio: 1,
    physicalCap: 200,
    mentalCap: 180,
    physicalTarget: { low: 0, center: 0, high: 3 },
    mentalTarget: { low: 0, center: 0, high: 3 },
    components: {
      sleepDuration: 50,
      sleepEfficiency: 50,
      sleepRegularity: 50,
      sleepTiming: 50,
      sleepStage: 50,
      zLhrv: 0,
      zRhr: 0,
      zRr: 0,
      zSleep: 0,
      zApl: 0,
      zAml: 0,
      underload: 0.5,
      gate: 0.5,
      gUnder: 1,
      pressure: 0,
    },
    confidence: {
      sleep: 0.2,
      recovery: 0.2,
      physicalStrain: 0.2,
      mentalRecovery: 0.2,
      mentalStrain: 0.2,
      overall: 0.2,
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
    sleepDriverSentence: "Your score is mainly held down by sleep duration falling short of your target.",
    sleepComponent: 50,
    autonomicComponent: 50,
    loadComponent: 50,
    cognitiveComponent: 50,
    penalty: 0,
    sleepDebtHours: 0,
    sleepHours: 0,
    loadRatio: 1,
    zHrv: 0,
    zRhr: 0,
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
    recommendedFreshAirMinutes: 30,
    physicalTargetLow: 3,
    physicalTargetHigh: 8,
    mentalTargetLow: 3,
    mentalTargetHigh: 8,
    scientificSummary:
      "Model confidence is low today. Keep study and training moderate while collecting more consistent health data.",
  };
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

  const enrichedWorkouts = data.workouts
    .slice()
    .sort(
      (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
    )
    .map((workout) => {
      const workoutDate = toDateKey(workout.startedAt);
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
    const dateKey = toDateKey(workout.startedAt);
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
  const minimumStart = shiftDate(todayKey, -240);

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

  const pass1 = runComputationModel({
    dateWindow,
    healthByDate,
    workoutsByDate,
    sessionsByDate,
    goals,
    exams: data.exams,
    todos: data.todos,
  });

  const personalizedNeedMap = estimateNeedMap(dateWindow, pass1);

  const rows = runComputationModel({
    dateWindow,
    healthByDate,
    workoutsByDate,
    sessionsByDate,
    goals,
    exams: data.exams,
    todos: data.todos,
    sleepNeedOverride: personalizedNeedMap,
  });

  const readinessByDate: Record<string, DailyReadiness> = {};
  const recommendationsByDate: Record<string, DailyRecommendation> = {};
  const scientificByDate: Record<string, ScientificDailyMetrics> = {};

  for (const row of rows) {
    const anyRow = row as DailyComputation & {
      __trainingCategory?: TrainingCategory;
      __studyTargetHoursLow?: number;
      __studyTargetHoursHigh?: number;
      __workoutSuggestion?: string;
      __bedtimeMinutes?: number;
      __bedtimeHalfRange?: number;
      __freshAirMinutes?: number;
      __sleepDriverMode?: "negative" | "positive";
      __sleepDriverKey?: SleepDriverKey;
      __sleepDriverImpact?: number;
      __readinessScore?: number;
      __autonomicComponent?: number;
      __loadComponent?: number;
      __cognitiveComponent?: number;
    };

    const trainingCategory = anyRow.__trainingCategory || "easy_run";
    const prescription = TRAINING_PRESCRIPTIONS[trainingCategory];
    const studyTargetHoursLow = anyRow.__studyTargetHoursLow ?? Math.max(0.5, goals.baselineStudyHours - 0.8);
    const studyTargetHoursHigh = anyRow.__studyTargetHoursHigh ?? goals.baselineStudyHours + 0.8;
    const studyTargetHours = round((studyTargetHoursLow + studyTargetHoursHigh) / 2, 2);

    const bedtimeMinutes = anyRow.__bedtimeMinutes ?? 21 * 60 + 30;
    const bedtimeHalfRange = anyRow.__bedtimeHalfRange ?? 20;
    const bedtimeRangeStart = bedtimeMinutes - bedtimeHalfRange;
    const bedtimeRangeEnd = bedtimeMinutes + bedtimeHalfRange;

    const readinessScore = clamp(anyRow.__readinessScore ?? 50, 0, 100);
    const sleepDriverMode = anyRow.__sleepDriverMode || "negative";
    const sleepDriverKey = anyRow.__sleepDriverKey || "duration";
    const sleepDriverImpact = anyRow.__sleepDriverImpact || 0;

    const readiness: DailyReadiness = {
      date: row.date,
      score: round(readinessScore, 1),
      zone: zoneForScore(readinessScore),
      confidence: round(row.confidenceOverall, 2),
      sleepScore: row.sleepScore,
      sleepDurationScore: row.sleepDurationScore,
      sleepRegularityScore: row.sleepRegularityScore,
      sleepStageScore: row.sleepStageScore,
      sleepAwakeScore: row.sleepAwakeScore,
      sleepScheduleScore: row.sleepTimingScore,
      sleepDriverMode,
      sleepDriverKey,
      sleepDriverImpact: round(sleepDriverImpact, 1),
      sleepDriverSentence: sentenceForDriver(sleepDriverMode, sleepDriverKey),
      sleepComponent: row.sleepScore,
      autonomicComponent: round(anyRow.__autonomicComponent ?? 50, 1),
      loadComponent: round(anyRow.__loadComponent ?? 50, 1),
      cognitiveComponent: round(anyRow.__cognitiveComponent ?? 50, 1),
      penalty: 0,
      sleepDebtHours: row.sleepDebtHours,
      sleepHours: row.sleepHours,
      loadRatio: row.physicalLoadRatio,
      zHrv: row.zLhrv,
      zRhr: row.zRhr,
      recoveryScore: row.recoveryScore,
      mentalRecoveryScore: row.mentalRecovery,
      physicalStrain: row.physicalStrain,
      mentalStrain: row.mentalStrain,
      physicalTargetLow: row.physicalTargetLow,
      physicalTargetHigh: row.physicalTargetHigh,
      mentalTargetLow: row.mentalTargetLow,
      mentalTargetHigh: row.mentalTargetHigh,
      pressure: row.pressure,
      confidenceSleep: row.confidenceSleep,
      confidenceRecovery: row.confidenceRecovery,
      confidencePhysical: row.confidencePhysical,
      confidenceMental: row.confidenceMentalRecovery,
    };

    const recommendation: DailyRecommendation = {
      date: row.date,
      studyTargetHours,
      trainingCategory,
      trainingLabel: prescription.label,
      runMinutesMin: prescription.runMinutesMin,
      runMinutesMax: prescription.runMinutesMax,
      walkMinutesMin: prescription.walkMinutesMin,
      walkMinutesMax: prescription.walkMinutesMax,
      targetRpeMin: prescription.targetRpeMin,
      targetRpeMax: prescription.targetRpeMax,
      trainingRationale: `Targets and recovery indicate ${prescription.label.toLowerCase()} is appropriate today (physical target ${row.physicalTargetLow.toFixed(1)}-${row.physicalTargetHigh.toFixed(1)} / 21).`,
      isRunRecommended: prescription.isRunRecommended,
      workoutType: prescription.isRunRecommended ? "cardio" : "recovery",
      workoutDurationMin: prescription.isRunRecommended ? prescription.runMinutesMax : 0,
      workoutSuggestion:
        anyRow.__workoutSuggestion ||
        (prescription.isRunRecommended
          ? `${prescription.label}: run ${prescription.runMinutesMin}-${prescription.runMinutesMax}m`
          : `Walk ${prescription.walkMinutesMin}-${prescription.walkMinutesMax}m`),
      bedtimeIso: toIsoOnDate(row.date, bedtimeMinutes),
      bedtimeLabel: formatClockLabel(bedtimeMinutes),
      bedtimeRangeStartIso: toIsoOnDate(row.date, bedtimeRangeStart),
      bedtimeRangeEndIso: toIsoOnDate(row.date, bedtimeRangeEnd),
      bedtimeRangeStartLabel: formatClockLabel(bedtimeRangeStart),
      bedtimeRangeEndLabel: formatClockLabel(bedtimeRangeEnd),
      bedtimeRangeLabel: `${formatClockLabel(bedtimeRangeStart)}-${formatClockLabel(bedtimeRangeEnd)}`,
      bedtimeRangeMinutes: bedtimeHalfRange * 2,
      studyTargetHoursLow,
      studyTargetHoursHigh,
      recommendedFreshAirMinutes: anyRow.__freshAirMinutes ?? 30,
      physicalTargetLow: row.physicalTargetLow,
      physicalTargetHigh: row.physicalTargetHigh,
      mentalTargetLow: row.mentalTargetLow,
      mentalTargetHigh: row.mentalTargetHigh,
      scientificSummary: row.narrative,
    };

    const scientific: ScientificDailyMetrics = {
      date: row.date,
      sleepNeedHours: row.sleepNeedHours,
      sleepHours: row.sleepHours,
      sleepScore: row.sleepScore,
      recoveryScore: row.recoveryScore,
      physicalStrain: row.physicalStrain,
      mentalRecovery: row.mentalRecovery,
      mentalStrain: row.mentalStrain,
      physicalRawLoad: row.physicalRawLoad,
      mentalRawLoad: row.mentalRawLoad,
      pressure: row.pressure,
      physicalAcuteLoad: row.physicalAcuteLoad,
      physicalChronicLoad: row.physicalChronicLoad,
      mentalAcuteLoad: row.mentalAcuteLoad,
      mentalChronicLoad: row.mentalChronicLoad,
      physicalLoadRatio: row.physicalLoadRatio,
      mentalLoadRatio: row.mentalLoadRatio,
      physicalCap: row.physicalCap,
      mentalCap: row.mentalCap,
      physicalTarget: {
        low: row.physicalTargetLow,
        center: row.physicalTargetCenter,
        high: row.physicalTargetHigh,
      },
      mentalTarget: {
        low: row.mentalTargetLow,
        center: row.mentalTargetCenter,
        high: row.mentalTargetHigh,
      },
      components: {
        sleepDuration: row.sleepDurationScore,
        sleepEfficiency: row.sleepEfficiencyScore,
        sleepRegularity: row.sleepRegularityScore,
        sleepTiming: row.sleepTimingScore,
        sleepStage: row.sleepStageScore,
        zLhrv: row.zLhrv,
        zRhr: row.zRhr,
        zRr: row.zRr,
        zSleep: row.zSleep,
        zApl: row.zApl,
        zAml: row.zAml,
        underload: row.underload,
        gate: row.gate,
        gUnder: row.gUnder,
        pressure: row.pressure,
      },
      confidence: {
        sleep: row.confidenceSleep,
        recovery: row.confidenceRecovery,
        physicalStrain: row.confidencePhysical,
        mentalRecovery: row.confidenceMentalRecovery,
        mentalStrain: row.confidenceMentalStrain,
        overall: row.confidenceOverall,
      },
      fallbackFlags: row.fallbackFlags,
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
