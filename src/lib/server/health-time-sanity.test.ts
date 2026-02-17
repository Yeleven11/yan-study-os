import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultAppData } from "../constants";
import type { AppData, WorkoutDetail, WorkoutEntry } from "../types";
import { sanitizeFutureHealthData } from "./health-time-sanity";

function pastWorkout(): WorkoutEntry {
  return {
    id: "past-workout",
    sourceWorkoutKey: "past-key",
    type: "cardio",
    startedAt: "2026-02-16T08:00:00.000Z",
    endedAt: "2026-02-16T08:45:00.000Z",
    durationMin: 45,
    source: "health_import",
    createdAt: "2026-02-16T09:00:00.000Z",
  };
}

function futureWorkout(): WorkoutEntry {
  return {
    id: "future-workout",
    sourceWorkoutKey: "future-key",
    type: "cardio",
    startedAt: "2029-01-01T10:00:00.000Z",
    endedAt: "2029-01-01T10:45:00.000Z",
    durationMin: 45,
    source: "health_import",
    createdAt: "2029-01-01T11:00:00.000Z",
  };
}

function pastDetail(workoutId: string): WorkoutDetail {
  return {
    workoutId,
    workoutKey: "past-key",
    workoutType: "cardio",
    startedAt: "2026-02-16T08:00:00.000Z",
    endedAt: "2026-02-16T08:45:00.000Z",
    durationMin: 45,
    mergeConfidence: 0.9,
    streamCount: 1,
    sourceFiles: ["mobile-sync.json"],
    streams: [
      {
        id: "stream-1",
        workoutKey: "past-key",
        streamType: "heart_rate",
        sourceFile: "mobile-sync.json",
        startedAt: "2026-02-16T08:00:00.000Z",
        endedAt: "2029-01-01T10:01:00.000Z",
        rows: [
          { timestamp: "2026-02-16T08:00:00.000Z", value: 130 },
          { timestamp: "2029-01-01T10:01:00.000Z", value: 150 },
        ],
      },
    ],
    heartRateSeries: [
      { timestamp: "2026-02-16T08:00:00.000Z", value: 130 },
      { timestamp: "2029-01-01T10:01:00.000Z", value: 150 },
    ],
    distanceSeries: [],
    stepSeries: [],
    activeEnergySeries: [],
    restingEnergySeries: [],
  };
}

function futureDetail(workoutId: string): WorkoutDetail {
  return {
    workoutId,
    workoutKey: "future-key",
    workoutType: "cardio",
    startedAt: "2029-01-01T10:00:00.000Z",
    endedAt: "2029-01-01T10:45:00.000Z",
    durationMin: 45,
    mergeConfidence: 0.9,
    streamCount: 1,
    sourceFiles: ["mobile-sync.json"],
    streams: [],
    heartRateSeries: [],
    distanceSeries: [],
    stepSeries: [],
    activeEnergySeries: [],
    restingEnergySeries: [],
  };
}

test("removes future health/workout data and trims future series points", () => {
  const seed = createDefaultAppData("Europe/Berlin");
  const current: AppData = {
    ...seed,
    dailyHealth: [
      {
        date: "2026-02-16",
        sleepHours: 8,
        source: "health_import",
        createdAt: "2026-02-16T12:00:00.000Z",
      },
      {
        date: "2029-01-01",
        sleepHours: 8,
        source: "health_import",
        createdAt: "2029-01-01T12:00:00.000Z",
      },
    ],
    workouts: [pastWorkout(), futureWorkout()],
    workoutDetails: [pastDetail("past-workout"), futureDetail("future-workout")],
    healthRawRows: [
      {
        id: "row-past",
        fileId: "file-1",
        rowIndex: 0,
        timestamp: "2026-02-16T08:00:00.000Z",
        values: {},
      },
      {
        id: "row-future",
        fileId: "file-1",
        rowIndex: 1,
        timestamp: "2029-01-01T08:00:00.000Z",
        values: {},
      },
      {
        id: "row-no-timestamp",
        fileId: "file-1",
        rowIndex: 2,
        values: {},
      },
    ],
  };

  const { data, summary } = sanitizeFutureHealthData(current, new Date("2026-02-17T12:00:00.000Z"));

  assert.equal(summary.changed, true);
  assert.equal(summary.removedDailyHealth, 1);
  assert.equal(summary.removedWorkouts, 1);
  assert.equal(summary.removedWorkoutDetails, 1);
  assert.equal(summary.removedRawRows, 1);
  assert.equal(summary.removedStreamRows, 1);
  assert.equal(summary.removedSeriesPoints, 1);

  assert.equal(data.dailyHealth.length, 1);
  assert.equal(data.workouts.length, 1);
  assert.equal(data.workoutDetails.length, 1);
  assert.equal(data.workoutDetails[0]?.streams[0]?.rows.length, 1);
  assert.equal(data.workoutDetails[0]?.heartRateSeries?.length, 1);
  assert.equal(data.healthRawRows.length, 2);
});
