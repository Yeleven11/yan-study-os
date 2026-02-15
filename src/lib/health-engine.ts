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
  PerformanceGoals,
  SleepDriverKey,
  StudySession,
  TrainingCategory,
  WorkoutEntry,
} from "@/lib/types";

const A7 = 2 / (7 + 1);
const A28 = 2 / (28 + 1);
const SLEEP_SCORE_MIN_WITH_DATA = 30;
const DEBT_DECAY = 0.7;
const DEBT_PENALTY_PER_HOUR = 3.0;
const RECOVERY_WINDOW_DAYS = 3;
const RECOVERY_TARGET_TOLERANCE_HOURS = 0.25;
const RECOVERY_DEBT_MULTIPLIER = 0.35;

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

export type PerformanceInsights = {
  usingSampleData: boolean;
  goals: PerformanceGoals;
  healthDays: DailyHealthFact[];
  workouts: WorkoutEntry[];
  readinessByDate: Record<string, DailyReadiness>;
  recommendationsByDate: Record<string, DailyRecommendation>;
  todayReadiness: DailyReadiness;
  todayRecommendation: DailyRecommendation;
  weeklyWorkoutCount: number;
  weeklyWorkoutTarget: number;
  daysSinceWorkout: number;
  daysSinceRun: number;
  trendDelta7d: number;
};

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function parseClockToMinutes(timeValue: string, fallbackMinutes: number): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeValue.trim());
  if (!match) {
    return fallbackMinutes;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return fallbackMinutes;
  }

  return hours * 60 + minutes;
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

