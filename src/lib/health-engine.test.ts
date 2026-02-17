import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultAppData } from "./constants";
import { buildPerformanceInsights } from "./health-engine";
import type { AppData, DailyHealthFact, StudySession, WorkoutEntry } from "./types";

function addDays(dateKey: string, offset: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function makeHealthDay(date: string, patch: Partial<DailyHealthFact> = {}): DailyHealthFact {
  return {
    date,
    sleepHours: 8.2,
    sleepAsleepHours: 8.2,
    sleepInBedHours: 8.8,
    sleepCoreHours: 4.1,
    sleepDeepHours: 1.5,
    sleepRemHours: 2.1,
    sleepAwakeHours: 0.3,
    sleepMidpointHour: 3.1,
    sleepBedtimeHour: 23.0,
    hrvMs: 75,
    restingHrBpm: 52,
    respiratoryRateBpm: 13.5,
    steps: 9000,
    activeEnergyKj: 1800,
    source: "manual",
    createdAt: `${date}T00:00:00Z`,
    ...patch,
  };
}

function makeBaseData(startDate: string, totalDays: number): AppData {
  const seed = createDefaultAppData("Europe/Berlin");
  const dailyHealth: DailyHealthFact[] = [];

  for (let i = 0; i < totalDays; i += 1) {
    dailyHealth.push(makeHealthDay(addDays(startDate, i)));
  }

  return {
    ...seed,
    dailyHealth,
    workouts: [],
    studySessions: [],
    todos: [],
    exams: [],
  };
}

function addWorkout(
  data: AppData,
  {
    id,
    date,
    durationMin,
    avgHr,
    distanceKm,
  }: {
    id: string;
    date: string;
    durationMin: number;
    avgHr: number;
    distanceKm?: number;
  },
): void {
  const startedAt = `${date}T08:00:00Z`;
  const ended = new Date(startedAt);
  ended.setUTCMinutes(ended.getUTCMinutes() + durationMin);

  const workout: WorkoutEntry = {
    id,
    type: "cardio",
    workoutNameRaw: "Outdoor Run",
    startedAt,
    endedAt: ended.toISOString(),
    durationMin,
    distanceKm,
    avgHeartRate: avgHr,
    hrAvg: avgHr,
    hrMin: Math.max(60, avgHr - 35),
    hrMax: avgHr + 20,
    source: "manual",
    createdAt: ended.toISOString(),
  };

  data.workouts.push(workout);
}

function addStudySession(
  data: AppData,
  {
    id,
    date,
    startHour,
    durationMin,
  }: {
    id: string;
    date: string;
    startHour: number;
    durationMin: number;
  },
): void {
  const started = new Date(`${date}T00:00:00Z`);
  started.setUTCHours(startHour, 0, 0, 0);
  const ended = new Date(started);
  ended.setUTCMinutes(ended.getUTCMinutes() + durationMin);

  const session: StudySession = {
    id,
    subjectId: "math_aa_hl",
    startedAt: started.toISOString(),
    endedAt: ended.toISOString(),
    durationSec: durationMin * 60,
    createdAt: started.toISOString(),
  };

  data.studySessions.push(session);
}

test("recovery decreases when acute load spikes under stable sleep/autonomic inputs", () => {
  const start = "2026-01-01";
  const totalDays = 26;
  const data = makeBaseData(start, totalDays);

  const lowLoadDay = addDays(start, totalDays - 2);
  const highLoadDay = addDays(start, totalDays - 1);

  addWorkout(data, {
    id: "low-load",
    date: lowLoadDay,
    durationMin: 20,
    avgHr: 120,
    distanceKm: 3,
  });
  addWorkout(data, {
    id: "high-load",
    date: highLoadDay,
    durationMin: 85,
    avgHr: 166,
    distanceKm: 15,
  });
  addStudySession(data, {
    id: "high-load-study-a",
    date: highLoadDay,
    startHour: 15,
    durationMin: 240,
  });
  addStudySession(data, {
    id: "high-load-study-b",
    date: highLoadDay,
    startHour: 21,
    durationMin: 180,
  });

  const insights = buildPerformanceInsights(data, new Date(`${highLoadDay}T12:00:00Z`));
  const low = insights.scientificByDate[lowLoadDay];
  const high = insights.scientificByDate[highLoadDay];

  assert.ok(low.recoveryScore > high.recoveryScore);
  assert.ok(high.physicalStrain > low.physicalStrain);
});

test("under-studying boost raises mental target when recovery is high", () => {
  const start = "2026-01-01";
  const totalDays = 32;

  const underStudied = makeBaseData(start, totalDays);

  for (let i = 0; i < totalDays - 3; i += 1) {
    const date = addDays(start, i);
    addStudySession(underStudied, {
      id: `under-baseline-${i}`,
      date,
      startHour: 16,
      durationMin: 120,
    });
  }

  const dayMinusOne = addDays(start, totalDays - 1);

  const underTodayIndex = underStudied.dailyHealth.findIndex((item) => item.date === dayMinusOne);
  underStudied.dailyHealth[underTodayIndex] = makeHealthDay(dayMinusOne, {
    sleepHours: 9.0,
    sleepAsleepHours: 9.0,
    sleepInBedHours: 9.4,
    hrvMs: 95,
    restingHrBpm: 48,
    respiratoryRateBpm: 12.5,
  });

  const under = buildPerformanceInsights(underStudied, new Date(`${dayMinusOne}T12:00:00Z`));
  const underToday = under.todayScientific;

  assert.ok(underToday.components.gUnder > 1);
  assert.ok(underToday.components.gate > 0.7);
  assert.ok(underToday.mentalStrain < 5);
  assert.ok(
    (under.todayRecommendation.mentalTargetHigh || 0) >
      (under.todayRecommendation.mentalTargetLow || 0),
  );
});

test("missing stage data keeps sleep score bounded but lowers confidence", () => {
  const start = "2026-01-01";
  const totalDays = 24;

  const withStages = makeBaseData(start, totalDays);
  const withoutStages = makeBaseData(start, totalDays);

  const targetDay = addDays(start, totalDays - 1);
  const targetIndex = withoutStages.dailyHealth.findIndex((item) => item.date === targetDay);

  withoutStages.dailyHealth[targetIndex] = makeHealthDay(targetDay, {
    sleepDeepHours: undefined,
    sleepRemHours: undefined,
    sleepCoreHours: undefined,
  });

  const full = buildPerformanceInsights(withStages, new Date(`${targetDay}T12:00:00Z`));
  const missing = buildPerformanceInsights(withoutStages, new Date(`${targetDay}T12:00:00Z`));

  const scoreDelta = Math.abs(full.todayScientific.sleepScore - missing.todayScientific.sleepScore);

  assert.ok(scoreDelta <= 12);
  assert.ok(full.todayScientific.confidence.sleep > missing.todayScientific.confidence.sleep);
  assert.ok(missing.todayScientific.fallbackFlags.includes("sleep_stage_neutral"));
});

test("exam pressure adds mental background load and lowers mental recovery", () => {
  const start = "2026-01-01";
  const totalDays = 22;

  const control = makeBaseData(start, totalDays);
  const pressured = makeBaseData(start, totalDays);

  const today = addDays(start, totalDays - 1);
  const tomorrow = addDays(today, 1);

  pressured.exams = [
    {
      id: "exam-1",
      subjectId: "physics_hl",
      title: "Physics HL",
      paper: "Paper 2",
      startsAt: `${tomorrow}T09:00:00Z`,
    },
  ];

  const controlInsights = buildPerformanceInsights(control, new Date(`${today}T12:00:00Z`));
  const pressureInsights = buildPerformanceInsights(pressured, new Date(`${today}T12:00:00Z`));

  assert.ok(pressureInsights.todayScientific.pressure > controlInsights.todayScientific.pressure);
  assert.ok(pressureInsights.todayScientific.mentalRawLoad > controlInsights.todayScientific.mentalRawLoad);
  assert.ok(
    pressureInsights.todayScientific.mentalRecovery < controlInsights.todayScientific.mentalRecovery,
  );
});

test("TIB fallback imputes sleep when TST is absent", () => {
  const start = "2026-01-01";
  const totalDays = 18;
  const data = makeBaseData(start, totalDays);

  const today = addDays(start, totalDays - 1);
  const targetIndex = data.dailyHealth.findIndex((item) => item.date === today);

  data.dailyHealth[targetIndex] = makeHealthDay(today, {
    sleepHours: 0,
    sleepAsleepHours: undefined,
    sleepInBedHours: 8.0,
  });

  const insights = buildPerformanceInsights(data, new Date(`${today}T12:00:00Z`));

  assert.ok(insights.todayScientific.sleepHours > 6);
  assert.ok(insights.todayScientific.sleepScore > 40);
  assert.ok(insights.todayScientific.fallbackFlags.includes("sleep_tst_from_tib"));
});
