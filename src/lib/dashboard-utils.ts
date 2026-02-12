import {
  AFTERNOON_MESSAGES,
  CALENDAR_DAYS_AHEAD,
  EVENING_MESSAGES,
  LATE_NIGHT_MESSAGES,
  MORNING_MESSAGES,
  SUBJECT_IDS,
  createEmptySubjectTotals,
} from "./constants";
import type {
  DayStudyAggregate,
  Exam,
  StudySession,
  SubjectId,
  SubjectTotals,
  TodoItem,
} from "./types";

export function toDateKey(dateLike: string | Date): string {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`);
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
  }

  return `${remainingSeconds}s`;
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

export function formatDateTime(dateLike: string): string {
  return new Date(dateLike).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function sortTodos(todos: TodoItem[]): TodoItem[] {
  return [...todos].sort((a, b) => {
    if (a.ultraPriority !== b.ultraPriority) {
      return Number(b.ultraPriority) - Number(a.ultraPriority);
    }

    const deadlineDiff =
      new Date(a.deadline).getTime() - new Date(b.deadline).getTime();

    if (deadlineDiff !== 0) {
      return deadlineDiff;
    }

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function getNearestExams(exams: Exam[], limit = 3, now = new Date()): Exam[] {
  return [...exams]
    .filter((exam) => new Date(exam.startsAt).getTime() >= now.getTime())
    .sort(
      (left, right) =>
        new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    )
    .slice(0, limit);
}

export function getCountdown(
  exam: Exam,
  now = new Date(),
  baselineSeconds?: number,
): {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  done: boolean;
  progressRatio: number;
} {
  const msLeft = new Date(exam.startsAt).getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const done = totalSeconds <= 0;

  const fullRangeSeconds = CALENDAR_DAYS_AHEAD * 86400;
  const safeBaseline =
    baselineSeconds && baselineSeconds > 0 ? baselineSeconds : fullRangeSeconds;
  const progressRatio = done
    ? 0
    : Math.min(1, Math.max(0, totalSeconds / safeBaseline));

  return {
    totalSeconds,
    days,
    hours,
    minutes,
    done,
    progressRatio,
  };
}

export function buildDayAggregates(
  studySessions: StudySession[],
): Record<string, DayStudyAggregate> {
  const result: Record<string, DayStudyAggregate> = {};

  for (const session of studySessions) {
    const dateKey = toDateKey(session.startedAt);

    if (!result[dateKey]) {
      result[dateKey] = {
        date: dateKey,
        totalSec: 0,
        bySubject: createEmptySubjectTotals(),
        sessionCount: 0,
      };
    }

    const aggregate = result[dateKey];
    aggregate.totalSec += session.durationSec;
    aggregate.bySubject[session.subjectId] += session.durationSec;
    aggregate.sessionCount += 1;
  }

  for (const aggregate of Object.values(result)) {
    let dominant: SubjectId | undefined;
    let dominantSeconds = 0;

    for (const subjectId of SUBJECT_IDS) {
      const seconds = aggregate.bySubject[subjectId];
      if (seconds > dominantSeconds) {
        dominant = subjectId;
        dominantSeconds = seconds;
      }
    }

    aggregate.dominantSubjectId = dominant;
  }

  return result;
}

export function buildSubjectTotals(studySessions: StudySession[]): SubjectTotals {
  const totals = createEmptySubjectTotals();

  for (const session of studySessions) {
    totals[session.subjectId] += session.durationSec;
  }

  return totals;
}

export function buildForwardDates(start = new Date(), totalDays = CALENDAR_DAYS_AHEAD): string[] {
  const dates: string[] = [];
  const base = new Date(start);
  base.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < totalDays; offset += 1) {
    const day = new Date(base);
    day.setDate(base.getDate() + offset);
    dates.push(toDateKey(day));
  }

  return dates;
}

export function getGreetingBucket(now = new Date()): "morning" | "afternoon" | "evening" | "late" {
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 22) {
    return "evening";
  }

  return "late";
}

export function selectGreeting(
  bucket: "morning" | "afternoon" | "evening" | "late",
  lastIndex: number | null,
): { message: string; index: number } {
  const source =
    bucket === "morning"
      ? MORNING_MESSAGES
      : bucket === "afternoon"
      ? AFTERNOON_MESSAGES
      : bucket === "evening"
      ? EVENING_MESSAGES
      : LATE_NIGHT_MESSAGES;

  const candidates = source
    .map((message, index) => ({ message, index }))
    .filter((entry) => entry.index !== lastIndex);

  const next = candidates[Math.floor(Math.random() * candidates.length)] ?? {
    message: source[0],
    index: 0,
  };

  return next;
}
