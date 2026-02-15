import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultAppData } from "@/lib/constants";
import { applyPlannerRun, generatePlannerRun } from "@/lib/planner-engine";
import type { AppData } from "@/lib/types";

function createSeedData(): AppData {
  const data = createDefaultAppData("Europe/Berlin");
  data.dailyHealth = [
    {
      date: "2026-02-10",
      sleepHours: 7.8,
      sleepCoreHours: 4.2,
      sleepDeepHours: 1.1,
      sleepRemHours: 2.1,
      sleepAwakeHours: 0.4,
      sleepMidpointHour: 3.1,
      source: "manual",
      createdAt: "2026-02-10T00:00:00Z",
    },
    {
      date: "2026-02-11",
      sleepHours: 8.4,
      sleepCoreHours: 4.5,
      sleepDeepHours: 1.3,
      sleepRemHours: 2.2,
      sleepAwakeHours: 0.4,
      sleepMidpointHour: 3.0,
      source: "manual",
      createdAt: "2026-02-11T00:00:00Z",
    },
    {
      date: "2026-02-12",
      sleepHours: 6.9,
      sleepCoreHours: 3.9,
      sleepDeepHours: 0.8,
      sleepRemHours: 1.9,
      sleepAwakeHours: 0.3,
      sleepMidpointHour: 3.3,
      source: "manual",
      createdAt: "2026-02-12T00:00:00Z",
    },
  ];
  return data;
}

test("generates a constrained planner run with horizon and daily limits", () => {
  const data = createSeedData();
  data.plannerProfile.horizonDays = 7;
  const run = generatePlannerRun(data, {
    now: new Date("2026-02-12T12:00:00Z"),
  });

  assert.equal(run.days.length, 7);
  assert.equal(run.horizonDays, 7);
  assert.ok(run.summary.totalPlannedHours > 0);
  assert.ok(run.days.every((day) => day.plannedStudyHours <= day.availableStudyHours + 0.01));
});

test("weekend-disabled profile results in zero planned weekend hours", () => {
  const data = createSeedData();
  data.plannerProfile.allowWeekendStudy = false;
  const run = generatePlannerRun(data, {
    now: new Date("2026-02-13T12:00:00Z"), // Friday -> includes Saturday/Sunday
  });

  const weekendDays = run.days.filter((day) => {
    const weekday = new Date(`${day.date}T00:00:00`).getDay();
    return weekday === 0 || weekday === 6;
  });

  assert.ok(weekendDays.length >= 2);
  assert.ok(weekendDays.every((day) => day.plannedStudyHours === 0));
});

test("applyPlannerRun marks run applied and writes planned targets", () => {
  const data = createSeedData();
  const run = generatePlannerRun(data, {
    now: new Date("2026-02-12T12:00:00Z"),
  });
  data.plannerRuns.push(run);

  const updated = applyPlannerRun(data, run);
  const appliedRun = updated.plannerRuns.find((item) => item.id === run.id);

  assert.ok(appliedRun?.applied);
  assert.ok(typeof appliedRun?.appliedAt === "string");
  assert.ok(updated.plannedTargets.length >= run.days.length);
  assert.ok(updated.plannedTargets.every((target) => target.sourceRunId === run.id));
});
