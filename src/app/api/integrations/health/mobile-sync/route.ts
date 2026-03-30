import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireHealthIngestAuth } from "@/lib/server/health-ingest-auth";
import { importMobileSyncPayload } from "@/lib/server/health-mobile";
import { getDashboardStore } from "@/lib/server/store";
import { hashIdempotencyPayload, respondWithIdempotency } from "@/lib/server/idempotency";
import type { MobileSyncRequest, MobileSyncResponse } from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function asArrayOfRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Record<string, unknown> => isRecord(item));
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
}

function optionalIsoString(value: unknown): string | undefined {
  if (!isIsoDate(value)) {
    return undefined;
  }

  return new Date(value).toISOString();
}

function normalizeSeries(value: unknown): Array<{ timestamp: string; value: number }> | undefined {
  const entries = asArrayOfRecords(value)
    .map((item) => {
      const timestamp = isIsoDate(item.timestamp) ? new Date(item.timestamp).toISOString() : null;
      const pointValue = optionalNumber(item.value);
      if (!timestamp || typeof pointValue !== "number") {
        return null;
      }

      return { timestamp, value: pointValue };
    })
    .filter((item): item is { timestamp: string; value: number } => Boolean(item));

  return entries.length > 0 ? entries : undefined;
}

function normalizeSyncRequest(raw: unknown): { payload: MobileSyncRequest | null; error?: string } {
  if (!isRecord(raw)) {
    return { payload: null, error: "Invalid JSON body" };
  }

  const schemaVersion = raw.schemaVersion;
  if (schemaVersion !== 1) {
    return { payload: null, error: "schemaVersion must be 1" };
  }

  if (!isNonEmptyString(raw.batchId)) {
    return { payload: null, error: "batchId is required" };
  }

  if (!isIsoDate(raw.generatedAt)) {
    return { payload: null, error: "generatedAt must be a valid ISO timestamp" };
  }

  if (!isRecord(raw.device)) {
    return { payload: null, error: "device block is required" };
  }

  const device = raw.device;
  if (
    !isNonEmptyString(device.deviceId) ||
    !isNonEmptyString(device.appVersion) ||
    !isNonEmptyString(device.osVersion) ||
    !isNonEmptyString(device.timezone)
  ) {
    return {
      payload: null,
      error: "device.deviceId, device.appVersion, device.osVersion, and device.timezone are required",
    };
  }

  const settings = isRecord(raw.settings) ? raw.settings : undefined;
  if (
    settings &&
    settings.syncIntervalMinutes !== undefined &&
    (typeof settings.syncIntervalMinutes !== "number" ||
      !Number.isFinite(settings.syncIntervalMinutes) ||
      settings.syncIntervalMinutes <= 0)
  ) {
    return { payload: null, error: "settings.syncIntervalMinutes must be a positive number" };
  }

  const syncWindow = isRecord(raw.syncWindow) ? raw.syncWindow : undefined;
  if (syncWindow?.from !== undefined && !isIsoDate(syncWindow.from)) {
    return { payload: null, error: "syncWindow.from must be an ISO timestamp" };
  }
  if (syncWindow?.to !== undefined && !isIsoDate(syncWindow.to)) {
    return { payload: null, error: "syncWindow.to must be an ISO timestamp" };
  }

  const dailyHealth = asArrayOfRecords(raw.dailyHealth);
  const workouts = asArrayOfRecords(raw.workouts);
  const deletions = asArrayOfRecords(raw.deletions);

  for (const workout of workouts) {
    if (
      !isNonEmptyString(workout.hkWorkoutUuid) ||
      !isNonEmptyString(workout.workoutType) ||
      !isIsoDate(workout.startedAt) ||
      !isIsoDate(workout.endedAt)
    ) {
      return {
        payload: null,
        error:
          "Each workout requires hkWorkoutUuid, workoutType, startedAt, and endedAt",
      };
    }

    if (
      typeof workout.durationMin !== "number" ||
      !Number.isFinite(workout.durationMin) ||
      workout.durationMin <= 0
    ) {
      return { payload: null, error: "Each workout.durationMin must be a positive number" };
    }
  }

  const normalizedDailyHealth = dailyHealth
    .map((row) => {
      const date = row.date;
      if (!isNonEmptyString(date)) {
        return null;
      }

      return {
        date: date.trim(),
        sleepHours: optionalNumber(row.sleepHours),
        sleepAsleepHours: optionalNumber(row.sleepAsleepHours),
        sleepInBedHours: optionalNumber(row.sleepInBedHours),
        sleepCoreHours: optionalNumber(row.sleepCoreHours),
        sleepDeepHours: optionalNumber(row.sleepDeepHours),
        sleepRemHours: optionalNumber(row.sleepRemHours),
        sleepAwakeHours: optionalNumber(row.sleepAwakeHours),
        sleepMidpointHour: optionalNumber(row.sleepMidpointHour),
        sleepBedtimeHour: optionalNumber(row.sleepBedtimeHour),
        sleepBedtimeAt: optionalIsoString(row.sleepBedtimeAt),
        sleepWakeupAt: optionalIsoString(row.sleepWakeupAt),
        sleepRegularitySRI: optionalNumber(row.sleepRegularitySRI),
        hrvMs: optionalNumber(row.hrvMs),
        restingHrBpm: optionalNumber(row.restingHrBpm),
        heartRateMinBpm: optionalNumber(row.heartRateMinBpm),
        heartRateMaxBpm: optionalNumber(row.heartRateMaxBpm),
        heartRateAvgBpm: optionalNumber(row.heartRateAvgBpm),
        respiratoryRateBpm: optionalNumber(row.respiratoryRateBpm),
        steps: optionalNumber(row.steps),
        walkRunDistanceKm: optionalNumber(row.walkRunDistanceKm),
        activeEnergyKj: optionalNumber(row.activeEnergyKj),
        restingEnergyKj: optionalNumber(row.restingEnergyKj),
        exerciseTimeMin: optionalNumber(row.exerciseTimeMin),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const normalizedWorkouts = workouts.map((row) => {
    const streams = isRecord(row.streams) ? row.streams : undefined;
    return {
      hkWorkoutUuid: String(row.hkWorkoutUuid).trim(),
      workoutType: String(row.workoutType).trim(),
      startedAt: new Date(String(row.startedAt)).toISOString(),
      endedAt: new Date(String(row.endedAt)).toISOString(),
      durationMin: Number(row.durationMin),
      distanceKm: optionalNumber(row.distanceKm),
      activeEnergyKj: optionalNumber(row.activeEnergyKj),
      restingEnergyKj: optionalNumber(row.restingEnergyKj),
      avgHeartRate: optionalNumber(row.avgHeartRate),
      hrMin: optionalNumber(row.hrMin),
      hrMax: optionalNumber(row.hrMax),
      hrAvg: optionalNumber(row.hrAvg),
      stepCount: optionalNumber(row.stepCount),
      streams: streams
        ? {
            heartRateSeries: normalizeSeries(streams.heartRateSeries),
            distanceSeries: normalizeSeries(streams.distanceSeries),
            stepSeries: normalizeSeries(streams.stepSeries),
            activeEnergySeries: normalizeSeries(streams.activeEnergySeries),
            restingEnergySeries: normalizeSeries(streams.restingEnergySeries),
          }
        : undefined,
    };
  });

  const normalizedDeletions = deletions
    .map((row) => {
      const sampleType = row.sampleType;
      const uuid = row.uuid;
      const deletedAt = row.deletedAt;
      if (!isNonEmptyString(sampleType) || !isNonEmptyString(uuid) || !isIsoDate(deletedAt)) {
        return null;
      }

      return {
        sampleType: sampleType.trim(),
        uuid: uuid.trim(),
        deletedAt: new Date(String(deletedAt)).toISOString(),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const payload: MobileSyncRequest = {
    schemaVersion: 1,
    batchId: raw.batchId.trim(),
    generatedAt: new Date(raw.generatedAt).toISOString(),
    device: {
      deviceId: device.deviceId.trim(),
      appVersion: device.appVersion.trim(),
      osVersion: device.osVersion.trim(),
      timezone: device.timezone.trim(),
    },
    syncWindow:
      syncWindow && (isIsoDate(syncWindow.from) || isIsoDate(syncWindow.to))
        ? {
            from: isIsoDate(syncWindow.from) ? new Date(syncWindow.from).toISOString() : undefined,
            to: isIsoDate(syncWindow.to) ? new Date(syncWindow.to).toISOString() : undefined,
          }
        : undefined,
    settings:
      settings && typeof settings.syncIntervalMinutes === "number"
        ? {
            syncIntervalMinutes: settings.syncIntervalMinutes,
          }
        : undefined,
    dailyHealth: normalizedDailyHealth,
    workouts: normalizedWorkouts,
    deletions: normalizedDeletions,
  };

  return { payload };
}

export async function POST(request: NextRequest) {
  const unauthorized = requireHealthIngestAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  const rawBody = await request.json().catch(() => null);
  const normalized = normalizeSyncRequest(rawBody);
  if (!normalized.payload) {
    return NextResponse.json(
      {
        error: normalized.error || "Invalid mobile sync payload",
      },
      { status: 400 },
    );
  }
  const payload = normalized.payload;

  try {
    const store = getDashboardStore();
    const payloadHash = hashIdempotencyPayload(payload);
    const idempotencyKey = request.headers.get("idempotency-key");
    return respondWithIdempotency({
      store,
      scope: "integrations.health.mobile-sync",
      key: idempotencyKey,
      payloadHash,
      handler: async () => {
        const data = await store.getData();
        const imported = importMobileSyncPayload(data, payload);
        await store.saveData(imported.nextData);

        const intervalMinutes = payload.settings?.syncIntervalMinutes;
        const boundedIntervalMinutes =
          typeof intervalMinutes === "number" ? Math.max(15, Math.min(180, intervalMinutes)) : 30;

        const response: MobileSyncResponse = {
          ok: true,
          importedHealthDays: imported.summary.importedHealthDays,
          importedWorkouts: imported.summary.importedWorkouts,
          updatedWorkouts: imported.summary.updatedWorkouts,
          filesProcessed: imported.summary.filesProcessed,
          filesSkipped: imported.summary.filesSkipped,
          linkedStreams: imported.summary.linkedStreams,
          duplicateBatch: imported.summary.duplicateBatch,
          serverTime: new Date().toISOString(),
          nextSuggestedSyncSeconds: boundedIntervalMinutes * 60,
        };
        return { body: response };
      },
    });
  } catch (error) {
    const err = error as {
      name?: string;
      message?: string;
      "$metadata"?: { httpStatusCode?: number };
      Code?: string;
    };

    return NextResponse.json(
      {
        error: "Mobile health sync failed",
        failure: {
          name: err?.name || null,
          message: err?.message || "Unknown server error",
          code: err?.Code || null,
          httpStatusCode: err?.$metadata?.httpStatusCode || null,
          dataBackend: process.env.DATA_BACKEND || null,
          sessionsTable: process.env.YAN_STUDY_SESSIONS_TABLE || null,
          todosTable: process.env.YAN_STUDY_TODOS_TABLE || null,
          settingsTable: process.env.YAN_STUDY_SETTINGS_TABLE || null,
          awsRegion: process.env.AWS_REGION || null,
        },
      },
      { status: 500 },
    );
  }
}
