import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createDefaultAppData } from "../constants";
import { importHealthFiles } from "./health-csv";
import { normalizeHealthIngestRequest } from "./health-ingest-request";

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

const workoutsUuidCsv = [
  "Name,Start Date,End Date,Duration (s),Total Energy (kcal),Avg Heart Rate (count/min),Distance (km)",
  "Outdoor Run,2026-02-11 07:10:00,2026-02-11 07:55:00,2700,520,151,8.4",
  "Outdoor Walk,2026-02-12 18:00:00,2026-02-12 18:30:00,1800,220,98,2.6",
].join("\n");

const workoutsBpmCsv = [
  "Workout Name,Start Time,End Time,Duration (s),Total Energy (kcal),Average Heart Rate (bpm),Min Heart Rate (bpm),Max Heart Rate (bpm),Total Distance (km),Steps",
  "Outdoor Walk,2026-02-10 14:32:00,2026-02-10 14:57:00,1500,125,105,97,125,1.93,2135",
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
  assert.equal(workout.workoutNameRaw, "Outdoor Walk");
  assert.equal(workout.workoutDisplayLabel, "1.9 km Outdoor Walk");
  assert.ok((workout.streamCount || 0) >= 4);
  assert.ok((workout.mergeConfidence || 0) > 0.85);
  assert.ok((workout.hrAvg || 0) > 0);

  const detail = imported.nextData.workoutDetails.find((item) => item.workoutId === workout.id);
  assert.ok(detail);
  assert.equal(detail?.workoutType, "recovery");
  assert.equal(detail?.workoutDisplayLabel, "1.9 km Outdoor Walk");
  assert.ok((detail?.distanceSeries?.length || 0) > 0);
  assert.ok((detail?.heartRateSeries?.length || 0) > 0);

  const ignoredRoute = imported.nextData.healthRawFiles.find((item) =>
    item.filename.includes("-Route-"),
  );
  assert.equal(ignoredRoute?.fileType, "ignored");
  assert.equal(imported.summary.reconcile.canonicalWorkoutCount, 1);
  assert.equal(imported.summary.reconcile.streamBucketCount, 1);
  assert.equal(imported.summary.reconcile.inferredWorkoutCount, 0);
  assert.equal(imported.summary.reconcile.routeFilesIgnored, 1);
  assert.ok(imported.summary.reconcile.linkedStreams >= 3);
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
  assert.equal(imported.nextData.workouts[0].workoutNameRaw, "Outdoor Walk");
  assert.equal(imported.nextData.workouts[0].workoutDisplayLabel, "0.2 km Outdoor Walk");
  assert.ok((imported.nextData.workouts[0].mergeConfidence || 0) >= 0.6);
  assert.equal(imported.summary.reconcile.inferredWorkoutCount, 1);
  assert.equal(imported.summary.reconcile.canonicalWorkoutCount, 0);
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
  assert.equal(second.summary.reconcile.duplicateFilesIgnored, 1);
});

test("parses workouts-uuid manual export format as workout summary", () => {
  const seed = createDefaultAppData("Europe/Berlin");
  const imported = importHealthFiles(seed, [
    {
      filename: "workouts-C803532A-DAE5-4CC3-AD5E-30C2A0FFD8E0.csv",
      csv: workoutsUuidCsv,
    },
  ]);

  assert.equal(imported.summary.filesProcessed, 1);
  assert.equal(imported.summary.importedWorkouts, 2);
  assert.equal(imported.nextData.workouts.length, 2);
  assert.equal(imported.nextData.healthRawFiles[0]?.fileType, "workout_summary");
  assert.equal(imported.nextData.workouts[0]?.workoutNameRaw, "Outdoor Run");
  assert.ok((imported.nextData.workouts[0]?.distanceKm || 0) > 8);

  const firstWorkoutId = imported.nextData.workouts[0]?.id;
  const firstDetail = imported.nextData.workoutDetails.find(
    (item) => item.workoutId === firstWorkoutId,
  );

  assert.ok(firstDetail);
  assert.ok((firstDetail?.heartRateSeries?.length || 0) > 0);
  assert.ok((firstDetail?.distanceSeries?.length || 0) > 0);
});

test("parses workout summary with bpm heart-rate aliases", () => {
  const seed = createDefaultAppData("Europe/Berlin");
  const imported = importHealthFiles(seed, [
    {
      filename: "workouts-C803532A-DAE5-4CC3-AD5E-30C2A0FFD8E0.csv",
      csv: workoutsBpmCsv,
    },
  ]);

  assert.equal(imported.summary.importedWorkouts, 1);
  const workout = imported.nextData.workouts[0];
  assert.ok(workout);
  assert.equal(workout?.workoutNameRaw, "Outdoor Walk");
  assert.equal(workout?.hrAvg, 105);
  assert.equal(workout?.hrMin, 97);
  assert.equal(workout?.hrMax, 125);
});

test("reprocesses duplicate hash when previous file was unknown", () => {
  const seed = createDefaultAppData("Europe/Berlin");
  const filename = "workouts-C803532A-DAE5-4CC3-AD5E-30C2A0FFD8E0.csv";
  const hash = createHash("sha256").update(`${filename}\n${workoutsBpmCsv}`).digest("hex");

  seed.healthRawFiles.push({
    id: hash.slice(0, 24),
    hash,
    filename,
    fileType: "unknown",
    rowCount: 1,
    importedAt: "2026-02-01T00:00:00.000Z",
  });

  const imported = importHealthFiles(seed, [{ filename, csv: workoutsBpmCsv }]);
  assert.equal(imported.summary.importedWorkouts, 1);
  const file = imported.nextData.healthRawFiles.find((item) => item.hash === hash);
  assert.equal(file?.fileType, "workout_summary");
});

