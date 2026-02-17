import test from "node:test";
import assert from "node:assert/strict";
import { withWorkoutSeriesFallback } from "./workout-detail";
import type { WorkoutDetail, WorkoutEntry } from "../types";

function makeDetail(): WorkoutDetail {
  return {
    workoutId: "workout-1",
    workoutKey: "workout-key-1",
    workoutType: "cardio",
    startedAt: "2026-01-12T23:19:00.000Z",
    endedAt: "2026-01-12T23:49:00.000Z",
    durationMin: 30,
    mergeConfidence: 0.95,
    streamCount: 1,
    sourceFiles: ["mobile-sync-batch.json"],
    streams: [],
    heartRateSeries: [],
    distanceSeries: [],
    stepSeries: [],
    activeEnergySeries: [],
    restingEnergySeries: [],
  };
}

test("rebuilds heart-rate series from stored heart_rate stream rows", () => {
  const detail = makeDetail();
  detail.streams = [
    {
      id: "stream-heart-1",
      workoutKey: detail.workoutKey,
      streamType: "heart_rate",
      sourceFile: "mobile-sync-batch.json",
      rows: [
        { timestamp: "2026-01-12T23:20:00.000Z", value: 162 },
        { timestamp: "2026-01-12T23:25:00.000Z", value: 167 },
      ],
    },
  ];

  const enriched = withWorkoutSeriesFallback(detail, null);

  assert.ok(enriched);
  assert.equal(enriched?.heartRateSeries?.length, 2);
  assert.equal(enriched?.heartRateSeries?.[0]?.value, 162);
  assert.equal(enriched?.heartRateSeries?.[1]?.value, 167);
});

test("falls back to summary heart-rate point when streams are unavailable", () => {
  const workout: WorkoutEntry = {
    id: "workout-2",
    sourceWorkoutKey: "workout-key-2",
    type: "cardio",
    startedAt: "2026-01-12T23:19:00.000Z",
    endedAt: "2026-01-12T23:49:00.000Z",
    durationMin: 30,
    hrMin: 140,
    hrMax: 182,
    hrAvg: 165,
    source: "health_import",
    createdAt: "2026-01-13T00:00:00.000Z",
  };

  const enriched = withWorkoutSeriesFallback(null, workout);

  assert.ok(enriched);
  assert.equal(enriched?.heartRateSeries?.length, 1);
  assert.equal(enriched?.heartRateSeries?.[0]?.avg, 165);
  assert.equal(enriched?.heartRateSeries?.[0]?.min, 140);
  assert.equal(enriched?.heartRateSeries?.[0]?.max, 182);
});
