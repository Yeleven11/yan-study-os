import type {
  DayStudyAggregate,
  DailyHealthFact,
  DailyReadiness,
  Exam,
  TodoItem,
  WorkoutEntry,
} from "./types";

export type CalendarDayState = "past" | "today" | "future";
export type TooltipPlacement = "above" | "below";

type RectLike = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type DayHoverModel = {
  dateKey: string;
  state: CalendarDayState;
  studySeconds: number;
  workouts: WorkoutEntry[];
  tests: Exam[];
  todos: TodoItem[];
  sleepHours?: number;
  sleepScore?: number;
  sleepHours7d?: number;
  sleepScore7d?: number;
  hasAnyData: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function classifyCalendarDayState(
  dateKey: string,
  todayKey: string,
): CalendarDayState {
  if (dateKey < todayKey) {
    return "past";
  }

  if (dateKey > todayKey) {
    return "future";
  }

  return "today";
}

export function buildDayHoverModel({
  dateKey,
  todayKey,
  aggregate,
  workouts,
  tests,
  todos,
  healthDay,
  readiness,
  sleepHours7d,
  sleepScore7d,
}: {
  dateKey: string;
  todayKey: string;
  aggregate?: DayStudyAggregate;
  workouts: WorkoutEntry[];
  tests: Exam[];
  todos: TodoItem[];
  healthDay?: DailyHealthFact;
  readiness?: DailyReadiness;
  sleepHours7d?: number;
  sleepScore7d?: number;
}): DayHoverModel {
  const studySeconds = aggregate?.totalSec || 0;
  const sleepHours =
    typeof healthDay?.sleepHours === "number" && Number.isFinite(healthDay.sleepHours)
      ? healthDay.sleepHours
      : undefined;
  const sleepScore =
    typeof sleepHours === "number" &&
    typeof readiness?.sleepScore === "number" &&
    Number.isFinite(readiness.sleepScore)
      ? readiness.sleepScore
      : undefined;
  const rollingSleepHours =
    typeof sleepHours7d === "number" && Number.isFinite(sleepHours7d)
      ? sleepHours7d
      : undefined;
  const rollingSleepScore =
    typeof sleepScore7d === "number" && Number.isFinite(sleepScore7d)
      ? sleepScore7d
      : undefined;

  const hasAnyData =
    studySeconds > 0 ||
    workouts.length > 0 ||
    tests.length > 0 ||
    todos.length > 0 ||
    typeof sleepHours === "number" ||
    typeof sleepScore === "number";

  return {
    dateKey,
    state: classifyCalendarDayState(dateKey, todayKey),
    studySeconds,
    workouts,
    tests,
    todos,
    sleepHours,
    sleepScore,
    sleepHours7d: rollingSleepHours,
    sleepScore7d: rollingSleepScore,
    hasAnyData,
  };
}

export function computeTooltipPlacement({
  anchorRect,
  containerRect,
  tooltipRect,
  gap = 8,
  padding = 8,
}: {
  anchorRect: RectLike;
  containerRect: RectLike;
  tooltipRect: { width: number; height: number };
  gap?: number;
  padding?: number;
}): { left: number; top: number; placement: TooltipPlacement } {
  const tooltipWidth = Math.max(120, tooltipRect.width);
  const tooltipHeight = Math.max(80, tooltipRect.height);
  const anchorCenterX = anchorRect.left - containerRect.left + anchorRect.width / 2;

  let left = anchorCenterX - tooltipWidth / 2;
  left = clamp(left, padding, Math.max(padding, containerRect.width - tooltipWidth - padding));

  const belowTop = anchorRect.top - containerRect.top + anchorRect.height + gap;
  const aboveTop = anchorRect.top - containerRect.top - tooltipHeight - gap;

  const canFitBelow = belowTop + tooltipHeight <= containerRect.height - padding;
  const canFitAbove = aboveTop >= padding;

  let placement: TooltipPlacement = "below";
  let top = belowTop;

  if (!canFitBelow && canFitAbove) {
    placement = "above";
    top = aboveTop;
  }

  top = clamp(top, padding, Math.max(padding, containerRect.height - tooltipHeight - padding));

  return {
    left,
    top,
    placement,
  };
}
