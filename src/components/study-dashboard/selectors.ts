import { OPERATIONAL_DAY_START_HOUR, toDateKey } from "@/lib/dashboard-utils";
import type { ActiveTimerState, Exam, StudySession } from "@/lib/types";

const STUDY_STREAK_THRESHOLD_SECONDS = 90 * 60;

export function toDateKeyInTimezone(
  dateLike: string | Date,
  timezone: string,
  dayStartHour = 0,
): string {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  const shifted = new Date(date.getTime() - dayStartHour * 60 * 60 * 1000);

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(shifted);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fall back to local formatter if timezone is invalid.
  }

  return toDateKey(shifted);
}

function shiftDateKeyByDays(dateKey: string, offsetDays: number): string {
  const base = new Date(`${dateKey}T00:00:00Z`);
  if (!Number.isFinite(base.getTime())) {
    return dateKey;
  }

  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base.toISOString().slice(0, 10);
}

export function computeStudyStreakDays(
  sessions: StudySession[],
  timezone: string,
  now = new Date(),
): number {
  if (sessions.length === 0) {
    return 0;
  }

  const totalByDate = new Map<string, number>();
  for (const session of sessions) {
    if (!session || !Number.isFinite(session.durationSec) || session.durationSec <= 0) {
      continue;
    }

    const dateKey = toDateKeyInTimezone(
      session.startedAt,
      timezone,
      OPERATIONAL_DAY_START_HOUR,
    );
    if (!dateKey) {
      continue;
    }

    totalByDate.set(
      dateKey,
      (totalByDate.get(dateKey) || 0) + Math.max(0, Math.floor(session.durationSec)),
    );
  }

  const todayKey = toDateKeyInTimezone(now, timezone, OPERATIONAL_DAY_START_HOUR);
  if (!todayKey) {
    return 0;
  }

  let streakDays = 0;
  let cursor = todayKey;

  for (let safety = 0; safety < 4000; safety += 1) {
    const totalSeconds = totalByDate.get(cursor) || 0;
    if (totalSeconds < STUDY_STREAK_THRESHOLD_SECONDS) {
      break;
    }

    streakDays += 1;
    cursor = shiftDateKeyByDays(cursor, -1);
  }

  return streakDays;
}

export function getActiveElapsedSeconds(timer: ActiveTimerState | null, nowMs: number): number {
  if (!timer) {
    return 0;
  }

  const currentRunSeconds =
    timer.isRunning && timer.resumedAt
      ? Math.max(
          0,
          Math.floor((nowMs - new Date(timer.resumedAt).getTime()) / 1000),
        )
      : 0;

  return timer.elapsedBeforePauseSec + currentRunSeconds;
}

export function mergeCountdownBaselines(
  exams: Exam[],
  currentBaselines: Record<string, number>,
  nowMs = Date.now(),
): Record<string, number> {
  const nextBaselines = { ...currentBaselines };
  const activeIds = new Set<string>();
  let changed = false;

  for (const exam of exams) {
    const examMs = new Date(exam.startsAt).getTime();
    if (examMs <= nowMs) {
      continue;
    }

    activeIds.add(exam.id);
    const secondsLeft = Math.max(1, Math.floor((examMs - nowMs) / 1000));
    const currentValue = nextBaselines[exam.id];

    if (!currentValue || currentValue <= 0 || secondsLeft > currentValue + 3600) {
      nextBaselines[exam.id] = secondsLeft;
      changed = true;
    }
  }

  for (const examId of Object.keys(nextBaselines)) {
    if (!activeIds.has(examId)) {
      delete nextBaselines[examId];
      changed = true;
    }
  }

  return changed ? nextBaselines : currentBaselines;
}
