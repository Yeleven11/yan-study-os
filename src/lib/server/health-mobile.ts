import { createHash } from "node:crypto";
import { toDateKey } from "@/lib/dashboard-utils";
import { sanitizeFutureHealthData } from "@/lib/server/health-time-sanity";
import type {
  AppData,
  DailyHealthFact,
  HealthRawFile,
  HealthRawRow,
  MobileSyncDailyHealthInput,
  MobileSyncRequest,
  MobileSyncWorkoutInput,
  WorkoutDetail,
  WorkoutEntry,
  WorkoutStream,
  WorkoutStreamPoint,
  WorkoutType,
} from "@/lib/types";

export type MobileHealthImportSummary = {
  importedHealthDays: number;
  importedWorkouts: number;
  updatedWorkouts: number;
  filesProcessed: number;
  filesSkipped: number;
  linkedStreams: number;
  duplicateBatch: boolean;
};

const MAX_SERIES_POINTS = 480;

function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 3): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function wrapHour(value: number): number {
  const normalized = value % 24;
  return normalized < 0 ? normalized + 24 : normalized;
}

function normalizeFinite(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
}

function normalizeIso(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function normalizeDateKey(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toDateKey(parsed);
}

function sanitizeUuid(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function inferWorkoutType(raw: string): WorkoutType {
  const normalized = raw.toLowerCase();

  if (
    normalized.includes("walk") ||
    normalized.includes("hike") ||
    normalized.includes("recovery")
  ) {
    return "recovery";
  }

  if (
    normalized.includes("yoga") ||
    normalized.includes("stretch") ||
    normalized.includes("mobility")
  ) {
    return "mobility";
  }

  if (
    normalized.includes("strength") ||
    normalized.includes("weight") ||
    normalized.includes("lifting")
  ) {
    return "strength";
  }

  return "cardio";
}

function normalizeStreamPoints(points: unknown): WorkoutStreamPoint[] {
  if (!Array.isArray(points)) {
    return [];
  }

  const normalized: WorkoutStreamPoint[] = [];

  for (const point of points) {
    if (!point || typeof point !== "object") {
      continue;
    }

    const record = point as { timestamp?: unknown; value?: unknown };
    const timestamp = normalizeIso(record.timestamp);
    const value = normalizeFinite(record.value);
    if (!timestamp || typeof value !== "number") {
      continue;
    }

    normalized.push({
      timestamp,
      value,
    });
  }

  normalized.sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());
  if (normalized.length <= MAX_SERIES_POINTS) {
    return normalized;
  }

  return normalized.slice(normalized.length - MAX_SERIES_POINTS);
}

function toMs(value: string): number | null {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function isDateKeyOnOrBefore(dateKey: string, cutoffMs: number): boolean {
  const parsed = toMs(dateKey);
  if (parsed == null) {
    return false;
  }
  return parsed <= cutoffMs;
}

function buildStream(
  workoutKey: string,
  sourceFile: string,
  streamType: WorkoutStream["streamType"],
  rows: WorkoutStreamPoint[],
): WorkoutStream | null {
  if (rows.length === 0) {
    return null;
  }

  return {
    id: hashText(`mobile-stream|${workoutKey}|${streamType}`).slice(0, 24),
    workoutKey,
    streamType,
    sourceFile,
    startedAt: rows[0]?.timestamp,
    endedAt: rows[rows.length - 1]?.timestamp,
    rows,
  };
}

function mergeNumericDailyHealth(
  target: DailyHealthFact,
  source: Record<string, unknown>,
  keys: Array<keyof DailyHealthFact>,
): DailyHealthFact {
  const next: DailyHealthFact = { ...target };

  for (const key of keys) {
    const value = normalizeFinite(source[key as string]);
    if (typeof value === "number") {
      (next as unknown as Record<string, unknown>)[key as string] = value;
    }
  }

  return next;
}

function mergeIsoDailyHealth(
  target: DailyHealthFact,
  source: Record<string, unknown>,
  keys: Array<keyof DailyHealthFact>,
): DailyHealthFact {
  const next: DailyHealthFact = { ...target };

  for (const key of keys) {
    const value = normalizeIso(source[key as string]);
    if (typeof value === "string") {
      (next as unknown as Record<string, unknown>)[key as string] = value;
    }
  }

  return next;
}

function upsertDailyHealth(
  current: DailyHealthFact[],
  incoming: MobileSyncDailyHealthInput[],
  importedAt: string,
  cutoffMs: number,
): { next: DailyHealthFact[]; importedHealthDays: number } {
  const byDate = new Map(current.map((item) => [item.date, item]));
  let importedHealthDays = 0;

  for (const row of incoming) {
    const date = normalizeDateKey(row.date);
    if (!date) {
      continue;
    }
    if (!isDateKeyOnOrBefore(date, cutoffMs)) {
      continue;
    }

    const existing = byDate.get(date);
    const createdAt = existing?.createdAt || importedAt;

    let next: DailyHealthFact = {
      ...(existing || {
        date,
        sleepHours: 0,
      }),
      source: "health_import",
      createdAt,
    };

    const sleepHours = normalizeFinite(row.sleepHours);
    if (typeof sleepHours === "number") {
      next.sleepHours = clamp(round(sleepHours, 2), 0, 24);
    }

    next = mergeNumericDailyHealth(next, row as unknown as Record<string, unknown>, [
      "sleepAsleepHours",
      "sleepInBedHours",
      "sleepCoreHours",
      "sleepDeepHours",
      "sleepRemHours",
      "sleepAwakeHours",
      "sleepMidpointHour",
      "sleepBedtimeHour",
      "sleepRegularitySRI",
      "hrvMs",
      "restingHrBpm",
      "heartRateMinBpm",
      "heartRateMaxBpm",
      "heartRateAvgBpm",
      "respiratoryRateBpm",
      "steps",
      "walkRunDistanceKm",
      "activeEnergyKj",
      "restingEnergyKj",
      "exerciseTimeMin",
    ]);

    next = mergeIsoDailyHealth(next, row as unknown as Record<string, unknown>, [
      "sleepBedtimeAt",
      "sleepWakeupAt",
    ]);

    if (typeof next.sleepMidpointHour === "number" && Number.isFinite(next.sleepMidpointHour)) {
      next.sleepMidpointHour = round(wrapHour(next.sleepMidpointHour), 3);
    }

    if (typeof next.sleepBedtimeHour === "number" && Number.isFinite(next.sleepBedtimeHour)) {
      next.sleepBedtimeHour = round(wrapHour(next.sleepBedtimeHour), 3);
    }

    if (typeof next.sleepRegularitySRI === "number" && Number.isFinite(next.sleepRegularitySRI)) {
      next.sleepRegularitySRI = round(clamp(next.sleepRegularitySRI, 0, 100), 3);
    }

    const isNew = !existing;
    byDate.set(date, next);
    if (isNew) {
      importedHealthDays += 1;
    }
  }

  return {
    next: [...byDate.values()].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()),
    importedHealthDays,
  };
}

function buildWorkoutEntry(
  input: MobileSyncWorkoutInput,
  importedAt: string,
  cutoffMs: number,
): WorkoutEntry | null {
  const hkWorkoutUuid = sanitizeUuid(input.hkWorkoutUuid || "");
  if (!hkWorkoutUuid) {
    return null;
  }

  const startedAt = normalizeIso(input.startedAt);
  const endedAt = normalizeIso(input.endedAt);
  if (!startedAt || !endedAt) {
    return null;
  }
  const startedAtMs = toMs(startedAt);
  const endedAtMs = toMs(endedAt);
  if (startedAtMs == null || endedAtMs == null || startedAtMs > cutoffMs || endedAtMs > cutoffMs) {
    return null;
  }

  const durationMin = normalizeFinite(input.durationMin);
  if (typeof durationMin !== "number" || durationMin <= 0) {
    return null;
  }

  const workoutTypeRaw = input.workoutType?.trim() || "Workout";
  const type = inferWorkoutType(workoutTypeRaw);
  const id = `hk_${hkWorkoutUuid}`;
  const sourceWorkoutKey = `hk-${hkWorkoutUuid}`;
  const hrAvg = normalizeFinite(input.hrAvg) ?? normalizeFinite(input.avgHeartRate);

  const entry: WorkoutEntry = {
    id,
    sourceWorkoutKey,
    workoutNameRaw: workoutTypeRaw,
    workoutDisplayLabel: workoutTypeRaw,
    mergeConfidence: 0.95,
    streamCount: 1,
    type,
    startedAt,
    endedAt,
    durationMin: round(durationMin, 2),
    activeEnergyKj: normalizeFinite(input.activeEnergyKj),
    restingEnergyKj: normalizeFinite(input.restingEnergyKj),
    avgHeartRate: hrAvg,
    hrMin: normalizeFinite(input.hrMin),
    hrMax: normalizeFinite(input.hrMax),
    hrAvg,
    distanceKm: normalizeFinite(input.distanceKm),
    stepCount: normalizeFinite(input.stepCount),
    source: "health_import",
    createdAt: importedAt,
  };

  if (typeof entry.activeEnergyKj === "number") {
    entry.activeKcal = round(entry.activeEnergyKj / 4.184, 2);
  }

  return entry;
}

function buildWorkoutDetail(
  entry: WorkoutEntry,
  input: MobileSyncWorkoutInput,
  sourceFile: string,
  cutoffMs: number,
): WorkoutDetail {
  const workoutKey = entry.sourceWorkoutKey || entry.id;
  const streamsInput = input.streams || {};

  const heartRateSeries = normalizeStreamPoints(streamsInput.heartRateSeries).filter((point) => {
    const timestampMs = toMs(point.timestamp);
    return timestampMs != null && timestampMs <= cutoffMs;
  });
  const distanceSeries = normalizeStreamPoints(streamsInput.distanceSeries).filter((point) => {
    const timestampMs = toMs(point.timestamp);
    return timestampMs != null && timestampMs <= cutoffMs;
  });
  const stepSeries = normalizeStreamPoints(streamsInput.stepSeries).filter((point) => {
    const timestampMs = toMs(point.timestamp);
    return timestampMs != null && timestampMs <= cutoffMs;
  });
  const activeEnergySeries = normalizeStreamPoints(streamsInput.activeEnergySeries).filter((point) => {
    const timestampMs = toMs(point.timestamp);
    return timestampMs != null && timestampMs <= cutoffMs;
  });
  const restingEnergySeries = normalizeStreamPoints(streamsInput.restingEnergySeries).filter((point) => {
    const timestampMs = toMs(point.timestamp);
    return timestampMs != null && timestampMs <= cutoffMs;
  });

  const streams = [
    buildStream(workoutKey, sourceFile, "heart_rate", heartRateSeries),
    buildStream(workoutKey, sourceFile, "distance", distanceSeries),
    buildStream(workoutKey, sourceFile, "steps", stepSeries),
    buildStream(workoutKey, sourceFile, "active_energy", activeEnergySeries),
    buildStream(workoutKey, sourceFile, "resting_energy", restingEnergySeries),
  ].filter((stream): stream is WorkoutStream => Boolean(stream));

  return {
    workoutId: entry.id,
    workoutKey,
    workoutType: entry.type,
    workoutNameRaw: entry.workoutNameRaw,
    workoutDisplayLabel: entry.workoutDisplayLabel,
    startedAt: entry.startedAt,
    endedAt: entry.endedAt,
    durationMin: entry.durationMin,
    mergeConfidence: streams.length > 0 ? 0.98 : 0.92,
    streamCount: 1 + streams.length,
    distanceKm: entry.distanceKm,
    avgSpeedKmh: entry.avgSpeedKmh,
    maxSpeedKmh: entry.maxSpeedKmh,
    activeEnergyKj: entry.activeEnergyKj,
    restingEnergyKj: entry.restingEnergyKj,
    stepCount: entry.stepCount,
    avgCadenceSpm: entry.avgCadenceSpm,
    flights: entry.flights,
    elevationAscM: entry.elevationAscM,
    elevationDescM: entry.elevationDescM,
    hrMin: entry.hrMin,
    hrMax: entry.hrMax,
    hrAvg: entry.hrAvg,
    sourceFiles: [sourceFile],
    streams,
    heartRateSeries,
    distanceSeries,
    stepSeries,
    activeEnergySeries,
    restingEnergySeries,
  };
}

function mergeWorkoutEntry(existing: WorkoutEntry | undefined, incoming: WorkoutEntry): WorkoutEntry {
  if (!existing) {
    return incoming;
  }

  const merged: WorkoutEntry = {
    ...existing,
    ...incoming,
    createdAt: existing.createdAt || incoming.createdAt,
    source: "health_import",
  };

  if (typeof existing.difficultyUser === "number") {
    merged.difficultyUser = existing.difficultyUser;
  }

  return merged;
}

function mergeWorkoutDetail(existing: WorkoutDetail | undefined, incoming: WorkoutDetail): WorkoutDetail {
  if (!existing) {
    return incoming;
  }

  const streamById = new Map(existing.streams.map((item) => [item.id, item]));
  for (const stream of incoming.streams) {
    streamById.set(stream.id, stream);
  }

  return {
    ...existing,
    ...incoming,
    sourceFiles: [...new Set([...existing.sourceFiles, ...incoming.sourceFiles])],
    streams: [...streamById.values()],
  };
}

function applyDeletions(
  workoutsById: Map<string, WorkoutEntry>,
  detailsByWorkoutId: Map<string, WorkoutDetail>,
  request: MobileSyncRequest,
): void {
  for (const deletion of request.deletions || []) {
    const sampleType = (deletion.sampleType || "").toLowerCase();
    if (!sampleType.includes("workout")) {
      continue;
    }

    const uuid = sanitizeUuid(deletion.uuid || "");
    if (!uuid) {
      continue;
    }

    const workoutId = `hk_${uuid}`;
    workoutsById.delete(workoutId);
    detailsByWorkoutId.delete(workoutId);
  }
}

export function importMobileSyncPayload(
  current: AppData,
  request: MobileSyncRequest,
): { nextData: AppData; summary: MobileHealthImportSummary } {
  const now = new Date();
  const cutoffMs = now.getTime();
  const sanitizedCurrent = sanitizeFutureHealthData(current, now).data;
  const importedAt = now.toISOString();
  const sourceFilename = `mobile-sync-${request.batchId}.json`;
  const payloadHash = hashText(JSON.stringify(request));

  const duplicate = sanitizedCurrent.healthRawFiles.some(
    (file) => file.hash === payloadHash || file.filename === sourceFilename,
  );

  if (duplicate) {
    return {
      nextData: sanitizedCurrent,
      summary: {
        importedHealthDays: 0,
        importedWorkouts: 0,
        updatedWorkouts: 0,
        filesProcessed: 0,
        filesSkipped: 1,
        linkedStreams: 0,
        duplicateBatch: true,
      },
    };
  }

  const dailyHealthInput = Array.isArray(request.dailyHealth) ? request.dailyHealth : [];
  const workoutInput = Array.isArray(request.workouts) ? request.workouts : [];

  const dailyMerged = upsertDailyHealth(
    sanitizedCurrent.dailyHealth,
    dailyHealthInput,
    importedAt,
    cutoffMs,
  );

  const workoutsById = new Map(sanitizedCurrent.workouts.map((item) => [item.id, item]));
  const detailsByWorkoutId = new Map(
    sanitizedCurrent.workoutDetails.map((item) => [item.workoutId, item]),
  );

  let importedWorkouts = 0;
  let updatedWorkouts = 0;
  let linkedStreams = 0;

  for (const row of workoutInput) {
    const incomingEntry = buildWorkoutEntry(row, importedAt, cutoffMs);
    if (!incomingEntry) {
      continue;
    }

    const existing = workoutsById.get(incomingEntry.id);
    workoutsById.set(incomingEntry.id, mergeWorkoutEntry(existing, incomingEntry));

    if (existing) {
      updatedWorkouts += 1;
    } else {
      importedWorkouts += 1;
    }

    const detail = buildWorkoutDetail(
      workoutsById.get(incomingEntry.id)!,
      row,
      sourceFilename,
      cutoffMs,
    );
    linkedStreams += detail.streams.length;
    const existingDetail = detailsByWorkoutId.get(detail.workoutId);
    detailsByWorkoutId.set(detail.workoutId, mergeWorkoutDetail(existingDetail, detail));
  }

  applyDeletions(workoutsById, detailsByWorkoutId, request);

  const rawFile: HealthRawFile = {
    id: hashText(`mobile-file|${request.batchId}`).slice(0, 24),
    hash: payloadHash,
    filename: sourceFilename,
    fileType: "mobile_sync",
    rowCount: dailyHealthInput.length + workoutInput.length + (request.deletions?.length || 0),
    importedAt,
  };

  const rawRow: HealthRawRow = {
    id: hashText(`mobile-row|${request.batchId}`).slice(0, 24),
    fileId: rawFile.id,
    rowIndex: 0,
    timestamp: importedAt,
    values: {
      schemaVersion: String(request.schemaVersion),
      batchId: request.batchId,
      generatedAt: request.generatedAt,
      deviceId: request.device?.deviceId || "",
      timezone: request.device?.timezone || "",
      workouts: String(workoutInput.length),
      dailyHealth: String(dailyHealthInput.length),
      deletions: String(request.deletions?.length || 0),
    },
  };

  const nextData: AppData = {
    ...sanitizedCurrent,
    dailyHealth: dailyMerged.next,
    workouts: [...workoutsById.values()].sort(
      (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
    ),
    workoutDetails: [...detailsByWorkoutId.values()].sort(
      (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
    ),
    healthRawFiles: [...sanitizedCurrent.healthRawFiles, rawFile],
    healthRawRows: [...sanitizedCurrent.healthRawRows, rawRow],
  };
  const sanitizedNext = sanitizeFutureHealthData(nextData, now).data;

  return {
    nextData: sanitizedNext,
    summary: {
      importedHealthDays: dailyMerged.importedHealthDays,
      importedWorkouts,
      updatedWorkouts,
      filesProcessed: 1,
      filesSkipped: 0,
      linkedStreams,
      duplicateBatch: false,
    },
  };
}
