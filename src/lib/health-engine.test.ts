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
    { date: "2026-02-14", sleepHours: 6.2, sleepCoreHours: 3.0, sleepDeepHours: 0.6, sleepRemHours: 1.6, sleepAwakeHours: 0.4, sleepMidpointHour: 3.0, source: "manual", createdAt: "2026-02-14T00:00:00Z" },
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

test("sleep score with present but severe sleep data never falls below 30", () => {
  const days: DailyHealthFact[] = [
    {
      date: "2026-02-14",
      sleepHours: 3.6,
      sleepCoreHours: 2.1,
      sleepDeepHours: 0.2,
      sleepRemHours: 0.8,
      sleepAwakeHours: 0.5,
      sleepMidpointHour: 3.6,
      source: "manual",
      createdAt: "2026-02-14T00:00:00Z",
    },
  ];

  const data = createDataWithHealth(days);
  const insights = buildPerformanceInsights(data, new Date("2026-02-14T12:00:00Z"));
  const readiness = insights.readinessByDate["2026-02-14"];

  assert.ok(readiness.sleepScore >= 30);
});

test("missing sleep data yields sleep score of zero", () => {
  const seed = createDefaultAppData("Europe/Berlin");
  const data: AppData = {
    ...seed,
    dailyHealth: [],
    workouts: [
      {
        id: "manual-workout-1",
        type: "cardio",
        startedAt: "2026-02-14T09:00:00Z",
        endedAt: "2026-02-14T09:30:00Z",
        durationMin: 30,
        source: "manual",
        createdAt: "2026-02-14T09:30:00Z",
      },
    ],
    studySessions: [],
    todos: [],
  };
  const insights = buildPerformanceInsights(data, new Date("2026-02-14T12:00:00Z"));
  const readiness = insights.readinessByDate["2026-02-14"];

  assert.equal(insights.usingSampleData, false);
  assert.equal(readiness.sleepScore, 0);
  assert.match(readiness.sleepDriverSentence, /no sleep data/i);
});

test("4h then 12h then 8h sequence recovers materially by day 3", () => {
  const days: DailyHealthFact[] = [
    {
      date: "2026-02-13",
      sleepHours: 4.0,
      sleepCoreHours: 2.0,
      sleepDeepHours: 0.5,
      sleepRemHours: 1.2,
      sleepAwakeHours: 0.3,
      sleepMidpointHour: 3.0,
      source: "manual",
      createdAt: "2026-02-13T00:00:00Z",
    },
    {
      date: "2026-02-14",
      sleepHours: 12.0,
      sleepCoreHours: 5.7,
      sleepDeepHours: 1.4,
      sleepRemHours: 4.5,
      sleepAwakeHours: 0.4,
      sleepMidpointHour: 3.0,
      source: "manual",
      createdAt: "2026-02-14T00:00:00Z",
    },
    {
      date: "2026-02-15",
      sleepHours: 8.0,
      sleepCoreHours: 4.5,
      sleepDeepHours: 1.1,
      sleepRemHours: 2.1,
      sleepAwakeHours: 0.3,
      sleepMidpointHour: 3.1,
      source: "manual",
      createdAt: "2026-02-15T00:00:00Z",
    },
  ];

  const data = createDataWithHealth(days);
  const insights = buildPerformanceInsights(data, new Date("2026-02-15T12:00:00Z"));
  const day1 = insights.readinessByDate["2026-02-13"].sleepScore;
  const day3 = insights.readinessByDate["2026-02-15"].sleepScore;

  assert.ok(day3 > day1 + 20);
  assert.ok(day3 >= 60);
});

test("three consecutive target-plus nights strongly reduce debt and push score over 80", () => {
  const days: DailyHealthFact[] = [
    {
      date: "2026-02-12",
      sleepHours: 9.1,
      sleepCoreHours: 4.9,
      sleepDeepHours: 1.6,
      sleepRemHours: 2.3,
      sleepAwakeHours: 0.2,
      sleepMidpointHour: 3.0,
      source: "manual",
      createdAt: "2026-02-12T00:00:00Z",
    },
    {
      date: "2026-02-13",
      sleepHours: 9.0,
      sleepCoreHours: 4.8,
      sleepDeepHours: 1.5,
      sleepRemHours: 2.3,
      sleepAwakeHours: 0.2,
      sleepMidpointHour: 3.0,
      source: "manual",
      createdAt: "2026-02-13T00:00:00Z",
    },
    {
      date: "2026-02-14",
      sleepHours: 9.2,
      sleepCoreHours: 4.9,
      sleepDeepHours: 1.5,
      sleepRemHours: 2.5,
      sleepAwakeHours: 0.2,
      sleepMidpointHour: 3.0,
      source: "manual",
      createdAt: "2026-02-14T00:00:00Z",
    },
  ];

  const data = createDataWithHealth(days);
  const insights = buildPerformanceInsights(data, new Date("2026-02-14T12:00:00Z"));
  const readiness = insights.readinessByDate["2026-02-14"];

  assert.ok(readiness.sleepScore >= 80);
  assert.ok(readiness.sleepDebtHours <= 0.5);
});
