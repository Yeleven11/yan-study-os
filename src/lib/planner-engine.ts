import { SUBJECT_IDS, createDefaultPlannerProfile } from "@/lib/constants";
import { toDateKey } from "@/lib/dashboard-utils";
import { buildPerformanceInsights } from "@/lib/health-engine";
import type {
  AppData,
  PlannerDayPlan,
  PlannerDateOverride,
  PlannerDayTemplate,
  PlannerProfile,
  PlannerRun,
  PlannerRunSource,
  PlannerStudyBlock,
  PlannerSubjectAllocation,
  PlannerTimeWindow,
  PlannedDayTarget,
  SubjectId,
} from "@/lib/types";

type WindowRange = {
  startMin: number;
  endMin: number;
  label?: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function shiftDate(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function parseClockToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
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
    return null;
  }

  return hours * 60 + minutes;
}

function formatClock(minutesFromMidnight: number): string {
  const safeMinutes = ((Math.floor(minutesFromMidnight) % 1440) + 1440) % 1440;
  const hours = Math.floor(safeMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (safeMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function buildWindowRanges(windows: PlannerTimeWindow[]): WindowRange[] {
  const ranges: WindowRange[] = [];

  for (const window of windows) {
    const startMin = parseClockToMinutes(window.start);
    const endMin = parseClockToMinutes(window.end);
    if (startMin === null || endMin === null) {
      continue;
    }

    if (endMin > startMin) {
      ranges.push({ startMin, endMin, label: window.label });
      continue;
    }

    // Handle midnight-crossing windows by clipping to current day.
    ranges.push({ startMin, endMin: 1440, label: window.label });
    ranges.push({ startMin: 0, endMin, label: window.label });
  }

  return ranges
    .filter((range) => range.endMin > range.startMin)
    .sort((left, right) => left.startMin - right.startMin);
}

function intersectRanges(left: WindowRange, right: WindowRange): WindowRange | null {
  const startMin = Math.max(left.startMin, right.startMin);
  const endMin = Math.min(left.endMin, right.endMin);
  if (endMin <= startMin) {
    return null;
  }

  return {
    startMin,
    endMin,
  };
}

function subtractRange(base: WindowRange, block: WindowRange): WindowRange[] {
  const overlap = intersectRanges(base, block);
  if (!overlap) {
    return [base];
  }

  const parts: WindowRange[] = [];
  if (overlap.startMin > base.startMin) {
    parts.push({
      startMin: base.startMin,
      endMin: overlap.startMin,
      label: base.label,
    });
  }
  if (overlap.endMin < base.endMin) {
    parts.push({
      startMin: overlap.endMin,
      endMin: base.endMin,
      label: base.label,
    });
  }
  return parts;
}

function subtractBlockedWindows(
  studyRanges: WindowRange[],
  blockedRanges: WindowRange[],
): WindowRange[] {
  let current = studyRanges.slice();
  for (const blocked of blockedRanges) {
    const next: WindowRange[] = [];
    for (const range of current) {
      next.push(...subtractRange(range, blocked));
    }
    current = next;
  }

  return current
    .filter((range) => range.endMin > range.startMin)
    .sort((left, right) => left.startMin - right.startMin);
}

function minutesToIso(dateKey: string, minutesFromMidnight: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  const safeMinutes = ((Math.floor(minutesFromMidnight) % 1440) + 1440) % 1440;
  date.setHours(0, 0, 0, 0);
  date.setMinutes(safeMinutes);
  return date.toISOString();
}

function normalizePlannerProfile(
  profile: PlannerProfile | undefined,
  timezone: string,
): PlannerProfile {
  const defaults = createDefaultPlannerProfile(timezone);
  const input = profile || defaults;

  const weeklyTemplateByDay = new Map<number, PlannerDayTemplate>();
  for (const template of input.weeklyTemplate || []) {
    if (!template || typeof template.dayOfWeek !== "number") {
      continue;
    }
    const dayOfWeek = Math.max(0, Math.min(6, Math.floor(template.dayOfWeek)));
    weeklyTemplateByDay.set(dayOfWeek, {
      dayOfWeek,
      studyWindows: Array.isArray(template.studyWindows) ? template.studyWindows : [],
      blockedWindows: Array.isArray(template.blockedWindows) ? template.blockedWindows : [],
      minStudyHours:
        typeof template.minStudyHours === "number" && Number.isFinite(template.minStudyHours)
          ? template.minStudyHours
          : defaults.weeklyTemplate[dayOfWeek]?.minStudyHours || 0,
      maxStudyHours:
        typeof template.maxStudyHours === "number" && Number.isFinite(template.maxStudyHours)
          ? template.maxStudyHours
          : defaults.weeklyTemplate[dayOfWeek]?.maxStudyHours || 8,
      defaultSessionMin:
        typeof template.defaultSessionMin === "number" && Number.isFinite(template.defaultSessionMin)
          ? template.defaultSessionMin
          : defaults.weeklyTemplate[dayOfWeek]?.defaultSessionMin || defaults.defaultSessionMin,
    });
  }

  const weeklyTemplate = defaults.weeklyTemplate.map((defaultTemplate) => ({
    ...defaultTemplate,
    ...(weeklyTemplateByDay.get(defaultTemplate.dayOfWeek) || {}),
  }));

  const overrideByDate = new Map<string, PlannerDateOverride>();
  for (const override of Array.isArray(input.dateOverrides) ? input.dateOverrides : []) {
    if (!override || typeof override.date !== "string") {
      continue;
    }
    overrideByDate.set(override.date, {
      ...override,
      studyWindows: Array.isArray(override.studyWindows) ? override.studyWindows : undefined,
      blockedWindows: Array.isArray(override.blockedWindows) ? override.blockedWindows : undefined,
    });
  }

  const normalizedWeights = {
    examUrgency:
      typeof input.weights?.examUrgency === "number"
        ? input.weights.examUrgency
        : defaults.weights.examUrgency,
    todoUrgency:
      typeof input.weights?.todoUrgency === "number"
        ? input.weights.todoUrgency
        : defaults.weights.todoUrgency,
    readiness:
      typeof input.weights?.readiness === "number"
        ? input.weights.readiness
        : defaults.weights.readiness,
    consistency:
      typeof input.weights?.consistency === "number"
        ? input.weights.consistency
        : defaults.weights.consistency,
    lifeBalance:
      typeof input.weights?.lifeBalance === "number"
        ? input.weights.lifeBalance
        : defaults.weights.lifeBalance,
  };
  const weightTotal =
    normalizedWeights.examUrgency +
    normalizedWeights.todoUrgency +
    normalizedWeights.readiness +
    normalizedWeights.consistency +
    normalizedWeights.lifeBalance;
  const safeWeights =
    weightTotal > 0
      ? {
          examUrgency: normalizedWeights.examUrgency / weightTotal,
          todoUrgency: normalizedWeights.todoUrgency / weightTotal,
          readiness: normalizedWeights.readiness / weightTotal,
          consistency: normalizedWeights.consistency / weightTotal,
          lifeBalance: normalizedWeights.lifeBalance / weightTotal,
        }
      : defaults.weights;

  return {
    version: 1,
    timezone:
      typeof input.timezone === "string" && input.timezone.trim().length > 0
        ? input.timezone
        : defaults.timezone,
    horizonDays:
      typeof input.horizonDays === "number" && Number.isFinite(input.horizonDays)
        ? clamp(Math.round(input.horizonDays), 3, 14)
        : defaults.horizonDays,
    applyMode: input.applyMode === "write_targets" ? "write_targets" : "recommend_only",
    blockMode: input.blockMode === "targets_only" ? "targets_only" : "time_blocks",
    includeWorkoutPlanning:
      typeof input.includeWorkoutPlanning === "boolean"
        ? input.includeWorkoutPlanning
        : defaults.includeWorkoutPlanning,
    includeBedtimeGuidance:
      typeof input.includeBedtimeGuidance === "boolean"
        ? input.includeBedtimeGuidance
        : defaults.includeBedtimeGuidance,
    defaultSessionMin:
      typeof input.defaultSessionMin === "number" && Number.isFinite(input.defaultSessionMin)
        ? clamp(Math.round(input.defaultSessionMin), 20, 180)
        : defaults.defaultSessionMin,
    minSessionMin:
      typeof input.minSessionMin === "number" && Number.isFinite(input.minSessionMin)
        ? clamp(Math.round(input.minSessionMin), 15, 120)
        : defaults.minSessionMin,
    maxSessionMin:
      typeof input.maxSessionMin === "number" && Number.isFinite(input.maxSessionMin)
        ? clamp(Math.round(input.maxSessionMin), 30, 240)
        : defaults.maxSessionMin,
    breakMin:
      typeof input.breakMin === "number" && Number.isFinite(input.breakMin)
        ? clamp(Math.round(input.breakMin), 0, 60)
        : defaults.breakMin,
    maxConsecutiveStudyDays:
      typeof input.maxConsecutiveStudyDays === "number" &&
      Number.isFinite(input.maxConsecutiveStudyDays)
        ? clamp(Math.round(input.maxConsecutiveStudyDays), 2, 14)
        : defaults.maxConsecutiveStudyDays,
    recoveryProtectionThreshold:
      typeof input.recoveryProtectionThreshold === "number" &&
      Number.isFinite(input.recoveryProtectionThreshold)
        ? clamp(Math.round(input.recoveryProtectionThreshold), 30, 80)
        : defaults.recoveryProtectionThreshold,
    allowWeekendStudy:
      typeof input.allowWeekendStudy === "boolean"
        ? input.allowWeekendStudy
        : defaults.allowWeekendStudy,
    weeklyTemplate,
    dateOverrides: [...overrideByDate.values()].sort(
      (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
    ),
    weights: safeWeights,
    updatedAt: new Date().toISOString(),
  };
}

function getTemplateForDate(profile: PlannerProfile, dateKey: string): PlannerDayTemplate {
  const dayOfWeek = new Date(`${dateKey}T00:00:00`).getDay();
  return (
    profile.weeklyTemplate.find((template) => template.dayOfWeek === dayOfWeek) ||
    profile.weeklyTemplate[0]
  );
}

function getOverrideForDate(profile: PlannerProfile, dateKey: string): PlannerDateOverride | null {
  return profile.dateOverrides.find((override) => override.date === dateKey) || null;
}

function computeAvailableStudyRanges(
  template: PlannerDayTemplate,
  override: PlannerDateOverride | null,
): WindowRange[] {
  const baseStudy = buildWindowRanges(override?.studyWindows || template.studyWindows);
  const blocked = buildWindowRanges(override?.blockedWindows || template.blockedWindows);
  return subtractBlockedWindows(baseStudy, blocked);
}

function getDurationMinutes(ranges: WindowRange[]): number {
  return ranges.reduce((total, range) => total + (range.endMin - range.startMin), 0);
}

function recentSubjectHours(
  data: AppData,
  dateKey: string,
  lookbackDays: number,
): Record<SubjectId, number> {
  const startKey = shiftDate(dateKey, -(lookbackDays - 1));
  const totals: Record<SubjectId, number> = Object.fromEntries(
    SUBJECT_IDS.map((subjectId) => [subjectId, 0]),
  ) as Record<SubjectId, number>;

  for (const session of data.studySessions) {
    const key = toDateKey(session.startedAt);
    if (key < startKey || key >= dateKey) {
      continue;
    }
    totals[session.subjectId] += session.durationSec / 3600;
  }
  return totals;
}

function scoreSubjectsForDay(
  data: AppData,
  dateKey: string,
  profile: PlannerProfile,
): Record<SubjectId, number> {
  const dayMs = new Date(`${dateKey}T00:00:00`).getTime();
  const recentHours = recentSubjectHours(data, dateKey, 14);
  const activeTodos = data.todos.filter((todo) => !todo.archived && !todo.completed);

  const scores: Record<SubjectId, number> = Object.fromEntries(
    SUBJECT_IDS.map((subjectId) => [subjectId, 0]),
  ) as Record<SubjectId, number>;

  for (const subjectId of SUBJECT_IDS) {
    const nearestExamMs = data.exams
      .filter((exam) => exam.subjectId === subjectId)
      .map((exam) => new Date(exam.startsAt).getTime())
      .filter((value) => value >= dayMs)
      .sort((left, right) => left - right)[0];

    const examDays = Number.isFinite(nearestExamMs)
      ? Math.max(0, (nearestExamMs - dayMs) / 86_400_000)
      : 999;
    const examUrgency = Number.isFinite(nearestExamMs)
      ? Math.exp(-examDays / 16)
      : 0.05;

    const urgentTodoCount = activeTodos.filter((todo) => {
      if (todo.subjectId !== subjectId) {
        return false;
      }
      const deadlineMs = new Date(todo.deadline).getTime();
      return deadlineMs >= dayMs && deadlineMs <= dayMs + 7 * 86_400_000;
    }).length;

    const todoUrgency = clamp(urgentTodoCount / 3, 0, 1);
    const consistencyNeed = clamp(1 / (1 + recentHours[subjectId]), 0.1, 1);

    scores[subjectId] =
      profile.weights.examUrgency * examUrgency +
      profile.weights.todoUrgency * todoUrgency +
      profile.weights.consistency * consistencyNeed;
  }

  return scores;
}

function buildSubjectAllocations(
  subjectScores: Record<SubjectId, number>,
  plannedHours: number,
): PlannerSubjectAllocation[] {
  const positiveScores = SUBJECT_IDS.map((subjectId) => ({
    subjectId,
    score: Math.max(0.001, subjectScores[subjectId] || 0.001),
  }));
  const total = positiveScores.reduce((sum, item) => sum + item.score, 0);
  if (total <= 0 || plannedHours <= 0) {
    return [];
  }

  return positiveScores
    .map((item) => {
      const hours = (item.score / total) * plannedHours;
      return {
        subjectId: item.subjectId,
        hours: round(hours, 2),
        reason: "Weighted by exam urgency, active todos, and recent study balance.",
      };
    })
    .sort((left, right) => right.hours - left.hours)
    .filter((item) => item.hours > 0);
}

function createBlockRanges(
  ranges: WindowRange[],
  totalMinutes: number,
  sessionMinutes: number,
  minSessionMinutes: number,
  maxSessionMinutes: number,
  breakMinutes: number,
): Array<{ startMin: number; endMin: number }> {
  const blocks: Array<{ startMin: number; endMin: number }> = [];
  let remaining = Math.max(0, totalMinutes);

  for (const range of ranges) {
    let cursor = range.startMin;
    while (remaining > 0 && cursor < range.endMin) {
      const availableInRange = range.endMin - cursor;
      if (availableInRange < minSessionMinutes) {
        break;
      }

      const blockDuration = Math.min(
        Math.max(minSessionMinutes, sessionMinutes),
        maxSessionMinutes,
        availableInRange,
        remaining,
      );

      if (blockDuration < minSessionMinutes) {
        break;
      }

      blocks.push({
        startMin: cursor,
        endMin: cursor + blockDuration,
      });

      remaining -= blockDuration;
      cursor += blockDuration + breakMinutes;
    }

    if (remaining <= 0) {
      break;
    }
  }

  return blocks;
}

function pickSubjectForBlock(
  allocations: PlannerSubjectAllocation[],
  allocatedMinutesBySubject: Map<SubjectId, number>,
  previousSubject: SubjectId | null,
): SubjectId {
  const ranked = allocations
    .map((allocation) => {
      const plannedMinutes = allocation.hours * 60;
      const usedMinutes = allocatedMinutesBySubject.get(allocation.subjectId) || 0;
      const remaining = Math.max(0, plannedMinutes - usedMinutes);
      const repeatPenalty = previousSubject === allocation.subjectId ? 0.6 : 1;
      return {
        subjectId: allocation.subjectId,
        score: remaining * repeatPenalty,
      };
    })
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.subjectId || allocations[0]?.subjectId || SUBJECT_IDS[0];
}

function toIntensity(readinessScore: number): PlannerStudyBlock["intensity"] {
  if (readinessScore >= 75) {
    return "deep";
  }
  if (readinessScore >= 55) {
    return "moderate";
  }
  return "light";
}

function countConsecutiveStudyDays(data: AppData, beforeDateKey: string): number {
  const studiedDays = new Set(data.studySessions.map((session) => toDateKey(session.startedAt)));
  let streak = 0;
  for (let offset = 1; offset <= 14; offset += 1) {
    const key = shiftDate(beforeDateKey, -offset);
    if (studiedDays.has(key)) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

function buildPlannerDayPlan(
  data: AppData,
  profile: PlannerProfile,
  dateKey: string,
  plannedConsecutiveDays: number,
): PlannerDayPlan {
  const insights = buildPerformanceInsights(data, new Date(`${dateKey}T12:00:00`));
  const readiness = insights.readinessByDate[dateKey] || insights.todayReadiness;
  const recommendation = insights.recommendationsByDate[dateKey] || insights.todayRecommendation;
  const template = getTemplateForDate(profile, dateKey);
  const override = getOverrideForDate(profile, dateKey);
  const ranges = computeAvailableStudyRanges(template, override);
  const availableStudyHours = getDurationMinutes(ranges) / 60;

  const isWeekend = [0, 6].includes(new Date(`${dateKey}T00:00:00`).getDay());
  let minStudyHours = clamp(
    override?.minStudyHours ?? template.minStudyHours,
    0,
    Math.max(0, override?.maxStudyHours ?? template.maxStudyHours),
  );
  let maxStudyHours = clamp(
    override?.maxStudyHours ?? template.maxStudyHours,
    0,
    12,
  );
  let constrained = false;
  const notes: string[] = [];

  if (!profile.allowWeekendStudy && isWeekend) {
    minStudyHours = 0;
    maxStudyHours = 0;
    notes.push("Weekend study disabled by your profile.");
  }

  if (override?.unavailable) {
    minStudyHours = 0;
    maxStudyHours = 0;
    notes.push("Marked unavailable by date override.");
  }

  if (plannedConsecutiveDays >= profile.maxConsecutiveStudyDays) {
    maxStudyHours = Math.min(maxStudyHours, 1);
    notes.push("Consecutive-day guard reduced load for recovery.");
  }

  if (readiness.score < profile.recoveryProtectionThreshold) {
    maxStudyHours = Math.min(maxStudyHours, recommendation.studyTargetHours * 0.9);
    notes.push("Readiness protection lowered today's ceiling.");
  }

  const readinessBoost =
    1 + ((readiness.score - 60) / 100) * (0.7 * profile.weights.readiness + 0.15);
  const lifeBalanceLimit = Math.max(0.3, 1 - profile.weights.lifeBalance * 0.55);
  const recommendationHours = recommendation.studyTargetHours * readinessBoost;

  let plannedStudyHours = clamp(
    recommendationHours * lifeBalanceLimit,
    minStudyHours,
    Math.max(minStudyHours, maxStudyHours),
  );

  if (availableStudyHours < plannedStudyHours) {
    plannedStudyHours = availableStudyHours;
    constrained = true;
    notes.push("Planned study is constrained by your available time windows.");
  }

  if (availableStudyHours < minStudyHours) {
    constrained = true;
    notes.push("Available time is below your configured daily minimum.");
  }

  const subjectScores = scoreSubjectsForDay(data, dateKey, profile);
  const subjectAllocations = buildSubjectAllocations(subjectScores, plannedStudyHours);
  const totalMinutes = Math.round(plannedStudyHours * 60);
  const sessionMinutes = clamp(
    template.defaultSessionMin || profile.defaultSessionMin,
    profile.minSessionMin,
    profile.maxSessionMin,
  );

  const blockRanges =
    profile.blockMode === "time_blocks"
      ? createBlockRanges(
          ranges,
          totalMinutes,
          sessionMinutes,
          profile.minSessionMin,
          profile.maxSessionMin,
          profile.breakMin,
        )
      : [];

  const blocks: PlannerStudyBlock[] = [];
  const allocatedMinutesBySubject = new Map<SubjectId, number>();
  let previousSubject: SubjectId | null = null;
  for (const range of blockRanges) {
    const subjectId = pickSubjectForBlock(
      subjectAllocations,
      allocatedMinutesBySubject,
      previousSubject,
    );
    const durationMin = range.endMin - range.startMin;
    allocatedMinutesBySubject.set(
      subjectId,
      (allocatedMinutesBySubject.get(subjectId) || 0) + durationMin,
    );
    blocks.push({
      startIso: minutesToIso(dateKey, range.startMin),
      endIso: minutesToIso(dateKey, range.endMin),
      durationMin,
      subjectId,
      intensity: toIntensity(readiness.score),
      reason: "Scheduled from available windows and subject urgency model.",
    });
    previousSubject = subjectId;
  }

  if (profile.blockMode === "targets_only") {
    notes.push("Block generation disabled (targets-only mode).");
  }

  if (override?.note) {
    notes.push(override.note);
  }

  return {
    date: dateKey,
    readinessScore: round(readiness.score, 1),
    sleepScore: round(readiness.sleepScore, 1),
    recommendedStudyHours: round(recommendation.studyTargetHours, 2),
    plannedStudyHours: round(plannedStudyHours, 2),
    availableStudyHours: round(availableStudyHours, 2),
    minStudyHours: round(minStudyHours, 2),
    maxStudyHours: round(maxStudyHours, 2),
    constrained,
    notes,
    bedtimeLabel: profile.includeBedtimeGuidance ? recommendation.bedtimeLabel : undefined,
    workoutSuggestion: profile.includeWorkoutPlanning ? recommendation.workoutSuggestion : undefined,
    subjectAllocations,
    blocks,
  };
}

export function generatePlannerRun(
  data: AppData,
  input: {
    profile?: PlannerProfile;
    now?: Date;
    source?: PlannerRunSource;
  } = {},
): PlannerRun {
  const now = input.now || new Date();
  const timezone = data.settings?.timezone || "Europe/Berlin";
  const profile = normalizePlannerProfile(input.profile || data.plannerProfile, timezone);
  const startDate = toDateKey(now);

  const days: PlannerDayPlan[] = [];
  let consecutivePlannedDays = countConsecutiveStudyDays(data, startDate);

  for (let offset = 0; offset < profile.horizonDays; offset += 1) {
    const date = shiftDate(startDate, offset);
    const dayPlan = buildPlannerDayPlan(data, profile, date, consecutivePlannedDays);
    if (dayPlan.plannedStudyHours > 0.35) {
      consecutivePlannedDays += 1;
    } else {
      consecutivePlannedDays = 0;
    }
    days.push(dayPlan);
  }

  const totalPlannedHours = days.reduce((sum, day) => sum + day.plannedStudyHours, 0);
  const constrainedDays = days.filter((day) => day.constrained).length;
  const lowReadinessDays = days.filter((day) => day.readinessScore < 50).length;
  const highReadinessDays = days.filter((day) => day.readinessScore >= 75).length;

  return {
    id: crypto.randomUUID(),
    createdAt: now.toISOString(),
    source: input.source || "manual",
    horizonDays: profile.horizonDays,
    startDate,
    profile,
    summary: {
      totalPlannedHours: round(totalPlannedHours, 2),
      avgPlannedHours: round(totalPlannedHours / Math.max(days.length, 1), 2),
      constrainedDays,
      lowReadinessDays,
      highReadinessDays,
    },
    days,
    applied: false,
  };
}

export function applyPlannerRun(data: AppData, run: PlannerRun): AppData {
  const now = new Date().toISOString();
  const nextRuns = data.plannerRuns.map((item) =>
    item.id === run.id
      ? {
          ...run,
          applied: true,
          appliedAt: now,
        }
      : item,
  );

  const targetsByDate = new Map<string, PlannedDayTarget>(
    data.plannedTargets.map((target) => [target.date, target]),
  );

  for (const day of run.days) {
    targetsByDate.set(day.date, {
      date: day.date,
      studyTargetHours: day.plannedStudyHours,
      workoutType:
        day.workoutSuggestion?.toLowerCase().includes("strength")
          ? "strength"
          : day.workoutSuggestion?.toLowerCase().includes("mobility")
          ? "mobility"
          : day.workoutSuggestion?.toLowerCase().includes("recovery")
          ? "recovery"
          : "cardio",
      workoutDurationMin: day.workoutSuggestion
        ? clamp(
            Number.parseInt(day.workoutSuggestion.match(/(\d+)\s*m/i)?.[1] || "30", 10),
            15,
            120,
          )
        : 30,
      bedtimeLabel: day.bedtimeLabel || formatClock(22 * 60),
      sourceRunId: run.id,
      createdAt: now,
    });
  }

  return {
    ...data,
    plannerRuns: nextRuns,
    plannedTargets: [...targetsByDate.values()].sort(
      (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
    ),
  };
}
