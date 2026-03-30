import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMobileSyncRequest } from "./health-mobile-contract";

const iosPayloadV1 = {
  schemaVersion: 1,
  batchId: "ios-v1-batch",
  generatedAt: "2026-02-16T08:00:00.000Z",
  device: {
    deviceId: "iphone-yan",
    appVersion: "1.0.0",
    osVersion: "iOS 26.2",
    timezone: "Europe/Berlin",
  },
  dailyHealth: [{ date: "2026-02-15", sleepHours: 8.1 }],
  workouts: [
    {
      hkWorkoutUuid: "A307C4CB-147B-4908-ACD2-7863AB42AA11",
      workoutType: "Outdoor Run",
      startedAt: "2026-02-15T06:10:00.000Z",
      endedAt: "2026-02-15T06:55:00.000Z",
      durationMin: 45,
      streams: {
        heartRateSeries: [{ timestamp: "2026-02-15T06:10:30.000Z", value: 128 }],
      },
    },
  ],
};

test("mobile contract normalizes iOS schema v1 payload", () => {
  const normalized = normalizeMobileSyncRequest(iosPayloadV1);
  assert.ok(normalized.payload);
  assert.equal(normalized.payload?.schemaVersion, 1);
  assert.equal(normalized.payload?.dailyHealth?.[0]?.date, "2026-02-15");
  assert.equal(
    normalized.payload?.workouts?.[0]?.streams?.heartRateSeries?.[0]?.timestamp,
    "2026-02-15T06:10:30.000Z",
  );
});

test("mobile contract requires idempotencyKey for schema v2", () => {
  const normalized = normalizeMobileSyncRequest({ ...iosPayloadV1, schemaVersion: 2 });
  assert.equal(normalized.payload, null);
  assert.match(normalized.error || "", /idempotencyKey/);
});

test("mobile contract accepts schema v2 with idempotency key", () => {
  const normalized = normalizeMobileSyncRequest({
    ...iosPayloadV1,
    schemaVersion: 2,
    idempotencyKey: "ios-device-abc-001",
  });

  assert.ok(normalized.payload);
  assert.equal(normalized.payload?.schemaVersion, 2);
  assert.equal(normalized.payload?.idempotencyKey, "ios-device-abc-001");
});