function stdDev(values: number[]): number {
  if (values.length <= 1) {
    return 0;
  }

  const avg = values.reduce((sum, current) => sum + current, 0) / values.length;
  const variance =
    values.reduce((sum, current) => sum + (current - avg) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}

function robustZ(value: number, baseline: number[]): number {
  if (baseline.length < 7) {
    return 0;
  }

  const med = median(baseline);
  const deviations = baseline.map((item) => Math.abs(item - med));
  const mad = median(deviations);

  if (mad < 1e-6) {
    return 0;
  }

  return (value - med) / (1.4826 * mad);
}

function shiftDate(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function buildDateWindow(endDateKey: string, totalDays: number): string[] {
  const result: string[] = [];

  for (let offset = totalDays - 1; offset >= 0; offset -= 1) {
    result.push(shiftDate(endDateKey, -offset));
  }

  return result;
}

function toIsoOnDate(dateKey: string, minutesFromMidnight: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  const safeMinutes = ((Math.floor(minutesFromMidnight) % 1440) + 1440) % 1440;
  date.setHours(0, 0, 0, 0);
  date.setMinutes(safeMinutes);
  return date.toISOString();
}

function formatClockLabel(minutesFromMidnight: number): string {
  const safeMinutes = ((Math.floor(minutesFromMidnight) % 1440) + 1440) % 1440;
  const hours = Math.floor(safeMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (safeMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
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

function stableNoise(seed: number): number {
  const raw = Math.sin(seed * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}

function createSampleHealthDataset(
  now: Date,
  goals: PerformanceGoals,
): {
  dailyHealth: DailyHealthFact[];
  workouts: WorkoutEntry[];
} {
  const todayKey = toDateKey(now);
  const dates = buildDateWindow(todayKey, 42);
  const dailyHealth: DailyHealthFact[] = [];
  const workouts: WorkoutEntry[] = [];

  for (let index = 0; index < dates.length; index += 1) {
    const dateKey = dates[index];
    const dayNoise = stableNoise(index + 17);
    const weeklyWave = Math.sin(index / 3.8);

    const sleepHours = clamp(
      goals.sleepHoursTarget - 0.5 + weeklyWave * 0.6 + (dayNoise - 0.5) * 0.7,
      6.2,
      9.8,
    );

    const hrvMs = clamp(57 + weeklyWave * 9 + (dayNoise - 0.5) * 7, 34, 89);
    const restingHrBpm = clamp(54 - weeklyWave * 3 + (dayNoise - 0.5) * 3, 47, 66);
    const sleepMidpointHour = clamp(3.2 + (dayNoise - 0.5) * 0.8, 1.8, 4.8);

    dailyHealth.push({
      date: dateKey,
      sleepHours: round(sleepHours, 2),
      hrvMs: round(hrvMs, 1),
      restingHrBpm: round(restingHrBpm, 1),
      sleepMidpointHour: round(sleepMidpointHour, 2),
      steps: Math.round(7600 + weeklyWave * 1700 + dayNoise * 1400),
      source: "sample",
      createdAt: now.toISOString(),
    });

    if (index % 2 === 0) {
      const durationMin = Math.round(35 + dayNoise * 20);
      const distanceKm = round(6 + dayNoise * 5, 2);
      const avgHeartRate = Math.round(138 + dayNoise * 20);
      const startMinutes = 17 * 60 + 20;
      workouts.push({
        id: `sample-run-${dateKey}-${index}`,
        type: "cardio",
        workoutNameRaw: "Outdoor Run",
        workoutDisplayLabel: `${distanceKm.toFixed(1)} km Outdoor Run`,
        startedAt: toIsoOnDate(dateKey, startMinutes),
        endedAt: toIsoOnDate(dateKey, startMinutes + durationMin),
        durationMin,
        distanceKm,
        avgHeartRate,
        hrAvg: avgHeartRate,
        activeKcal: Math.round(280 + dayNoise * 200),
        source: "sample",
        createdAt: now.toISOString(),
      });
    } else {
      const durationMin = Math.round(30 + dayNoise * 25);
      const distanceKm = round(2.5 + dayNoise * 2.5, 2);
      const startMinutes = 18 * 60 + 10;
      workouts.push({
        id: `sample-walk-${dateKey}-${index}`,
        type: "recovery",
        workoutNameRaw: "Outdoor Walk",
        workoutDisplayLabel: `${distanceKm.toFixed(1)} km Outdoor Walk`,
        startedAt: toIsoOnDate(dateKey, startMinutes),
        endedAt: toIsoOnDate(dateKey, startMinutes + durationMin),
        durationMin,
        distanceKm,
        avgHeartRate: Math.round(96 + dayNoise * 12),
        source: "sample",
        createdAt: now.toISOString(),
      });
    }
  }

  return {
    dailyHealth,
    workouts,
  };
}

function getSessionHoursByDate(studySessions: StudySession[]): Map<string, number> {
  const result = new Map<string, number>();

  for (const session of studySessions) {
    const dateKey = toDateKey(session.startedAt);
    const previous = result.get(dateKey) || 0;
    result.set(dateKey, previous + session.durationSec / 3600);
  }

  return result;
}

function getLateSessionCountByDate(studySessions: StudySession[]): Map<string, number> {
  const result = new Map<string, number>();

  for (const session of studySessions) {
    const ended = new Date(session.endedAt);
    const endedMinutes = ended.getHours() * 60 + ended.getMinutes();
    if (endedMinutes <= 22 * 60 + 30) {
      continue;
    }

    const dateKey = toDateKey(session.endedAt);
    const previous = result.get(dateKey) || 0;
    result.set(dateKey, previous + 1);
  }

  return result;
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

function isWalkSession(workout: WorkoutEntry): boolean {
  const label = `${workout.workoutNameRaw || ""} ${workout.workoutDisplayLabel || ""}`.toLowerCase();
  return workout.type === "recovery" || label.includes("walk");
}

function isRunSession(workout: WorkoutEntry): boolean {
  return workout.type === "cardio" && !isWalkSession(workout);
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

function getRunLoadByDate(workouts: WorkoutEntry[]): Map<string, number> {
  const result = new Map<string, number>();

  for (const workout of workouts) {
    if (!isRunSession(workout)) {
      continue;
    }

    const effectiveDifficulty =
      typeof workout.difficultyEffective === "number" && Number.isFinite(workout.difficultyEffective)
        ? workout.difficultyEffective
        : typeof workout.difficultyAuto === "number" && Number.isFinite(workout.difficultyAuto)
        ? workout.difficultyAuto
        : 5;

    const sessionLoad = round(Math.max(0, workout.durationMin) * effectiveDifficulty, 2);
    const dateKey = toDateKey(workout.startedAt);
    result.set(dateKey, round((result.get(dateKey) || 0) + sessionLoad, 2));
  }

  return result;
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

function computeDaysSinceRun(dateKey: string, workoutsByDate: Map<string, WorkoutEntry[]>): number {
  for (let daysBack = 0; daysBack <= 60; daysBack += 1) {
    const candidate = shiftDate(dateKey, -daysBack);
    const dayWorkouts = workoutsByDate.get(candidate) || [];
    if (dayWorkouts.some((workout) => isRunSession(workout))) {
      return daysBack;
    }
  }

  return 61;
}

function capTrainingCategory(
  category: TrainingCategory,
  maxCategory: TrainingCategory,
): TrainingCategory {
  return TRAINING_CATEGORY_RANK[category] <= TRAINING_CATEGORY_RANK[maxCategory]
    ? category
    : maxCategory;
}

function pickTrainingCategory({
  readinessScore,
  sleepScore,
  sleepHours,
  runLoadRatio,
  daysSinceRun,
}: {
  readinessScore: number;
  sleepScore: number;
  sleepHours: number;
  runLoadRatio: number;
  daysSinceRun: number;
}): TrainingCategory {
  let category: TrainingCategory;

  if (readinessScore < 45 || sleepScore < 52 || sleepHours < 6.5 || runLoadRatio > 1.35) {
    category = "rest_walk";
  } else if (readinessScore < 60 || sleepScore < 60 || runLoadRatio > 1.2) {
    category = "recovery";
  } else if (readinessScore < 72 || sleepHours < 7.2 || runLoadRatio > 1.05) {
    category = "easy_run";
  } else if (readinessScore < 85 || runLoadRatio > 0.9) {
    category = "steady_run";
  } else {
    category = "quality_run";
  }

  if (daysSinceRun >= 14) {
    if (readinessScore >= 82 && sleepScore >= 75 && runLoadRatio < 0.95) {
      category = capTrainingCategory(category, "easy_run");
    } else {
      category = capTrainingCategory(category, "recovery");
    }
  } else if (daysSinceRun >= 7) {
    category = capTrainingCategory(category, "easy_run");
  }

  return category;
}

function buildTrainingRationale({
  category,
  sleepScore,
  sleepHours,
  runLoadRatio,
  daysSinceRun,
}: {
  category: TrainingCategory;
  sleepScore: number;
  sleepHours: number;
  runLoadRatio: number;
  daysSinceRun: number;
}): string {
  const reasons: string[] = [];

  if (daysSinceRun >= 14) {
    reasons.push("long running gap detected, so ramp-up is intentionally conservative");
  } else if (daysSinceRun >= 7) {
    reasons.push("recent running gap suggests a cautious re-entry");
  }

  if (sleepScore < 60 || sleepHours < 7) {
    reasons.push("sleep signal is not ideal for high intensity");
  }

  if (runLoadRatio > 1.2) {
    reasons.push("recent run load is elevated versus baseline");
  } else if (runLoadRatio < 0.8 && category !== "rest_walk") {
    reasons.push("run load is controlled, allowing productive training");
  }

  if (reasons.length === 0) {
    reasons.push("readiness and run-load balance support this training dose");
  }

  return reasons.join("; ") + ".";
}

function toWorkoutSuggestion(prescription: TrainingPrescription): string {
  if (!prescription.isRunRecommended) {
    return `Rest from running. Walk ${prescription.walkMinutesMin}-${prescription.walkMinutesMax}m outdoors at RPE ${prescription.targetRpeMin}-${prescription.targetRpeMax}.`;
  }

  return `${prescription.label}: run ${prescription.runMinutesMin}-${prescription.runMinutesMax}m at RPE ${prescription.targetRpeMin}-${prescription.targetRpeMax}, plus ${prescription.walkMinutesMin}-${prescription.walkMinutesMax}m walking.`;
}

export function buildPerformanceInsights(data: AppData, now = new Date()): PerformanceInsights {
  const goals = normalizeGoals(data.goals);
  const usingSampleData = data.dailyHealth.length === 0 && data.workouts.length === 0;
  const sampled = usingSampleData ? createSampleHealthDataset(now, goals) : null;

  const healthDays = (usingSampleData ? sampled?.dailyHealth || [] : data.dailyHealth)
    .slice()
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

  const baseWorkouts = (usingSampleData ? sampled?.workouts || [] : data.workouts)
    .slice()
    .sort(
      (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
    );

  const todayKey = toDateKey(now);
  const dateWindow = buildDateWindow(todayKey, 45);

  const healthByDate = new Map<string, DailyHealthFact>();
  for (const item of healthDays) {
    healthByDate.set(item.date, item);
  }

  const restingHrByDate = new Map<string, number | undefined>();
  for (const dateKey of dateWindow) {
    restingHrByDate.set(dateKey, healthByDate.get(dateKey)?.restingHrBpm);
  }

  const workouts = baseWorkouts.map((workout) => {
    const dateKey = toDateKey(workout.startedAt);
    const restingHr = restingHrByDate.get(dateKey) ?? 55;
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
  for (const workout of workouts) {
    const dateKey = toDateKey(workout.startedAt);
    if (!workoutsByDate.has(dateKey)) {
      workoutsByDate.set(dateKey, []);
    }
    workoutsByDate.get(dateKey)!.push(workout);
  }

  const runLoadByDate = getRunLoadByDate(workouts);
  const studyHoursByDate = getSessionHoursByDate(data.studySessions);
  const lateSessionsByDate = getLateSessionCountByDate(data.studySessions);

  const readinessByDate: Record<string, DailyReadiness> = {};
  const recommendationsByDate: Record<string, DailyRecommendation> = {};

  let atl = 0;
  let ctl = 0;
  let debt = 0;
  let cognitiveEwma = 0;

  const hrvHistory: number[] = [];
  const rhrHistory: number[] = [];
  const midpointHistory: number[] = [];
  const sleepHistory: Array<{ hours: number; missing: boolean }> = [];

  for (let index = 0; index < dateWindow.length; index += 1) {
    const dateKey = dateWindow[index];
    const health = healthByDate.get(dateKey);

    const missingSleep = !health || typeof health.sleepHours !== "number";
    const sleepHours = missingSleep
      ? goals.sleepHoursTarget * 0.88
      : clamp(health.sleepHours, 3.5, 12);

    const midpoint =
      typeof health?.sleepMidpointHour === "number"
        ? health.sleepMidpointHour
        : clamp(3.0 + (goals.sleepHoursTarget - sleepHours) * 0.2, 1.5, 5.5);

    midpointHistory.push(midpoint);
    const midpointTail = midpointHistory.slice(-7);
    const midpointSd7 = stdDev(midpointTail);

    const deficit = missingSleep ? 0 : goals.sleepHoursTarget - sleepHours;
    debt = Math.max(0, debt * DEBT_DECAY + deficit);
    sleepHistory.push({ hours: sleepHours, missing: missingSleep });

    const recentSleepWindow = sleepHistory.slice(-RECOVERY_WINDOW_DAYS);
    const hitRecoveryWindow =
      recentSleepWindow.length === RECOVERY_WINDOW_DAYS &&
      recentSleepWindow.every(
        (entry) =>
          !entry.missing &&
          entry.hours >= goals.sleepHoursTarget - RECOVERY_TARGET_TOLERANCE_HOURS,
      );

    if (hitRecoveryWindow) {
      debt *= RECOVERY_DEBT_MULTIPLIER;
    }

    const regularityScore = clamp(100 - 18 * midpointSd7, 40, 100);
    const sufficiency = clamp(sleepHours / goals.sleepHoursTarget, 0, 1.15);
    const durationScore = clamp(100 * sufficiency, 0, 100);
    const stageTotal =
      (health?.sleepCoreHours || 0) +
      (health?.sleepDeepHours || 0) +
      (health?.sleepRemHours || 0) +
      (health?.sleepAwakeHours || 0);
    const deepRatio =
      stageTotal > 0 && typeof health?.sleepDeepHours === "number"
        ? health.sleepDeepHours / stageTotal
        : null;
    const remRatio =
      stageTotal > 0 && typeof health?.sleepRemHours === "number"
        ? health.sleepRemHours / stageTotal
        : null;
    const awakeRatio =
      stageTotal > 0 && typeof health?.sleepAwakeHours === "number"
        ? health.sleepAwakeHours / stageTotal
        : null;
    const stageScore =
      deepRatio !== null && remRatio !== null
        ? clamp(100 - Math.abs(deepRatio - 0.18) * 280 - Math.abs(remRatio - 0.23) * 220, 40, 100)
        : 68;
    const awakeScore = awakeRatio !== null ? clamp(100 - awakeRatio * 220, 30, 100) : 72;
    const hasScheduleSignal = typeof health?.sleepMidpointHour === "number";
    const sleepScheduleScore = hasScheduleSignal
      ? clamp(100 - Math.abs(midpoint - 3.1) * 14 - midpointSd7 * 8, 40, 100)
      : 0;
    const durationWeight = hasScheduleSignal ? 0.3 : 0.4;
    const regularityWeight = hasScheduleSignal ? 0.2 : 0.25;
    const stageWeight = hasScheduleSignal ? 0.2 : 0.25;
    const awakeWeight = 0.1;
    const scheduleWeight = hasScheduleSignal ? 0.2 : 0;

    const sleepScoreRaw =
      durationWeight * durationScore +
      regularityWeight * regularityScore +
      stageWeight * stageScore +
      awakeWeight * awakeScore +
      scheduleWeight * sleepScheduleScore;
    const debtPenalty = DEBT_PENALTY_PER_HOUR * debt;
    const sleepScore = missingSleep
      ? 0
      : clamp(sleepScoreRaw - debtPenalty, SLEEP_SCORE_MIN_WITH_DATA, 100);
    const sleepComponent = missingSleep ? 50 : sleepScore;

    const sleepNegativeDrivers: Array<{ key: SleepDriverKey; impact: number }> = [
      { key: "debt", impact: debtPenalty },
      { key: "duration", impact: (100 - durationScore) * durationWeight },
      { key: "regularity", impact: (100 - regularityScore) * regularityWeight },
      { key: "stage", impact: (100 - stageScore) * stageWeight },
      { key: "awake", impact: (100 - awakeScore) * awakeWeight },
      {
        key: "schedule",
        impact: hasScheduleSignal ? (100 - sleepScheduleScore) * scheduleWeight : 0,
      },
    ];

    const sleepPositiveDrivers: Array<{ key: SleepDriverKey; impact: number }> = [
      { key: "duration", impact: durationScore * durationWeight },
      { key: "regularity", impact: regularityScore * regularityWeight },
      { key: "stage", impact: stageScore * stageWeight },
      { key: "awake", impact: awakeScore * awakeWeight },
      { key: "schedule", impact: hasScheduleSignal ? sleepScheduleScore * scheduleWeight : 0 },
    ];

    let sleepDriverMode: "negative" | "positive" = sleepScore < 65 ? "negative" : "positive";
    let sleepDriverKey: SleepDriverKey = "duration";
    let sleepDriverImpact = 0;
    let sleepDriverSentence = sentenceForDriver(sleepDriverMode, sleepDriverKey);

    if (missingSleep) {
      sleepDriverMode = "negative";
      sleepDriverKey = "duration";
      sleepDriverImpact = 0;
      sleepDriverSentence = "No sleep data available for this day; import needed for scoring.";
    } else {
      const dominantSleepDriver =
        sleepDriverMode === "negative"
          ? sleepNegativeDrivers.slice().sort((left, right) => right.impact - left.impact)[0]
          : sleepPositiveDrivers.slice().sort((left, right) => right.impact - left.impact)[0];

      sleepDriverKey = dominantSleepDriver?.key || "duration";
      sleepDriverImpact = dominantSleepDriver?.impact || 0;
      sleepDriverSentence = sentenceForDriver(sleepDriverMode, sleepDriverKey);
    }

    let zHrv = 0;
    let zRhr = 0;
    let autonomicComponent = 50;

    const hasHrvSignal = typeof health?.hrvMs === "number" && health.hrvMs > 0;
    const hasRhrSignal = typeof health?.restingHrBpm === "number" && health.restingHrBpm > 0;

    if (hasHrvSignal) {
      zHrv = robustZ(Math.log(health!.hrvMs as number), hrvHistory.slice(-28));
      hrvHistory.push(Math.log(health!.hrvMs as number));
    }

    if (hasRhrSignal) {
      zRhr = -robustZ(health!.restingHrBpm as number, rhrHistory.slice(-28));
      rhrHistory.push(health!.restingHrBpm as number);
    }

    autonomicComponent = clamp(50 + 18 * zHrv + 12 * zRhr, 0, 100);

    const dailyLoad = runLoadByDate.get(dateKey) || 0;
    atl = A7 * dailyLoad + (1 - A7) * atl;
    ctl = A28 * dailyLoad + (1 - A28) * ctl;

    const runLoadRatio = atl / Math.max(ctl, 1);
    const loadComponent = clamp(
      100 - 80 * Math.max(0, runLoadRatio - 1.15) - 25 * Math.max(0, 0.75 - runLoadRatio),
      0,
      100,
    );

    const studyHours = studyHoursByDate.get(dateKey) || 0;
    const studyRatio = studyHours / Math.max(goals.baselineStudyHours, 0.1);
    cognitiveEwma = A7 * studyRatio + (1 - A7) * cognitiveEwma;

    const lateStudyCount3 =
      (lateSessionsByDate.get(dateKey) || 0) +
      (lateSessionsByDate.get(shiftDate(dateKey, -1)) || 0) +
      (lateSessionsByDate.get(shiftDate(dateKey, -2)) || 0);

    const cognitiveComponent = clamp(
      100 - 30 * Math.max(0, cognitiveEwma - 1.2) - 8 * lateStudyCount3,
      50,
      100,
    );

    let penalty = 0;
    if (sleepHours < 7.5) {
      penalty += 12;
    }

    if (zHrv < -1.0 && zRhr < -0.5) {
      penalty += 10;
    }

    if (runLoadRatio > 1.3) {
      penalty += 8;
    }

    const readinessRaw =
      0.45 * sleepComponent +
      0.3 * autonomicComponent +
      0.15 * loadComponent +
      0.1 * cognitiveComponent;

    const readinessScore = clamp(readinessRaw - penalty, 0, 100);

    const hasSleepStages = stageTotal > 0;
    const hasWorkoutSignal = (workoutsByDate.get(dateKey) || []).length > 0;
    const historicalDepth = clamp(index / 28, 0, 1);

    const confidenceCompleteness =
      (missingSleep ? 0 : 1) * 0.22 +
      (hasSleepStages ? 1 : 0) * 0.12 +
      (hasScheduleSignal ? 1 : 0) * 0.1 +
      (hasHrvSignal ? 1 : 0) * 0.2 +
      (hasRhrSignal ? 1 : 0) * 0.2 +
      (hasWorkoutSignal ? 1 : 0) * 0.06 +
      historicalDepth * 0.1;

    const readinessConfidence = round(clamp(0.35 + 0.65 * confidenceCompleteness, 0.35, 0.99), 2);

    const readiness: DailyReadiness = {
      date: dateKey,
      score: round(readinessScore, 1),
      zone: zoneForScore(readinessScore),
      confidence: readinessConfidence,
      sleepScore: round(sleepScore, 1),
      sleepDurationScore: round(durationScore, 1),
      sleepRegularityScore: round(regularityScore, 1),
      sleepStageScore: round(stageScore, 1),
      sleepAwakeScore: round(awakeScore, 1),
      sleepScheduleScore: round(sleepScheduleScore || regularityScore, 1),
      sleepDriverMode,
      sleepDriverKey,
      sleepDriverImpact: round(sleepDriverImpact, 1),
      sleepDriverSentence,
      sleepComponent: round(sleepComponent, 1),
      autonomicComponent: round(autonomicComponent, 1),
      loadComponent: round(loadComponent, 1),
      cognitiveComponent: round(cognitiveComponent, 1),
      penalty: round(penalty, 1),
      sleepDebtHours: round(debt, 2),
      sleepHours: round(sleepHours, 2),
      loadRatio: round(runLoadRatio, 2),
      zHrv: round(zHrv, 2),
      zRhr: round(zRhr, 2),
    };

    const dateStart = new Date(`${dateKey}T00:00:00`).getTime();
    const nextExamMs = data.exams
      .map((exam) => new Date(exam.startsAt).getTime())
      .filter((value) => value >= dateStart)
      .sort((left, right) => left - right)[0];

    const daysToNextExam = nextExamMs
      ? Math.max(0, Math.floor((nextExamMs - dateStart) / 86_400_000))
      : 60;

    const activeTodos = data.todos.filter((todo) => !todo.archived);
    const urgentTodos = activeTodos.filter((todo) => {
      const deadlineMs = new Date(todo.deadline).getTime();
      return deadlineMs >= dateStart && deadlineMs <= dateStart + 3 * 86_400_000;
    });

    const urgentRatio = urgentTodos.length / Math.max(activeTodos.length, 1);

    const examPressure = clamp(
      1 + 0.35 * Math.exp(-daysToNextExam / 21) + 0.1 * urgentRatio,
      1,
      1.55,
    );

    let readinessFactor = 0.55 + 0.007 * readiness.score;
    if (readiness.score < 45 || sleepHours < 7.5) {
      readinessFactor = Math.min(readinessFactor, 0.85);
    }

    const studyTargetHours = clamp(
      goals.baselineStudyHours * examPressure * readinessFactor,
      2,
      6,
    );

    let debt7 = 0;
    for (let i = 0; i < 7; i += 1) {
      const sleepEntry = sleepHistory[sleepHistory.length - 1 - i];
      if (!sleepEntry || sleepEntry.missing) {
        continue;
      }

      const debtDeficit = Math.max(0, goals.sleepHoursTarget - sleepEntry.hours);
      debt7 += debtDeficit * DEBT_DECAY ** i;
    }

    const preferredBedtimeStartMinutes = parseClockToMinutes(goals.preferredBedtimeStart, 21 * 60);
    const preferredBedtimeEndMinutes = parseClockToMinutes(goals.preferredBedtimeEnd, 22 * 60);
    const preferredBedtimeCenterMinutes = windowCenterMinutes(
      preferredBedtimeStartMinutes,
      preferredBedtimeEndMinutes,
    );

    let bedtimeMinutes = preferredBedtimeCenterMinutes;
    bedtimeMinutes -= clamp(debt7, 0, 2.5) * 10;
    bedtimeMinutes -= clamp((70 - readiness.score) / 30, 0, 1) * 12;
    bedtimeMinutes += clamp((readiness.score - 82) / 18, 0, 1) * 8;
    if (midpointSd7 > 1) {
      bedtimeMinutes -= 8;
    }

    const readinessPressure = clamp((70 - readiness.score) / 40, 0, 1);
    const debtPressure = clamp(debt7 / 2, 0, 1);
    const regularityPressure = clamp(midpointSd7 / 1.4, 0, 1);
    const stressIndex =
      0.5 * readinessPressure + 0.3 * debtPressure + 0.2 * regularityPressure;
    const bedtimeHalfRangeMinutes = Math.round(10 + stressIndex * 10);
    const bedtimeRangeStartMinutes = bedtimeMinutes - bedtimeHalfRangeMinutes;
    const bedtimeRangeEndMinutes = bedtimeMinutes + bedtimeHalfRangeMinutes;
    const bedtimeRangeWidthMinutes = bedtimeHalfRangeMinutes * 2;

    const daysSinceRun = computeDaysSinceRun(dateKey, workoutsByDate);
    const trainingCategory = pickTrainingCategory({
      readinessScore: readiness.score,
      sleepScore,
      sleepHours,
      runLoadRatio,
      daysSinceRun,
    });
    const prescription = TRAINING_PRESCRIPTIONS[trainingCategory];
    const trainingRationale = buildTrainingRationale({
      category: trainingCategory,
      sleepScore,
      sleepHours,
      runLoadRatio,
      daysSinceRun,
    });

    const recommendation: DailyRecommendation = {
      date: dateKey,
      studyTargetHours: round(studyTargetHours, 2),
      trainingCategory,
      trainingLabel: prescription.label,
      runMinutesMin: prescription.runMinutesMin,
      runMinutesMax: prescription.runMinutesMax,
      walkMinutesMin: prescription.walkMinutesMin,
      walkMinutesMax: prescription.walkMinutesMax,
      targetRpeMin: prescription.targetRpeMin,
      targetRpeMax: prescription.targetRpeMax,
      trainingRationale,
      isRunRecommended: prescription.isRunRecommended,
      workoutType: prescription.isRunRecommended ? "cardio" : "recovery",
      workoutDurationMin: prescription.isRunRecommended ? prescription.runMinutesMax : 0,
      workoutSuggestion: toWorkoutSuggestion(prescription),
      bedtimeIso: toIsoOnDate(dateKey, bedtimeMinutes),
      bedtimeLabel: formatClockLabel(bedtimeMinutes),
      bedtimeRangeStartIso: toIsoOnDate(dateKey, bedtimeRangeStartMinutes),
      bedtimeRangeEndIso: toIsoOnDate(dateKey, bedtimeRangeEndMinutes),
      bedtimeRangeStartLabel: formatClockLabel(bedtimeRangeStartMinutes),
      bedtimeRangeEndLabel: formatClockLabel(bedtimeRangeEndMinutes),
      bedtimeRangeLabel: `${formatClockLabel(bedtimeRangeStartMinutes)}-${formatClockLabel(
        bedtimeRangeEndMinutes,
      )}`,
      bedtimeRangeMinutes: bedtimeRangeWidthMinutes,
    };

    readinessByDate[dateKey] = readiness;
    recommendationsByDate[dateKey] = recommendation;
  }

  const todayReadiness = readinessByDate[todayKey] || {
    date: todayKey,
    score: 50,
    zone: "yellow" as const,
    confidence: 0.5,
    sleepScore: 50,
    sleepDurationScore: 50,
    sleepRegularityScore: 50,
    sleepStageScore: 50,
    sleepAwakeScore: 50,
    sleepScheduleScore: 50,
    sleepDriverMode: "negative" as const,
    sleepDriverKey: "duration" as const,
    sleepDriverImpact: 0,
    sleepDriverSentence: "Your score is mainly held down by sleep duration falling short of your target.",
    sleepComponent: 50,
    autonomicComponent: 50,
    loadComponent: 50,
    cognitiveComponent: 70,
    penalty: 0,
    sleepDebtHours: 0,
    sleepHours: goals.sleepHoursTarget,
    loadRatio: 1,
    zHrv: 0,
    zRhr: 0,
  };

  const todayRecommendation = recommendationsByDate[todayKey] || {
    date: todayKey,
    studyTargetHours: goals.baselineStudyHours,
    trainingCategory: "easy_run" as const,
    trainingLabel: "Easy Run",
    runMinutesMin: 35,
    runMinutesMax: 50,
    walkMinutesMin: 15,
    walkMinutesMax: 25,
    targetRpeMin: 4,
    targetRpeMax: 5,
    trainingRationale: "Default recommendation used because recent readiness data is limited.",
    isRunRecommended: true,
    workoutType: "cardio" as const,
    workoutDurationMin: 50,
    workoutSuggestion: "Easy Run: run 35-50m at RPE 4-5, plus 15-25m walking.",
    bedtimeIso: toIsoOnDate(todayKey, 21 * 60 + 30),
    bedtimeLabel: "21:30",
    bedtimeRangeStartIso: toIsoOnDate(todayKey, 21 * 60 + 10),
    bedtimeRangeEndIso: toIsoOnDate(todayKey, 21 * 60 + 50),
    bedtimeRangeStartLabel: "21:10",
    bedtimeRangeEndLabel: "21:50",
    bedtimeRangeLabel: "21:10-21:50",
    bedtimeRangeMinutes: 40,
  };

  const thisWeekStart = getWeekStartDate(todayKey);
  const weeklyWorkoutCount = workouts.filter((workout) => {
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
    workouts,
    readinessByDate,
    recommendationsByDate,
    todayReadiness,
    todayRecommendation,
    weeklyWorkoutCount,
    weeklyWorkoutTarget: goals.weeklyWorkoutTarget,
    daysSinceWorkout: daysSinceRun,
    daysSinceRun,
    trendDelta7d: round(avgRecent7 - avgPrevious7, 1),
  };
}
