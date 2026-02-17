import type { AppData, WorkoutDetail, WorkoutStreamPoint } from "@/lib/types";

export type FutureHealthCleanupSummary = {
  removedDailyHealth: number;
  removedWorkouts: number;
  removedWorkoutDetails: number;
  removedRawRows: number;
  removedStreamRows: number;
  removedSeriesPoints: number;
  changed: boolean;
};

type SeriesKey =
  | "heartRateSeries"
  | "distanceSeries"
  | "stepSeries"
  | "activeEnergySeries"
  | "restingEnergySeries";

const SERIES_KEYS: SeriesKey[] = [
  "heartRateSeries",
  "distanceSeries",
  "stepSeries",
  "activeEnergySeries",
  "restingEnergySeries",
];

function toMs(value: string | undefined): number | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsedMs = new Date(value).getTime();
  if (!Number.isFinite(parsedMs)) {
    return null;
  }
  return parsedMs;
}

function isOnOrBeforeCutoff(value: string | undefined, cutoffMs: number): boolean {
  const parsedMs = toMs(value);
  if (parsedMs == null) {
    return false;
  }
  return parsedMs <= cutoffMs;
}

function sanitizeSeriesRows(
  rows: WorkoutStreamPoint[] | undefined,
  cutoffMs: number,
): { next: WorkoutStreamPoint[] | undefined; removed: number } {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { next: rows, removed: 0 };
  }

  const next = rows.filter((row) => isOnOrBeforeCutoff(row.timestamp, cutoffMs));
  return {
    next,
    removed: rows.length - next.length,
  };
}

function sanitizeWorkoutDetail(
  detail: WorkoutDetail,
  cutoffMs: number,
): { next: WorkoutDetail; removedStreamRows: number; removedSeriesPoints: number } {
  let removedStreamRows = 0;
  let removedSeriesPoints = 0;

  const streams = detail.streams
    .map((stream) => {
      const nextRows = stream.rows.filter((row) =>
        isOnOrBeforeCutoff(row.timestamp, cutoffMs),
      );
      removedStreamRows += stream.rows.length - nextRows.length;
      return {
        ...stream,
        rows: nextRows,
        startedAt: nextRows[0]?.timestamp,
        endedAt: nextRows[nextRows.length - 1]?.timestamp,
      };
    })
    .filter((stream) => stream.rows.length > 0);

  const partial: WorkoutDetail = {
    ...detail,
    streams,
    sourceFiles: [...detail.sourceFiles],
  };

  for (const key of SERIES_KEYS) {
    const series = sanitizeSeriesRows(detail[key], cutoffMs);
    removedSeriesPoints += series.removed;
    partial[key] = series.next;
  }

  return {
    next: partial,
    removedStreamRows,
    removedSeriesPoints,
  };
}

export function sanitizeFutureHealthData(
  data: AppData,
  now: Date = new Date(),
): { data: AppData; summary: FutureHealthCleanupSummary } {
  const cutoffMs = now.getTime();
  if (!Number.isFinite(cutoffMs)) {
    return {
      data,
      summary: {
        removedDailyHealth: 0,
        removedWorkouts: 0,
        removedWorkoutDetails: 0,
        removedRawRows: 0,
        removedStreamRows: 0,
        removedSeriesPoints: 0,
        changed: false,
      },
    };
  }

  const nextDailyHealth = data.dailyHealth.filter((item) =>
    isOnOrBeforeCutoff(item.date, cutoffMs),
  );
  const removedDailyHealth = data.dailyHealth.length - nextDailyHealth.length;

  const nextWorkouts = data.workouts.filter(
    (item) =>
      isOnOrBeforeCutoff(item.startedAt, cutoffMs) &&
      isOnOrBeforeCutoff(item.endedAt, cutoffMs),
  );
  const removedWorkouts = data.workouts.length - nextWorkouts.length;
  const keptWorkoutIds = new Set(nextWorkouts.map((workout) => workout.id));

  const removedWorkoutIds = new Set(
    data.workouts.map((workout) => workout.id).filter((id) => !keptWorkoutIds.has(id)),
  );

  const nextWorkoutDetails: WorkoutDetail[] = [];
  let removedWorkoutDetails = 0;
  let removedStreamRows = 0;
  let removedSeriesPoints = 0;

  for (const detail of data.workoutDetails) {
    if (
      removedWorkoutIds.has(detail.workoutId) ||
      !isOnOrBeforeCutoff(detail.startedAt, cutoffMs) ||
      !isOnOrBeforeCutoff(detail.endedAt, cutoffMs)
    ) {
      removedWorkoutDetails += 1;
      continue;
    }

    const sanitizedDetail = sanitizeWorkoutDetail(detail, cutoffMs);
    removedStreamRows += sanitizedDetail.removedStreamRows;
    removedSeriesPoints += sanitizedDetail.removedSeriesPoints;
    nextWorkoutDetails.push(sanitizedDetail.next);
  }

  const nextRawRows = data.healthRawRows.filter(
    (row) => row.timestamp == null || isOnOrBeforeCutoff(row.timestamp, cutoffMs),
  );
  const removedRawRows = data.healthRawRows.length - nextRawRows.length;

  const changed =
    removedDailyHealth > 0 ||
    removedWorkouts > 0 ||
    removedWorkoutDetails > 0 ||
    removedRawRows > 0 ||
    removedStreamRows > 0 ||
    removedSeriesPoints > 0;

  return {
    data: {
      ...data,
      dailyHealth: nextDailyHealth,
      workouts: nextWorkouts,
      workoutDetails: nextWorkoutDetails,
      healthRawRows: nextRawRows,
    },
    summary: {
      removedDailyHealth,
      removedWorkouts,
      removedWorkoutDetails,
      removedRawRows,
      removedStreamRows,
      removedSeriesPoints,
      changed,
    },
  };
}
