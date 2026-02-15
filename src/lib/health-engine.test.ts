import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultAppData } from "./constants";
import type { AppData, DailyHealthFact } from "./types";
import { buildPerformanceInsights } from "./health-engine";

function createDataWithHealth(days: DailyHealthFact[]): AppData {
  const seed = createDefaultAppData("Europe/Berlin");
  return {
    ...seed,
    dailyHealth: days,
    workouts: [],
    studySessions: [],
    todos: [],
  };
}

test("sleep driver chooses debt in low-score scenarios", () => {
  const days: DailyHealthFact[] = [
    { date: "2026-02-08", sleepHours: 4.2, sleepCoreHours: 2.1, sleepDeepHours: 0.5, sleepRemHours: 1.0, sleepAwakeHours: 0.2, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-08T00:00:00Z" },
    { date: "2026-02-09", sleepHours: 4.0, sleepCoreHours: 2.0, sleepDeepHours: 0.4, sleepRemHours: 0.9, sleepAwakeHours: 0.2, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-09T00:00:00Z" },
    { date: "2026-02-10", sleepHours: 4.5, sleepCoreHours: 2.3, sleepDeepHours: 0.5, sleepRemHours: 1.0, sleepAwakeHours: 0.2, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-10T00:00:00Z" },
    { date: "2026-02-11", sleepHours: 4.4, sleepCoreHours: 2.2, sleepDeepHours: 0.4, sleepRemHours: 1.0, sleepAwakeHours: 0.2, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-11T00:00:00Z" },
    { date: "2026-02-12", sleepHours: 4.8, sleepCoreHours: 2.4, sleepDeepHours: 0.5, sleepRemHours: 1.1, sleepAwakeHours: 0.2, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-12T00:00:00Z" },
    { date: "2026-02-13", sleepHours: 5.0, sleepCoreHours: 2.6, sleepDeepHours: 0.6, sleepRemHours: 1.2, sleepAwakeHours: 0.2, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-13T00:00:00Z" },
    { date: "2026-02-14", sleepHours: 8.8, sleepCoreHours: 4.7, sleepDeepHours: 1.3, sleepRemHours: 2.0, sleepAwakeHours: 0.2, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-14T00:00:00Z" },
  ];

  const data = createDataWithHealth(days);
  const insights = buildPerformanceInsights(data, new Date("2026-02-14T12:00:00Z"));
  const readiness = insights.readinessByDate["2026-02-14"];

  assert.ok(readiness.sleepScore < 65);
  assert.equal(readiness.sleepDriverMode, "negative");
  assert.equal(readiness.sleepDriverKey, "debt");
  assert.match(readiness.sleepDriverSentence, /sleep debt/i);
});

test("sleep driver chooses duration in high-score scenarios", () => {
  const days: DailyHealthFact[] = [
    { date: "2026-02-08", sleepHours: 9.8, sleepCoreHours: 4.9, sleepDeepHours: 1.7, sleepRemHours: 2.7, sleepAwakeHours: 0.3, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-08T00:00:00Z" },
    { date: "2026-02-09", sleepHours: 9.7, sleepCoreHours: 4.8, sleepDeepHours: 1.7, sleepRemHours: 2.6, sleepAwakeHours: 0.3, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-09T00:00:00Z" },
    { date: "2026-02-10", sleepHours: 9.9, sleepCoreHours: 5.0, sleepDeepHours: 1.8, sleepRemHours: 2.7, sleepAwakeHours: 0.2, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-10T00:00:00Z" },
    { date: "2026-02-11", sleepHours: 10.1, sleepCoreHours: 5.1, sleepDeepHours: 1.8, sleepRemHours: 2.8, sleepAwakeHours: 0.2, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-11T00:00:00Z" },
    { date: "2026-02-12", sleepHours: 10.0, sleepCoreHours: 5.0, sleepDeepHours: 1.7, sleepRemHours: 2.8, sleepAwakeHours: 0.2, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-12T00:00:00Z" },
    { date: "2026-02-13", sleepHours: 10.2, sleepCoreHours: 5.1, sleepDeepHours: 1.8, sleepRemHours: 2.9, sleepAwakeHours: 0.2, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-13T00:00:00Z" },
    { date: "2026-02-14", sleepHours: 10.4, sleepCoreHours: 5.2, sleepDeepHours: 1.9, sleepRemHours: 2.9, sleepAwakeHours: 0.2, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-14T00:00:00Z" },
  ];

  const data = createDataWithHealth(days);
  const insights = buildPerformanceInsights(data, new Date("2026-02-14T12:00:00Z"));
  const readiness = insights.readinessByDate["2026-02-14"];

  assert.ok(readiness.sleepScore >= 65);
  assert.equal(readiness.sleepDriverMode, "positive");
  assert.equal(readiness.sleepDriverKey, "duration");
  assert.match(readiness.sleepDriverSentence, /duration/i);
});

test("schedule driver is not selected when midpoint signal is absent", () => {
  const days: DailyHealthFact[] = [
    { date: "2026-02-08", sleepHours: 7.2, sleepCoreHours: 4.2, sleepDeepHours: 0.8, sleepRemHours: 1.9, sleepAwakeHours: 0.3, source: "manual", createdAt: "2026-02-08T00:00:00Z" },
    { date: "2026-02-09", sleepHours: 7.0, sleepCoreHours: 4.1, sleepDeepHours: 0.8, sleepRemHours: 1.8, sleepAwakeHours: 0.3, source: "manual", createdAt: "2026-02-09T00:00:00Z" },
    { date: "2026-02-10", sleepHours: 7.3, sleepCoreHours: 4.2, sleepDeepHours: 0.8, sleepRemHours: 2.0, sleepAwakeHours: 0.3, source: "manual", createdAt: "2026-02-10T00:00:00Z" },
    { date: "2026-02-11", sleepHours: 7.1, sleepCoreHours: 4.1, sleepDeepHours: 0.8, sleepRemHours: 1.9, sleepAwakeHours: 0.3, source: "manual", createdAt: "2026-02-11T00:00:00Z" },
    { date: "2026-02-12", sleepHours: 7.0, sleepCoreHours: 4.0, sleepDeepHours: 0.8, sleepRemHours: 1.9, sleepAwakeHours: 0.3, source: "manual", createdAt: "2026-02-12T00:00:00Z" },
    { date: "2026-02-13", sleepHours: 7.2, sleepCoreHours: 4.1, sleepDeepHours: 0.8, sleepRemHours: 2.0, sleepAwakeHours: 0.3, source: "manual", createdAt: "2026-02-13T00:00:00Z" },
    { date: "2026-02-14", sleepHours: 7.1, sleepCoreHours: 4.1, sleepDeepHours: 0.8, sleepRemHours: 1.9, sleepAwakeHours: 0.3, source: "manual", createdAt: "2026-02-14T00:00:00Z" },
  ];

  const data = createDataWithHealth(days);
  const insights = buildPerformanceInsights(data, new Date("2026-02-14T12:00:00Z"));
  const readiness = insights.readinessByDate["2026-02-14"];
  assert.notEqual(readiness.sleepDriverKey, "schedule");
});

test("historical sleep score remains unchanged when adding today's extreme sleep", () => {
  const baseDays: DailyHealthFact[] = [
    { date: "2026-02-08", sleepHours: 7.8, sleepCoreHours: 4.4, sleepDeepHours: 0.9, sleepRemHours: 2.2, sleepAwakeHours: 0.3, sleepMidpointHour: 3.1, source: "manual", createdAt: "2026-02-08T00:00:00Z" },
    { date: "2026-02-09", sleepHours: 8.0, sleepCoreHours: 4.5, sleepDeepHours: 0.9, sleepRemHours: 2.3, sleepAwakeHours: 0.3, sleepMidpointHour: 3.1, source: "manual", createdAt: "2026-02-09T00:00:00Z" },
    { date: "2026-02-10", sleepHours: 7.6, sleepCoreHours: 4.3, sleepDeepHours: 0.8, sleepRemHours: 2.2, sleepAwakeHours: 0.3, sleepMidpointHour: 3.1, source: "manual", createdAt: "2026-02-10T00:00:00Z" },
    { date: "2026-02-11", sleepHours: 8.2, sleepCoreHours: 4.6, sleepDeepHours: 0.9, sleepRemHours: 2.4, sleepAwakeHours: 0.3, sleepMidpointHour: 3.1, source: "manual", createdAt: "2026-02-11T00:00:00Z" },
    { date: "2026-02-12", sleepHours: 7.9, sleepCoreHours: 4.5, sleepDeepHours: 0.9, sleepRemHours: 2.3, sleepAwakeHours: 0.2, sleepMidpointHour: 3.1, source: "manual", createdAt: "2026-02-12T00:00:00Z" },
    { date: "2026-02-13", sleepHours: 8.1, sleepCoreHours: 4.6, sleepDeepHours: 0.9, sleepRemHours: 2.4, sleepAwakeHours: 0.2, sleepMidpointHour: 3.1, source: "manual", createdAt: "2026-02-13T00:00:00Z" },
  ];

  const withSixDays = createDataWithHealth(baseDays);
  const scoreBefore = buildPerformanceInsights(
    withSixDays,
    new Date("2026-02-13T12:00:00Z"),
  ).readinessByDate["2026-02-13"].sleepScore;

  const withExtremeToday = createDataWithHealth([
    ...baseDays,
    {
      date: "2026-02-14",
      sleepHours: 12,
      sleepCoreHours: 5.5,
      sleepDeepHours: 1.3,
      sleepRemHours: 4.2,
      sleepAwakeHours: 0.1,
      sleepMidpointHour: 3.1,
      source: "manual",
      createdAt: "2026-02-14T00:00:00Z",
    },
  ]);
  const scoreAfter = buildPerformanceInsights(
    withExtremeToday,
    new Date("2026-02-14T12:00:00Z"),
  ).readinessByDate["2026-02-13"].sleepScore;

  assert.equal(scoreAfter, scoreBefore);
});
