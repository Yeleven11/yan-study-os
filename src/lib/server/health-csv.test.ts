import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultAppData } from "../constants";
import { importHealthFiles } from "./health-csv";

const aggregateCsv = [
  "Date/Time,Sleep Analysis [Total] (hr),Sleep Analysis [Core] (hr),Sleep Analysis [Deep] (hr),Sleep Analysis [REM] (hr),Sleep Analysis [Awake] (hr),Heart Rate Variability (ms),Resting Heart Rate (count/min),Walking + Running Distance (km),Step Count (count),Active Energy (kJ),Resting Energy (kJ)",
  "2026-02-10 00:00:00,8.1,4.2,1.5,1.9,0.5,62,52,7.3,10234,2550,7400",
].join("\n");

const workoutsCsv = [
  "Workout Type,Start,End,Duration,Active Energy (kJ),Resting Energy (kJ),Intensity (kcal/hr·kg),Max. Heart Rate (count/min),Avg. Heart Rate (count/min),Distance (km),Max. Speed (km/hr),Avg. Speed (km/hr),Flights Climbed,Elevation Ascended (m),Elevation Descended (m),Step Count,Step Cadence (spm),Swimming Stroke Count,Swim Cadence (spm),Lap Length (m),Swim Stroke Style,SWOLF Score,Water Salinity,Temperature (degC),Humidity (%),Location,",
  "Outdoor Walk,2026-02-10 14:32,2026-02-10 14:57,00:24:51,520,160,5.3,125,105.2,1.93,0,0,0,4.9,0,2135,85.9,0,0,0,,0,,6.7,68,Outdoor,",
].join("\n");

const hrCsv = [
  "Date/Time,Min (count/min),Max (count/min),Avg (count/min),Context,Source",
  "2026-02-10 14:33:18,97,97,97,,Watch",
  "2026-02-10 14:34:18,99,110,103,,Watch",
  "2026-02-10 14:35:18,100,114,107,,Watch",
].join("\n");

const distanceCsv = [
  "Date/Time,Walking + Running Distance (km),Source",
  "2026-02-10 14:33:18,0.07,Watch",
  "2026-02-10 14:34:18,0.08,Watch",
  "2026-02-10 14:35:18,0.06,Watch",
].join("\n");

const stepsCsv = [
  "Date/Time,Step Count (count),Source",
  "2026-02-10 14:33:18,108,Watch",
  "2026-02-10 14:34:18,103,Watch",
  "2026-02-10 14:35:18,111,Watch",
].join("\n");

const routeCsv = [
  "Timestamp,Latitude,Longitude,Altitude (m)",
  "2026-02-10T13:38:58Z,48.31,11.54,0",
].join("\n");

test("merges one workout split across multiple csv streams", () => {
  const seed = createDefaultAppData("Europe/Berlin");
  const imported = importHealthFiles(seed, [
    { filename: "HealthAutoExport-2026-02-10-2026-02-10.csv", csv: aggregateCsv },
    { filename: "Workouts-20260210_000000-20260210_235959.csv", csv: workoutsCsv },
    { filename: "Outdoor Walk-Heart Rate-20260210_143218.csv", csv: hrCsv },
    { filename: "Outdoor Walk-Walking + Running Distance-20260210_143218.csv", csv: distanceCsv },
    { filename: "Outdoor Walk-Step Count-20260210_143218.csv", csv: stepsCsv },
    { filename: "Outdoor Walk-Route-20260210_143218.csv", csv: routeCsv },
  ]);

  assert.equal(imported.nextData.workouts.length, 1);
  const workout = imported.nextData.workouts[0];
  assert.equal(workout.sourceWorkoutKey, "outdoor-walk-20260210_143200");
  assert.ok((workout.streamCount || 0) >= 4);
  assert.ok((workout.mergeConfidence || 0) > 0.85);
  assert.ok((workout.hrAvg || 0) > 0);

  const detail = imported.nextData.workoutDetails.find((item) => item.workoutId === workout.id);
  assert.ok(detail);
  assert.equal(detail?.workoutType, "recovery");
  assert.ok((detail?.distanceSeries?.length || 0) > 0);
  assert.ok((detail?.heartRateSeries?.length || 0) > 0);

  const ignoredRoute = imported.nextData.healthRawFiles.find((item) =>
    item.filename.includes("-Route-"),
  );
  assert.equal(ignoredRoute?.fileType, "ignored");
});

test("creates inferred workout when no summary file exists", () => {
  const seed = createDefaultAppData("Europe/Berlin");
  const imported = importHealthFiles(seed, [
    { filename: "Outdoor Walk-Heart Rate-20260210_143218.csv", csv: hrCsv },
    { filename: "Outdoor Walk-Walking + Running Distance-20260210_143218.csv", csv: distanceCsv },
  ]);

  assert.equal(imported.nextData.workouts.length, 1);
  assert.equal(imported.nextData.workouts[0].source, "health_import");
  assert.equal(imported.nextData.workouts[0].sourceWorkoutKey, "outdoor-walk-20260210_143218");
  assert.ok((imported.nextData.workouts[0].mergeConfidence || 0) >= 0.6);
});

test("duplicate import remains idempotent", () => {
  const seed = createDefaultAppData("Europe/Berlin");
  const first = importHealthFiles(seed, [
    { filename: "Outdoor Walk-Heart Rate-20260210_143218.csv", csv: hrCsv },
    { filename: "Outdoor Walk-Heart Rate-20260210_143218.csv", csv: hrCsv },
  ]);

  assert.equal(first.nextData.healthRawFiles.length, 1);

  const second = importHealthFiles(first.nextData, [
    { filename: "Outdoor Walk-Heart Rate-20260210_143218.csv", csv: hrCsv },
  ]);

  assert.equal(second.nextData.healthRawFiles.length, 1);
  assert.equal(second.nextData.workouts.length, first.nextData.workouts.length);
});
