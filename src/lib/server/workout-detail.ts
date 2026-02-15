import type { WorkoutDetail, WorkoutEntry, WorkoutStreamPoint } from "@/lib/types";

function pickSeriesTimestamp(
  startedAt: string,
  endedAt: string,
  mode: "midpoint" | "end",
): string {
  const startMs = new Date(startedAt).getTime();
  const endMs = new Date(endedAt).getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return startedAt;
  }

  if (mode === "end") {
    return new Date(endMs).toISOString();
  }

  return new Date(startMs + (endMs - startMs) / 2).toISOString();
}

function hasSeries(rows: WorkoutStreamPoint[] | undefined): boolean {
  return Array.isArray(rows) && rows.length > 0;
}

function toFallbackDetailFromWorkout(workout: WorkoutEntry): WorkoutDetail {
  return {
    workoutId: workout.id,
    workoutKey: workout.sourceWorkoutKey || `workout-${workout.id}`,
    workoutType: workout.type,
    workoutNameRaw: workout.workoutNameRaw,
    workoutDisplayLabel: workout.workoutDisplayLabel,
    startedAt: workout.startedAt,
    endedAt: workout.endedAt,
    durationMin: workout.durationMin,
    mergeConfidence: workout.mergeConfidence || 0.6,
    streamCount: workout.streamCount || 1,
    distanceKm: workout.distanceKm,
    avgSpeedKmh: workout.avgSpeedKmh,
    maxSpeedKmh: workout.maxSpeedKmh,
    activeEnergyKj: workout.activeEnergyKj,
    restingEnergyKj: workout.restingEnergyKj,
    stepCount: workout.stepCount,
    avgCadenceSpm: workout.avgCadenceSpm,
    flights: workout.flights,
    elevationAscM: workout.elevationAscM,
    elevationDescM: workout.elevationDescM,
    hrMin: workout.hrMin,
    hrMax: workout.hrMax,
    hrAvg: workout.hrAvg ?? workout.avgHeartRate,
    sourceFiles: [],
    streams: [],
    heartRateSeries: [],
    distanceSeries: [],
    stepSeries: [],
    activeEnergySeries: [],
    restingEnergySeries: [],
  };
}

export function withWorkoutSeriesFallback(
  detail: WorkoutDetail | null,
  workout: WorkoutEntry | null,
): WorkoutDetail | null {
  if (!detail && !workout) {
    return null;
  }

  const next = detail ? { ...detail } : toFallbackDetailFromWorkout(workout!);
  const startedAt = next.startedAt || workout?.startedAt || new Date().toISOString();
  const endedAt = next.endedAt || workout?.endedAt || startedAt;
  const midpoint = pickSeriesTimestamp(startedAt, endedAt, "midpoint");
  const end = pickSeriesTimestamp(startedAt, endedAt, "end");

  const hrMin = next.hrMin ?? workout?.hrMin;
  const hrMax = next.hrMax ?? workout?.hrMax;
  const hrAvg = next.hrAvg ?? workout?.hrAvg ?? workout?.avgHeartRate;
  const distanceKm = next.distanceKm ?? workout?.distanceKm;
  const stepCount = next.stepCount ?? workout?.stepCount;
  const activeEnergyKj = next.activeEnergyKj ?? workout?.activeEnergyKj;
  const restingEnergyKj = next.restingEnergyKj ?? workout?.restingEnergyKj;

  if (!hasSeries(next.heartRateSeries)) {
    if (
      (typeof hrMin === "number" && hrMin > 0) ||
      (typeof hrMax === "number" && hrMax > 0) ||
      (typeof hrAvg === "number" && hrAvg > 0)
    ) {
      next.heartRateSeries = [
        {
          timestamp: midpoint,
          min: typeof hrMin === "number" && hrMin > 0 ? hrMin : undefined,
          max: typeof hrMax === "number" && hrMax > 0 ? hrMax : undefined,
          avg: typeof hrAvg === "number" && hrAvg > 0 ? hrAvg : undefined,
          context: "summary_fallback",
        },
      ];
    }
  }

  if (!hasSeries(next.distanceSeries)) {
    if (typeof distanceKm === "number" && distanceKm > 0) {
      next.distanceSeries = [{ timestamp: end, value: distanceKm, context: "summary_total" }];
    }
  }

  if (!hasSeries(next.stepSeries)) {
    if (typeof stepCount === "number" && stepCount > 0) {
      next.stepSeries = [{ timestamp: end, value: stepCount, context: "summary_total" }];
    }
  }

  if (!hasSeries(next.activeEnergySeries)) {
    if (typeof activeEnergyKj === "number" && activeEnergyKj > 0) {
      next.activeEnergySeries = [{ timestamp: end, value: activeEnergyKj, context: "summary_total" }];
    }
  }

  if (!hasSeries(next.restingEnergySeries)) {
    if (typeof restingEnergyKj === "number" && restingEnergyKj > 0) {
      next.restingEnergySeries = [{ timestamp: end, value: restingEnergyKj, context: "summary_total" }];
    }
  }

  return next;
}
