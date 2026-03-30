import assert from "node:assert/strict";
import test from "node:test";
import {
  computeStudyStreakDays,
  getActiveElapsedSeconds,
  mergeCountdownBaselines,
} from "./selectors";
import { parseGoalsDraft } from "./actions";

test("selectors compute streak and timer elapsed deterministically", () => {
  const now = new Date("2026-03-10T12:00:00Z");
  const sessions = [
    { startedAt: "2026-03-10T07:00:00Z", durationSec: 5600 },
    { startedAt: "2026-03-09T07:00:00Z", durationSec: 6200 },
    { startedAt: "2026-03-08T07:00:00Z", durationSec: 500 },
  ] as Array<{ startedAt: string; durationSec: number }>;

  assert.equal(computeStudyStreakDays(sessions as never[], "UTC", now), 2);

  const elapsed = getActiveElapsedSeconds(
    {
      subjectId: "math_aa_hl",
      startedAt: "2026-03-10T11:00:00Z",
      elapsedBeforePauseSec: 120,
      isRunning: true,
      resumedAt: "2026-03-10T11:59:00Z",
    },
    new Date("2026-03-10T12:00:30Z").getTime(),
  );
  assert.equal(elapsed, 210);
});

test("actions and selectors modules validate goals and baseline pruning", () => {
  const parsed = parseGoalsDraft({
    sleepHoursTarget: "8",
    baselineStudyHours: "4",
    weeklyWorkoutTarget: "5",
    weekdayWakeTime: "07:00",
    weekendWakeTime: "08:30",
    preferredBedtimeStart: "22:30",
    preferredBedtimeEnd: "23:30",
    ageYears: "17",
  });
  assert.ok(parsed.parsed);

  const kept = mergeCountdownBaselines(
    [{ id: "exam-1", startsAt: "2026-04-01T09:00:00Z" } as never],
    { "exam-1": 3600, stale: 1000 },
    new Date("2026-03-31T09:00:00Z").getTime(),
  );
  assert.ok(kept["exam-1"] > 0);
  assert.equal(Object.hasOwn(kept, "stale"), false);
});