test("summary re-import does not downgrade existing rich workout detail series", () => {
  const seed = createDefaultAppData("Europe/Berlin");
  const first = importHealthFiles(seed, [
    { filename: "Workouts-20260210_000000-20260210_235959.csv", csv: workoutsCsv },
    { filename: "Outdoor Walk-Heart Rate-20260210_143218.csv", csv: hrCsv },
    { filename: "Outdoor Walk-Walking + Running Distance-20260210_143218.csv", csv: distanceCsv },
    { filename: "Outdoor Walk-Step Count-20260210_143218.csv", csv: stepsCsv },
  ]);

  const workout = first.nextData.workouts[0];
  assert.ok(workout);
  const initialDetail = first.nextData.workoutDetails.find((item) => item.workoutId === workout?.id);
  assert.ok(initialDetail);
  assert.ok((initialDetail?.heartRateSeries?.length || 0) > 0);

  const summaryNoSeriesCsv = [
    "Workout Name,Start Time,End Time,Duration (s),Total Energy (kcal),Distance (km),Steps",
    "Outdoor Walk,2026-02-10 14:32:00,2026-02-10 14:57:00,1500,125,1.93,2135",
  ].join("\n");

  const second = importHealthFiles(first.nextData, [
    { filename: "workouts-C803532A-DAE5-4CC3-AD5E-30C2A0FFD8E0.csv", csv: summaryNoSeriesCsv },
  ]);

  const afterDetail = second.nextData.workoutDetails.find((item) => item.workoutId === workout?.id);
  assert.ok(afterDetail);
  assert.ok((afterDetail?.heartRateSeries?.length || 0) >= (initialDetail?.heartRateSeries?.length || 0));
  assert.ok((afterDetail?.distanceSeries?.length || 0) > 0);
});

test("allows workout re-import when workouts were cleared but raw file hashes remain", () => {
  const seed = createDefaultAppData("Europe/Berlin");
  const filename = "workouts-C803532A-DAE5-4CC3-AD5E-30C2A0FFD8E0.csv";
  const hash = createHash("sha256").update(`${filename}\n${workoutsBpmCsv}`).digest("hex");

  seed.healthRawFiles.push({
    id: hash.slice(0, 24),
    hash,
    filename,
    fileType: "workout_summary",
    rowCount: 1,
    importedAt: "2026-02-01T00:00:00.000Z",
  });

  const imported = importHealthFiles(seed, [{ filename, csv: workoutsBpmCsv }]);
  assert.equal(imported.summary.filesProcessed, 1);
  assert.equal(imported.summary.importedWorkouts, 1);
  assert.equal(imported.nextData.workouts.length, 1);
});

test("normalizes multipart payload with multiple csv files and keeps deterministic ordering", async () => {
  const form = new FormData();
  form.append(
    "metrics",
    new File([aggregateCsv], "HealthAutoExport-2026-02-10-2026-02-10.csv", { type: "text/csv" }),
  );
  form.append("notes", new File(["not,csv"], "notes.txt", { type: "text/plain" }));
  form.append(
    "workouts",
    new File([workoutsCsv], "Workouts-20260210_000000-20260210_235959.csv", { type: "text/csv" }),
  );

  const request = new Request("http://localhost/api/integrations/health/csv", {
    method: "POST",
    body: form,
  });

  const files = await normalizeHealthIngestRequest(request, { allowRawText: true });
  assert.equal(files.length, 2);
  assert.equal(files[0]?.filename, "HealthAutoExport-2026-02-10-2026-02-10.csv");
  assert.equal(files[1]?.filename, "Workouts-20260210_000000-20260210_235959.csv");
});

test("normalizes multipart payload with fallback filename when file name is blob", async () => {
  const form = new FormData();
  form.append("metrics", new File([aggregateCsv], "blob", { type: "text/csv" }));

  const request = new Request("http://localhost/api/integrations/health/csv", {
    method: "POST",
    body: form,
  });

  const files = await normalizeHealthIngestRequest(request, { allowRawText: true });
  assert.equal(files.length, 1);
  assert.equal(files[0]?.filename, "metrics.csv");
});

test("normalizes json payload for csv route with files[] and single csv fallback", async () => {
  const request = new Request("http://localhost/api/integrations/health/csv", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      files: [
        {
          filename: "HealthAutoExport-2026-02-10-2026-02-10.csv",
          csv: aggregateCsv,
        },
      ],
      filename: "single.csv",
      csv: workoutsCsv,
    }),
  });

  const files = await normalizeHealthIngestRequest(request, {
    allowRawText: true,
    acceptJsonSingleCsv: true,
    acceptJsonFiles: true,
  });

  assert.equal(files.length, 2);
  assert.equal(files[0]?.filename, "HealthAutoExport-2026-02-10-2026-02-10.csv");
  assert.equal(files[1]?.filename, "single.csv");
});

test("normalizes raw text csv payload for csv route", async () => {
  const request = new Request("http://localhost/api/integrations/health/csv", {
    method: "POST",
    headers: {
      "content-type": "text/csv",
    },
    body: aggregateCsv,
  });

  const files = await normalizeHealthIngestRequest(request, {
    allowRawText: true,
    defaultFilename: "HealthAutoExport.csv",
  });

  assert.equal(files.length, 1);
  assert.equal(files[0]?.filename, "HealthAutoExport.csv");
});
