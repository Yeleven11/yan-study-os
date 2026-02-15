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
  StudySession,
  WorkoutEntry,
  WorkoutType,
} from "@/lib/types";

const A7 = 2 / (7 + 1);
const A28 = 2 / (28 + 1);

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
  trendDelta7d: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function parseWakeTimeToMinutes(timeValue: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeValue.trim());
  if (!match) {
    return 6 * 60 + 30;
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
    return 6 * 60 + 30;
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

function isWeekendDate(dateKey: string): boolean {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay();
  return day === 0 || day === 6;
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
      goals.sleepHoursTarget - 0.8 + weeklyWave * 0.7 + (dayNoise - 0.5) * 0.8,
      6.4,
      9.8,
    );

    const hrvMs = clamp(57 + weeklyWave * 10 + (dayNoise - 0.5) * 8, 34, 89);
    const restingHrBpm = clamp(54 - weeklyWave * 3 + (dayNoise - 0.5) * 3, 47, 66);
    const sleepMidpointHour = clamp(3.2 + (dayNoise - 0.5) * 0.9, 1.8, 4.8);

    dailyHealth.push({
      date: dateKey,
      sleepHours: round(sleepHours, 2),
      hrvMs: round(hrvMs, 1),
      restingHrBpm: round(restingHrBpm, 1),
      sleepMidpointHour: round(sleepMidpointHour, 2),
      steps: Math.round(7800 + weeklyWave * 1900 + dayNoise * 1600),
      source: "sample",
      createdAt: now.toISOString(),
    });

    // Sample pattern: 4 workout sessions per week average.
    if (index % 2 === 0 || (index + 1) % 7 === 0) {
      const type: WorkoutType =
        index % 6 === 0 ? "strength" : index % 5 === 0 ? "mobility" : "cardio";
      const durationMin =
        type === "strength" ? 40 : type === "mobility" ? 28 : Math.round(35 + dayNoise * 18);
      const startMinutes = type === "cardio" ? 17 * 60 + 30 : 18 * 60 + 15;

      workouts.push({
        id: `sample-${dateKey}-${index}`,
        type,
        startedAt: toIsoOnDate(dateKey, startMinutes),
        endedAt: toIsoOnDate(dateKey, startMinutes + durationMin),
        durationMin,
        avgHeartRate: type === "mobility" ? 98 : Math.round(132 + dayNoise * 24),
        activeKcal: type === "mobility" ? 150 : Math.round(280 + dayNoise * 210),
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

function getDailyWorkoutLoad(
  workouts: WorkoutEntry[],
  goals: PerformanceGoals,
  restingHrByDate: Map<string, number | undefined>,
): Map<string, number> {
  const result = new Map<string, number>();
  const defaultRhr = 55;

  for (const workout of workouts) {
    const dateKey = toDateKey(workout.startedAt);
    const rhr = restingHrByDate.get(dateKey) ?? defaultRhr;
    const hrMax = 208 - 0.7 * goals.ageYears;
    const activeKcal =
      workout.activeKcal ??
      (typeof workout.activeEnergyKj === "number" ? workout.activeEnergyKj / 4.184 : 0);
    const distanceBonus = (workout.distanceKm || 0) * 2.5;
    const intensityBonus = (workout.intensityKcalHrKg || 0) * 0.4;

    let load = 0;
    if (typeof workout.avgHeartRate === "number" && hrMax - rhr > 1) {
      const hrr = clamp((workout.avgHeartRate - rhr) / (hrMax - rhr), 0, 1);
      load = workout.durationMin * hrr * Math.exp(1.67 * hrr) + distanceBonus + intensityBonus;
    } else {
      load = 0.2 * workout.durationMin + 0.05 * activeKcal + distanceBonus + intensityBonus;
    }

    result.set(dateKey, (result.get(dateKey) || 0) + load);
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

function computeDaysSinceWorkout(dateKey: string, workoutsByDate: Map<string, WorkoutEntry[]>): number {
  for (let daysBack = 0; daysBack <= 30; daysBack += 1) {
    const candidate = shiftDate(dateKey, -daysBack);
    if ((workoutsByDate.get(candidate) || []).length > 0) {
      return daysBack;
    }
  }

  return 31;
}

function chooseWorkoutType(
  workoutsThisWeek: WorkoutEntry[],
  weeklyTarget: number,
): WorkoutType {
  const cardioCount = workoutsThisWeek.filter((workout) => workout.type === "cardio").length;
  const strengthMobilityCount = workoutsThisWeek.filter(
    (workout) => workout.type === "strength" || workout.type === "mobility",
  ).length;

  const cardioTarget = Math.ceil(weeklyTarget / 2);
  const strengthTarget = weeklyTarget - cardioTarget;

  const cardioDeficit = cardioTarget - cardioCount;
  const strengthDeficit = strengthTarget - strengthMobilityCount;

  if (strengthDeficit > cardioDeficit) {
    return "strength";
  }

  if (cardioDeficit > strengthDeficit) {
    return "cardio";
  }

  const latestWorkout = workoutsThisWeek
    .slice()
    .sort(
      (left, right) =>
        new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
    )[0];

  if (!latestWorkout) {
    return "cardio";
  }

  return latestWorkout.type === "cardio" ? "strength" : "cardio";
}

export function buildPerformanceInsights(data: AppData, now = new Date()): PerformanceInsights {
  const goals = normalizeGoals(data.goals);
  const usingSampleData = data.dailyHealth.length === 0 && data.workouts.length === 0;
  const sampled = usingSampleData ? createSampleHealthDataset(now, goals) : null;

  const healthDays = (usingSampleData ? sampled?.dailyHealth || [] : data.dailyHealth)
    .slice()
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

  const workouts = (usingSampleData ? sampled?.workouts || [] : data.workouts)
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

  const workoutsByDate = new Map<string, WorkoutEntry[]>();
  for (const workout of workouts) {
    const dateKey = toDateKey(workout.startedAt);
    if (!workoutsByDate.has(dateKey)) {
      workoutsByDate.set(dateKey, []);
    }
    workoutsByDate.get(dateKey)!.push(workout);
  }

  const restingHrByDate = new Map<string, number | undefined>();
  for (const dateKey of dateWindow) {
    restingHrByDate.set(dateKey, healthByDate.get(dateKey)?.restingHrBpm);
  }

  const workoutLoadByDate = getDailyWorkoutLoad(workouts, goals, restingHrByDate);
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
  const sleepHistory: number[] = [];

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

    debt = Math.max(0, debt * 0.85 + (goals.sleepHoursTarget - sleepHours));
    sleepHistory.push(sleepHours);

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
    const sleepScoreRaw = hasScheduleSignal
      ? 0.3 * durationScore +
        0.2 * regularityScore +
        0.2 * stageScore +
        0.1 * awakeScore +
        0.2 * sleepScheduleScore
      : 0.4 * durationScore + 0.25 * regularityScore + 0.25 * stageScore + 0.1 * awakeScore;
    const sleepScore = clamp(sleepScoreRaw - 5 * debt, 0, 100);
    const sleepComponent = sleepScore;

    let zHrv = 0;
    let zRhr = 0;
    let autonomicComponent = 50;
    let confidence = 1;

    if (typeof health?.hrvMs === "number" && health.hrvMs > 0) {
      zHrv = robustZ(Math.log(health.hrvMs), hrvHistory.slice(-28));
      hrvHistory.push(Math.log(health.hrvMs));
    } else {
      confidence -= 0.2;
    }

    if (typeof health?.restingHrBpm === "number" && health.restingHrBpm > 0) {
      zRhr = -robustZ(health.restingHrBpm, rhrHistory.slice(-28));
      rhrHistory.push(health.restingHrBpm);
    } else {
      confidence -= 0.2;
    }

    autonomicComponent = clamp(50 + 18 * zHrv + 12 * zRhr, 0, 100);

    const dailyLoad = workoutLoadByDate.get(dateKey) || 0;
    atl = A7 * dailyLoad + (1 - A7) * atl;
    ctl = A28 * dailyLoad + (1 - A28) * ctl;

    const loadRatio = atl / Math.max(ctl, 1);
    const loadComponent = clamp(
      100 - 80 * Math.max(0, loadRatio - 1.15) - 25 * Math.max(0, 0.75 - loadRatio),
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

    if (loadRatio > 1.3) {
      penalty += 8;
    }

    const readinessRaw =
      0.45 * sleepComponent +
      0.3 * autonomicComponent +
      0.15 * loadComponent +
      0.1 * cognitiveComponent;

    const readinessScore = clamp(readinessRaw - penalty, 0, 100);

    if (missingSleep) {
      confidence -= 0.25;
    }

    const readiness: DailyReadiness = {
      date: dateKey,
      score: round(readinessScore, 1),
      zone: zoneForScore(readinessScore),
      confidence: round(clamp(confidence, 0.35, 1), 2),
      sleepScore: round(sleepScore, 1),
      sleepDurationScore: round(durationScore, 1),
      sleepRegularityScore: round(regularityScore, 1),
      sleepStageScore: round(stageScore, 1),
      sleepAwakeScore: round(awakeScore, 1),
      sleepScheduleScore: round(sleepScheduleScore || regularityScore, 1),
      sleepComponent: round(sleepComponent, 1),
      autonomicComponent: round(autonomicComponent, 1),
      loadComponent: round(loadComponent, 1),
      cognitiveComponent: round(cognitiveComponent, 1),
      penalty: round(penalty, 1),
      sleepDebtHours: round(debt, 2),
      sleepHours: round(sleepHours, 2),
      loadRatio: round(loadRatio, 2),
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
      const sleepValue = sleepHistory[sleepHistory.length - 1 - i];
      if (typeof sleepValue !== "number") {
        continue;
      }

      const deficit = Math.max(0, goals.sleepHoursTarget - sleepValue);
      debt7 += deficit * 0.85 ** i;
    }

    const repayTonight = Math.min(1, 0.3 * debt7);
    const sleepOpportunityHours = goals.sleepHoursTarget + repayTonight + 0.25 + 0.25;

    const tomorrowKey = shiftDate(dateKey, 1);
    const wakeMinutes = isWeekendDate(tomorrowKey)
      ? parseWakeTimeToMinutes(goals.weekendWakeTime)
      : parseWakeTimeToMinutes(goals.weekdayWakeTime);

    let bedtimeMinutes = wakeMinutes - sleepOpportunityHours * 60;
    if (midpointSd7 > 1) {
      bedtimeMinutes -= 15;
    }

    const weekStart = getWeekStartDate(dateKey);
    const workoutsThisWeek = workouts.filter((workout) => {
      const workoutDate = toDateKey(workout.startedAt);
      return workoutDate >= weekStart && workoutDate <= dateKey;
    });

    const daysSinceWorkout = computeDaysSinceWorkout(dateKey, workoutsByDate);
    const inactivity = 1 / (1 + Math.exp(-(daysSinceWorkout - 2)));
    const quotaGap =
      Math.max(0, goals.weeklyWorkoutTarget - workoutsThisWeek.length) /
      Math.max(goals.weeklyWorkoutTarget, 1);
    const underload = clamp((0.95 - readiness.loadRatio) / 0.95, 0, 1);
    const workoutNeed = 0.4 * inactivity + 0.35 * quotaGap + 0.25 * underload;

    let workoutType = chooseWorkoutType(workoutsThisWeek, goals.weeklyWorkoutTarget);
    let workoutDurationMin = 0;
    let workoutSuggestion = "No workout needed today.";

    if (readiness.score < 45 || sleepHours < 7.5) {
      workoutType = "recovery";
      workoutDurationMin = 25;
      workoutSuggestion = "Recovery day: 25m easy walk/run + 10m mobility.";
    } else if (readiness.score < 70 || readiness.loadRatio > 1.15) {
      workoutDurationMin = workoutNeed >= 0.25 ? 35 : 20;
      workoutSuggestion =
        workoutType === "cardio"
          ? `Light cardio: ${workoutDurationMin}m conversational run.`
          : `Light ${workoutType}: ${workoutDurationMin}m low-intensity session.`;
    } else {
      workoutDurationMin = workoutNeed >= 0.2 ? 45 : 30;
      workoutSuggestion =
        workoutType === "cardio"
          ? `Moderate cardio: ${workoutDurationMin}m steady run.`
          : `Moderate ${workoutType}: ${workoutDurationMin}m controlled session.`;
    }

    const recommendation: DailyRecommendation = {
      date: dateKey,
      studyTargetHours: round(studyTargetHours, 2),
      workoutType,
      workoutDurationMin,
      workoutSuggestion,
      bedtimeIso: toIsoOnDate(dateKey, bedtimeMinutes),
      bedtimeLabel: formatClockLabel(bedtimeMinutes),
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
    workoutType: "cardio" as const,
    workoutDurationMin: 35,
    workoutSuggestion: "35m light cardio session.",
    bedtimeIso: toIsoOnDate(todayKey, 21 * 60 + 30),
    bedtimeLabel: "21:30",
  };

  const thisWeekStart = getWeekStartDate(todayKey);
  const weeklyWorkoutCount = workouts.filter((workout) => {
    const workoutDate = toDateKey(workout.startedAt);
    return workoutDate >= thisWeekStart && workoutDate <= todayKey;
  }).length;

  const daysSinceWorkout = computeDaysSinceWorkout(todayKey, workoutsByDate);

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
    daysSinceWorkout,
    trendDelta7d: round(avgRecent7 - avgPrevious7, 1),
  };
}
