import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultAppData } from "../constants";
import { importMobileSyncPayload } from "./health-mobile";
import type { MobileSyncRequest } from "../types";

function buildPayload(batchId: string): MobileSyncRequest {
  return {
    schemaVersion: 1,
    batchId,
    generatedAt: "2026-02-16T08:00:00.000Z",
    device: {
      deviceId: "iphone-yan",
      appVersion: "1.0.0",
      osVersion: "iOS 26.2",
      timezone: "Europe/Berlin",
    },
    settings: {
      syncIntervalMinutes: 30,
    },
    dailyHealth: [
      {
        date: "2026-02-15",
        sleepHours: 7.8,
        sleepBedtimeAt: "2026-02-14T23:12:00+01:00",
        sleepWakeupAt: "2026-02-15T07:05:00+01:00",
        hrvMs: 63,
        restingHrBpm: 51,
        steps: 12000,
        walkRunDistanceKm: 8.2,
        activeEnergyKj: 2400,
      },
    ],
    workouts: [
      {
        hkWorkoutUuid: "D307C4CB-147B-4908-ACD2-7863AB42AA11",
        workoutType: "Outdoor Run",
        startedAt: "2026-02-15T06:10:00.000Z",
        endedAt: "2026-02-15T06:55:00.000Z",
        durationMin: 45,
        distanceKm: 9.4,
        activeEnergyKj: 2812,
        avgHeartRate: 154,
        hrMin: 118,
        hrMax: 178,
        hrAvg: 154,
        stepCount: 8120,
        streams: {
          heartRateSeries: [
            { timestamp: "2026-02-15T06:10:30.000Z", value: 128 },
            { timestamp: "2026-02-15T06:11:30.000Z", value: 132 },
          ],
          distanceSeries: [
            { timestamp: "2026-02-15T06:11:00.000Z", value: 0.2 },
            { timestamp: "2026-02-15T06:12:00.000Z", value: 0.4 },
          ],
        },
      },
    ],
  };
}

test("imports mobile sync payload into daily health and workouts", () => {
  const seed = createDefaultAppData("Europe/Berlin");
  const payload = buildPayload("batch-1");

  const imported = importMobileSyncPayload(seed, payload);

  assert.equal(imported.summary.duplicateBatch, false);
  assert.equal(imported.summary.importedHealthDays, 1);
  assert.equal(imported.summary.importedWorkouts, 1);
  assert.equal(imported.nextData.workouts.length, 1);
  assert.equal(imported.nextData.workoutDetails.length, 1);
  assert.equal(imported.nextData.dailyHealth[0]?.sleepBedtimeAt, "2026-02-14T22:12:00.000Z");
  assert.equal(imported.nextData.dailyHealth[0]?.sleepWakeupAt, "2026-02-15T06:05:00.000Z");
  assert.equal(imported.nextData.healthRawFiles[0]?.fileType, "mobile_sync");
  assert.ok((imported.nextData.workoutDetails[0]?.heartRateSeries?.length || 0) > 0);
});

test("skips duplicate mobile batch by hash", () => {
  const seed = createDefaultAppData("Europe/Berlin");
  const payload = buildPayload("batch-duplicate");

  const first = importMobileSyncPayload(seed, payload);
  const second = importMobileSyncPayload(first.nextData, payload);

  assert.equal(first.summary.duplicateBatch, false);
  assert.equal(second.summary.duplicateBatch, true);
  assert.equal(second.summary.filesSkipped, 1);
  assert.equal(second.nextData.workouts.length, 1);
  assert.equal(second.nextData.healthRawFiles.length, 1);
});

test("applies workout deletions from mobile payload", () => {
  const seed = createDefaultAppData("Europe/Berlin");
  const payload = buildPayload("batch-delete-a");
  const imported = importMobileSyncPayload(seed, payload);

  const deletePayload: MobileSyncRequest = {
    ...buildPayload("batch-delete-b"),
    dailyHealth: [],
    workouts: [],
    deletions: [
      {
        sampleType: "HKWorkoutType",
        uuid: "D307C4CB-147B-4908-ACD2-7863AB42AA11",
        deletedAt: "2026-02-16T12:00:00.000Z",
      },
    ],
  };

  const afterDelete = importMobileSyncPayload(imported.nextData, deletePayload);

  assert.equal(afterDelete.summary.duplicateBatch, false);
  assert.equal(afterDelete.nextData.workouts.length, 0);
  assert.equal(afterDelete.nextData.workoutDetails.length, 0);
});

test("drops future-dated records and ignores future incoming payload data", () => {
  const seed = createDefaultAppData("Europe/Berlin");
  seed.dailyHealth.push({
    date: "2120-01-01",
    sleepHours: 8,
    source: "health_import",
    createdAt: "2120-01-01T08:00:00.000Z",
  });
  seed.workouts.push({
    id: "future-workout-seed",
    sourceWorkoutKey: "future-seed",
    type: "cardio",
    startedAt: "2120-01-01T08:00:00.000Z",
    endedAt: "2120-01-01T09:00:00.000Z",
    durationMin: 60,
    source: "health_import",
    createdAt: "2120-01-01T09:00:00.000Z",
  });
  seed.workoutDetails.push({
    workoutId: "future-workout-seed",
    workoutKey: "future-seed",
    workoutType: "cardio",
    startedAt: "2120-01-01T08:00:00.000Z",
    endedAt: "2120-01-01T09:00:00.000Z",
    durationMin: 60,
    mergeConfidence: 0.9,
    streamCount: 1,
    sourceFiles: ["seed.json"],
    streams: [],
    heartRateSeries: [],
    distanceSeries: [],
    stepSeries: [],
    activeEnergySeries: [],
    restingEnergySeries: [],
  });

  const payload = buildPayload("batch-future-filter");
  payload.dailyHealth?.push({
    date: "2120-01-01",
    sleepHours: 8.3,
  });
  payload.workouts?.push({
    hkWorkoutUuid: "11111111-1111-1111-1111-111111111111",
    workoutType: "Outdoor Run",
    startedAt: "2120-01-01T08:00:00.000Z",
    endedAt: "2120-01-01T08:50:00.000Z",
    durationMin: 50,
  });

  const imported = importMobileSyncPayload(seed, payload);

  assert.equal(imported.summary.importedHealthDays, 1);
  assert.equal(imported.summary.importedWorkouts, 1);
  assert.equal(
    imported.nextData.dailyHealth.some((item) => item.date >= "2100-01-01"),
    false,
  );
  assert.equal(
    imported.nextData.workouts.some((item) => item.startedAt.startsWith("2120-")),
    false,
  );
  assert.equal(
    imported.nextData.workoutDetails.some((item) => item.startedAt.startsWith("2120-")),
    false,
  );
});
