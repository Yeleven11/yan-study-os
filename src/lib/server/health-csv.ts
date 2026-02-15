import { createHash } from "node:crypto";
import { toDateKey } from "@/lib/dashboard-utils";
import type {
  AppData,
  DailyHealthFact,
  HealthRawFile,
  HealthRawRow,
  WorkoutDetail,
  WorkoutEntry,
  WorkoutStream,
  WorkoutStreamPoint,
  WorkoutStreamType,
  WorkoutType,
} from "@/lib/types";

export type HealthImportInputFile = {
  filename: string;
  csv: string;
};

export type HealthImportSummary = {
  importedHealthDays: number;
  importedWorkouts: number;
  filesProcessed: number;
  filesSkipped: number;
  filesIgnored: number;
  linkedStreams: number;
};

type FileRole = "aggregate" | "workout_summary" | "workout_stream" | "ignored" | "unknown";

type ParsedFile = {
  file: HealthRawFile;
  dailyHealth: DailyHealthFact[];
  workouts: WorkoutEntry[];
  streams: WorkoutStream[];
  rawRows: HealthRawRow[];
};

type StreamBucket = {
  workoutKey: string;
  streamType: WorkoutStreamType;
  sourceFile: string;
  rows: WorkoutStreamPoint[];
  stem: string;
  startMs?: number;
  endMs?: number;
};

const DETAIL_SUFFIXES: Array<{ pattern: RegExp; streamType: WorkoutStreamType }> = [
  { pattern: /heart\s*rate\s*recovery/i, streamType: "hr_recovery" },
  { pattern: /heart\s*rate/i, streamType: "heart_rate" },
  { pattern: /walking\s*\+\s*running\s*distance/i, streamType: "distance" },
  { pattern: /step\s*count/i, streamType: "steps" },
  { pattern: /active\s*energy/i, streamType: "active_energy" },
  { pattern: /resting\s*energy/i, streamType: "resting_energy" },
  { pattern: /flights\s*climbed/i, streamType: "other" },
];

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeStem(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];

    if (char === '"') {
      const nextChar = csv[index + 1];
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && csv[index + 1] === "\n") {
        index += 1;
      }

      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().replace(/,/g, ".");
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

function parseDateValue(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function parseDurationToMinutes(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  if (/^\d{1,2}:\d{2}:\d{2}$/.test(value)) {
    const [hours, minutes, seconds] = value.split(":").map(Number);
    return hours * 60 + minutes + seconds / 60;
  }

  const parsed = parseNumber(value);
  return typeof parsed === "number" ? parsed : undefined;
}

function classifyFile(filename: string, headers: string[]): { role: FileRole; streamType?: WorkoutStreamType; ignoredReason?: string } {
  const lower = filename.toLowerCase();
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));

  if (lower.endsWith(".gpx") || lower.includes("-route-")) {
    return {
      role: "ignored",
      ignoredReason: "route/gps file ignored",
    };
  }

  if (normalizedHeaders.includes("workouttype") && normalizedHeaders.includes("duration")) {
    return { role: "workout_summary" };
  }

  if (
    normalizedHeaders.includes("datetime") &&
    normalizedHeaders.some((header) => header.includes("sleepanalysis"))
  ) {
    return { role: "aggregate" };
  }

  if (normalizedHeaders.includes("datetime") || normalizedHeaders.includes("timestamp")) {
    for (const candidate of DETAIL_SUFFIXES) {
      if (candidate.pattern.test(filename)) {
        return { role: "workout_stream", streamType: candidate.streamType };
      }
    }

    if (
      normalizedHeaders.includes("mincountmin") ||
      normalizedHeaders.includes("maxcountmin") ||
      normalizedHeaders.includes("avgcountmin")
    ) {
      return { role: "workout_stream", streamType: "heart_rate" };
    }

    if (normalizedHeaders.length <= 4) {
      return { role: "workout_stream", streamType: "other" };
    }
  }

  return { role: "unknown" };
}

function toRecord(headers: string[], row: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (let index = 0; index < headers.length; index += 1) {
    record[headers[index]] = row[index] || "";
  }
  return record;
}

function getValue(record: Record<string, string>, aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    if (record[normalizedAlias] !== undefined && record[normalizedAlias] !== "") {
      return record[normalizedAlias];
    }
  }

  return undefined;
}

function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function inferWorkoutType(value: string | undefined): WorkoutType {
  const normalized = (value || "").toLowerCase();

  if (normalized.includes("strength") || normalized.includes("weights")) {
    return "strength";
  }

  if (normalized.includes("mobility") || normalized.includes("yoga") || normalized.includes("stretch")) {
    return "mobility";
  }

  if (normalized.includes("walk") || normalized.includes("recovery")) {
    return "recovery";
  }

  return "cardio";
}

function timestampToToken(date: Date): string {
  const year = `${date.getFullYear()}`;
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

function extractWorkoutKeyFromFilename(filename: string): { workoutKey?: string; stem?: string; token?: string } {
  const basename = filename.replace(/^.*\//, "").replace(/\.csv$/i, "");
  const tokenMatch = basename.match(/(\d{8}_\d{6})$/);

  if (!tokenMatch) {
    return {};
  }

  const token = tokenMatch[1];
  let stem = basename.replace(/-\d{8}_\d{6}$/i, "");

  for (const candidate of DETAIL_SUFFIXES) {
    stem = stem.replace(new RegExp(`-${candidate.pattern.source}$`, "i"), "");
  }

  const normalizedStem = normalizeStem(stem);
  return {
    stem: normalizedStem,
    token,
    workoutKey: `${normalizedStem}-${token}`,
  };
}

function mergeDailyHealth(rows: DailyHealthFact[]): DailyHealthFact[] {
  const byDate = new Map<string, DailyHealthFact>();
  for (const item of rows) {
    byDate.set(item.date, item);
  }

  return [...byDate.values()].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
  );
}

function parseAggregateRows(
  _filename: string,
  records: Array<Record<string, string>>,
  importedAt: string,
): DailyHealthFact[] {
  const parsed: DailyHealthFact[] = [];

  for (const record of records) {
    const dateValue = getValue(record, ["Date/Time", "date", "day"]);
    const date = parseDateValue(dateValue);
    if (!date) {
      continue;
    }

    const total = parseNumber(getValue(record, ["Sleep Analysis [Total] (hr)"]));
    const asleep = parseNumber(getValue(record, ["Sleep Analysis [Asleep] (hr)"]));
    const inBed = parseNumber(getValue(record, ["Sleep Analysis [In Bed] (hr)"]));
    const core = parseNumber(getValue(record, ["Sleep Analysis [Core] (hr)"]));
    const deep = parseNumber(getValue(record, ["Sleep Analysis [Deep] (hr)"]));
    const rem = parseNumber(getValue(record, ["Sleep Analysis [REM] (hr)"]));
    const awake = parseNumber(getValue(record, ["Sleep Analysis [Awake] (hr)"]));

    const sleepFromStages = (core ?? 0) + (deep ?? 0) + (rem ?? 0) + (awake ?? 0);

    const sleepHours =
      typeof total === "number" && total > 0
        ? total
        : sleepFromStages > 0
        ? sleepFromStages
        : undefined;

    if (typeof sleepHours !== "number") {
      continue;
    }

    const item: DailyHealthFact = {
      date: toDateKey(date),
      sleepHours,
      sleepAsleepHours: typeof asleep === "number" && asleep > 0 ? asleep : undefined,
      sleepInBedHours: typeof inBed === "number" && inBed > 0 ? inBed : undefined,
      sleepCoreHours: core,
      sleepDeepHours: deep,
      sleepRemHours: rem,
      sleepAwakeHours: awake,
      hrvMs: parseNumber(getValue(record, ["Heart Rate Variability (ms)"])),
      restingHrBpm: parseNumber(getValue(record, ["Resting Heart Rate (count/min)"])),
      heartRateMinBpm: parseNumber(getValue(record, ["Heart Rate [Min] (count/min)"])),
      heartRateMaxBpm: parseNumber(getValue(record, ["Heart Rate [Max] (count/min)"])),
      heartRateAvgBpm: parseNumber(getValue(record, ["Heart Rate [Avg] (count/min)"])),
      respiratoryRateBpm: parseNumber(getValue(record, ["Respiratory Rate (count/min)"])),
      steps: parseNumber(getValue(record, ["Step Count (count)"])),
      walkRunDistanceKm: parseNumber(getValue(record, ["Walking + Running Distance (km)"])),
      activeEnergyKj: parseNumber(getValue(record, ["Active Energy (kJ)"])),
      restingEnergyKj: parseNumber(getValue(record, ["Resting Energy (kJ)"])),
      physicalEffort: parseNumber(getValue(record, ["Physical Effort (kcal/hr·kg)"])),
      exerciseTimeMin: parseNumber(getValue(record, ["Apple Exercise Time (min)"])),
      standHours: parseNumber(getValue(record, ["Apple Stand Hour (count)"])),
      standTimeMin: parseNumber(getValue(record, ["Apple Stand Time (min)"])),
      wristTemperatureC: parseNumber(getValue(record, ["Apple Sleeping Wrist Temperature (degC)"])),
      source: "health_import",
      createdAt: importedAt,
    };

    parsed.push(item);
  }

  return mergeDailyHealth(parsed);
}

function parseWorkoutSummaryRows(
  records: Array<Record<string, string>>,
  importedAt: string,
): WorkoutEntry[] {
  const results: WorkoutEntry[] = [];

  for (const record of records) {
    const startDate = parseDateValue(getValue(record, ["Start"]));
    const endDate = parseDateValue(getValue(record, ["End"]));
    const durationMin = parseDurationToMinutes(getValue(record, ["Duration"]));

    if (!startDate || !endDate || typeof durationMin !== "number") {
      continue;
    }

    const typeLabel = getValue(record, ["Workout Type"]) || "Workout";
    const stem = normalizeStem(typeLabel);
    const token = timestampToToken(startDate);
    const sourceWorkoutKey = `${stem}-${token}`;
    const id = hashText(`summary|${sourceWorkoutKey}|${startDate.toISOString()}|${endDate.toISOString()}`).slice(
      0,
      24,
    );
    const activeEnergyKj = parseNumber(getValue(record, ["Active Energy (kJ)"]));
    const restingEnergyKj = parseNumber(getValue(record, ["Resting Energy (kJ)"]));

    results.push({
      id,
      sourceWorkoutKey,
      type: inferWorkoutType(typeLabel),
      startedAt: startDate.toISOString(),
      endedAt: endDate.toISOString(),
      durationMin,
      activeEnergyKj,
      restingEnergyKj,
      activeKcal: typeof activeEnergyKj === "number" ? activeEnergyKj / 4.184 : undefined,
      intensityKcalHrKg: parseNumber(getValue(record, ["Intensity (kcal/hr·kg)"])),
      hrMin: parseNumber(getValue(record, ["Min. Heart Rate (count/min)"])),
      hrMax: parseNumber(getValue(record, ["Max. Heart Rate (count/min)"])),
      hrAvg: parseNumber(getValue(record, ["Avg. Heart Rate (count/min)"])),
      avgHeartRate: parseNumber(getValue(record, ["Avg. Heart Rate (count/min)"])),
      distanceKm: parseNumber(getValue(record, ["Distance (km)"])),
      maxSpeedKmh: parseNumber(getValue(record, ["Max. Speed (km/hr)"])),
      avgSpeedKmh: parseNumber(getValue(record, ["Avg. Speed (km/hr)"])),
      flights: parseNumber(getValue(record, ["Flights Climbed"])),
      elevationAscM: parseNumber(getValue(record, ["Elevation Ascended (m)"])),
      elevationDescM: parseNumber(getValue(record, ["Elevation Descended (m)"])),
      stepCount: parseNumber(getValue(record, ["Step Count"])),
      avgCadenceSpm: parseNumber(getValue(record, ["Step Cadence (spm)"])),
      mergeConfidence: 0.85,
      streamCount: 1,
      source: "health_import",
      createdAt: importedAt,
    });
  }

  return results;
}

function pickNumericValue(record: Record<string, string>, aliases: string[]): number | undefined {
  for (const alias of aliases) {
    const value = parseNumber(getValue(record, [alias]));
    if (typeof value === "number") {
      return value;
    }
  }
  return undefined;
}

function parseWorkoutStreamRows(
  filename: string,
  streamType: WorkoutStreamType,
  records: Array<Record<string, string>>,
): StreamBucket | null {
  const keyInfo = extractWorkoutKeyFromFilename(filename);
  if (!keyInfo.workoutKey || !keyInfo.stem) {
    return null;
  }

  const rows: WorkoutStreamPoint[] = [];

  for (const record of records) {
    const timestampDate = parseDateValue(
      getValue(record, ["Date/Time", "Timestamp", "time", "date"]),
    );

    if (!timestampDate) {
      continue;
    }

    let row: WorkoutStreamPoint = {
      timestamp: timestampDate.toISOString(),
    };

    if (streamType === "heart_rate" || streamType === "hr_recovery") {
      row = {
        ...row,
        min: pickNumericValue(record, ["Min (count/min)", "min"]),
        max: pickNumericValue(record, ["Max (count/min)", "max"]),
        avg: pickNumericValue(record, ["Avg (count/min)", "avg"]),
        context: getValue(record, ["Context"]),
      };
    } else if (streamType === "distance") {
      row = {
        ...row,
        value: pickNumericValue(record, ["Walking + Running Distance (km)", "distance"]),
      };
    } else if (streamType === "steps") {
      row = {
        ...row,
        value: pickNumericValue(record, ["Step Count (count)", "stepCount"]),
      };
    } else if (streamType === "active_energy") {
      row = {
        ...row,
        value: pickNumericValue(record, ["Active Energy (kJ)", "activeenergy"]),
      };
    } else if (streamType === "resting_energy") {
      row = {
        ...row,
        value: pickNumericValue(record, ["Resting Energy (kJ)", "restingenergy"]),
      };
    } else {
      row = {
        ...row,
        value: pickNumericValue(record, ["value", "count", "avg"]),
      };
    }

    if (
      typeof row.value === "number" ||
      typeof row.avg === "number" ||
      typeof row.min === "number" ||
      typeof row.max === "number"
    ) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return null;
  }

  const sorted = rows.slice().sort(
    (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );

  return {
    workoutKey: keyInfo.workoutKey,
    streamType,
    sourceFile: filename,
    stem: keyInfo.stem,
    rows: sorted,
    startMs: new Date(sorted[0].timestamp).getTime(),
    endMs: new Date(sorted[sorted.length - 1].timestamp).getTime(),
  };
}

function parseFile(input: HealthImportInputFile, existingHashes: Set<string>): ParsedFile {
  const importedAt = new Date().toISOString();
  const fileHash = hashText(`${input.filename}\n${input.csv}`);
  const fileId = fileHash.slice(0, 24);

  const rows = parseCsvRows(input.csv);
  const headers = rows.length > 0 ? rows[0] : [];
  const roleInfo = classifyFile(input.filename, headers);
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  const records = rows.slice(1).map((row) => toRecord(normalizedHeaders, row));

  const file: HealthRawFile = {
    id: fileId,
    hash: fileHash,
    filename: input.filename,
    fileType: roleInfo.role,
    rowCount: records.length,
    importedAt,
    ignoredReason: roleInfo.ignoredReason,
  };

  if (existingHashes.has(fileHash)) {
    return {
      file: {
        ...file,
        fileType: "ignored",
        ignoredReason: "duplicate file hash",
      },
      dailyHealth: [],
      workouts: [],
      streams: [],
      rawRows: [],
    };
  }

  if (roleInfo.role === "ignored" || roleInfo.role === "unknown") {
    return {
      file,
      dailyHealth: [],
      workouts: [],
      streams: [],
      rawRows: [],
    };
  }

  const rawRows: HealthRawRow[] = records.map((record, index) => {
    const keyCandidate = extractWorkoutKeyFromFilename(input.filename).workoutKey;
    const timestamp = getValue(record, ["Date/Time", "Timestamp", "Start", "date"]);
    const timestampIso = parseDateValue(timestamp)?.toISOString();
    return {
      id: hashText(`${fileId}|${index}|${JSON.stringify(record)}`).slice(0, 24),
      fileId,
      rowIndex: index,
      timestamp: timestampIso,
      workoutKey: keyCandidate,
      values: Object.fromEntries(
        Object.entries(record).map(([key, value]) => [key, value || ""]),
      ),
    };
  });

  if (roleInfo.role === "aggregate") {
    return {
      file,
      dailyHealth: parseAggregateRows(input.filename, records, importedAt),
      workouts: [],
      streams: [],
      rawRows,
    };
  }

  if (roleInfo.role === "workout_summary") {
    return {
      file,
      dailyHealth: [],
      workouts: parseWorkoutSummaryRows(records, importedAt),
      streams: [],
      rawRows,
    };
  }

  if (roleInfo.role === "workout_stream") {
    const stream = parseWorkoutStreamRows(input.filename, roleInfo.streamType || "other", records);
    return {
      file,
      dailyHealth: [],
      workouts: [],
      streams: stream
        ? [
            {
              id: hashText(`${stream.workoutKey}|${stream.streamType}|${stream.sourceFile}`).slice(0, 24),
              workoutKey: stream.workoutKey,
              streamType: stream.streamType,
              sourceFile: stream.sourceFile,
              startedAt: stream.rows[0]?.timestamp,
              endedAt: stream.rows[stream.rows.length - 1]?.timestamp,
              rows: stream.rows,
            },
          ]
        : [],
      rawRows,
    };
  }

  return {
    file,
    dailyHealth: [],
    workouts: [],
    streams: [],
    rawRows,
  };
}

type StreamMetrics = {
  distanceKm?: number;
  stepCount?: number;
  activeEnergyKj?: number;
  restingEnergyKj?: number;
  flights?: number;
  elevationAscM?: number;
  hrMin?: number;
  hrMax?: number;
  hrAvg?: number;
  avgCadenceSpm?: number;
  avgSpeedKmh?: number;
  maxSpeedKmh?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function workoutStemFromKey(workoutKey: string): string {
  return workoutKey.replace(/-\d{8}_\d{6}$/i, "");
}

function getRowWeightMinutes(rows: WorkoutStreamPoint[], index: number): number {
  const currentMs = new Date(rows[index].timestamp).getTime();
  const nextMs =
    index < rows.length - 1
      ? new Date(rows[index + 1].timestamp).getTime()
      : Number.NaN;

  if (!Number.isFinite(currentMs) || !Number.isFinite(nextMs)) {
    return 1;
  }

  return clamp((nextMs - currentMs) / 60_000, 0.5, 5);
}

function flattenSeries(
  streams: WorkoutStream[],
  streamTypes: WorkoutStreamType[],
): WorkoutStreamPoint[] {
  return streams
    .filter((stream) => streamTypes.includes(stream.streamType))
    .flatMap((stream) => stream.rows)
    .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());
}

function summarizeStreamMetrics(streams: WorkoutStream[]): StreamMetrics {
  const distanceRows = flattenSeries(streams, ["distance"]);
  const stepRows = flattenSeries(streams, ["steps"]);
  const hrRows = flattenSeries(streams, ["heart_rate", "hr_recovery"]);

  const activeEnergyKj = streams
    .filter((stream) => stream.streamType === "active_energy")
    .reduce((sum, stream) => sum + stream.rows.reduce((rowSum, row) => rowSum + (row.value || 0), 0), 0);

  const restingEnergyKj = streams
    .filter((stream) => stream.streamType === "resting_energy")
    .reduce((sum, stream) => sum + stream.rows.reduce((rowSum, row) => rowSum + (row.value || 0), 0), 0);

  const flights = streams
    .filter((stream) => stream.streamType === "other" && /flights?\s*climbed/i.test(stream.sourceFile))
    .reduce((sum, stream) => sum + stream.rows.reduce((rowSum, row) => rowSum + (row.value || 0), 0), 0);

  let distanceKm = 0;
  let distanceHours = 0;
  let maxSpeedKmh = 0;
  for (let index = 0; index < distanceRows.length; index += 1) {
    const distance = distanceRows[index].value || 0;
    const weightMin = getRowWeightMinutes(distanceRows, index);
    distanceKm += distance;
    distanceHours += weightMin / 60;

    if (distance > 0 && weightMin > 0) {
      const intervalSpeed = distance / (weightMin / 60);
      maxSpeedKmh = Math.max(maxSpeedKmh, intervalSpeed);
    }
  }
  const avgSpeedKmh = distanceHours > 0 ? distanceKm / distanceHours : undefined;

  let stepCount = 0;
  let stepMinutes = 0;
  for (let index = 0; index < stepRows.length; index += 1) {
    const steps = stepRows[index].value || 0;
    const weightMin = getRowWeightMinutes(stepRows, index);
    stepCount += steps;
    stepMinutes += weightMin;
  }
  const avgCadenceSpm = stepMinutes > 0 ? stepCount / stepMinutes : undefined;

  let hrMin = Number.POSITIVE_INFINITY;
  let hrMax = Number.NEGATIVE_INFINITY;
  let hrWeightedSum = 0;
  let hrWeight = 0;

  for (let index = 0; index < hrRows.length; index += 1) {
    const row = hrRows[index];
    if (typeof row.min === "number") {
      hrMin = Math.min(hrMin, row.min);
    }
    if (typeof row.max === "number") {
      hrMax = Math.max(hrMax, row.max);
    }

    const rowAvg =
      typeof row.avg === "number"
        ? row.avg
        : typeof row.min === "number" && typeof row.max === "number"
        ? (row.min + row.max) / 2
        : undefined;
    if (typeof rowAvg === "number") {
      const weight = getRowWeightMinutes(hrRows, index);
      hrWeightedSum += rowAvg * weight;
      hrWeight += weight;
    }
  }

  const normalizedDistance = distanceKm > 0 ? distanceKm : undefined;
  const normalizedSteps = stepCount > 0 ? stepCount : undefined;
  const normalizedActiveEnergy = activeEnergyKj > 0 ? activeEnergyKj : undefined;
  const normalizedRestingEnergy = restingEnergyKj > 0 ? restingEnergyKj : undefined;
  const normalizedFlights = flights > 0 ? flights : undefined;

  return {
    distanceKm: normalizedDistance,
    stepCount: normalizedSteps,
    activeEnergyKj: normalizedActiveEnergy,
    restingEnergyKj: normalizedRestingEnergy,
    flights: normalizedFlights,
    elevationAscM:
      typeof normalizedFlights === "number" && normalizedFlights > 0
        ? normalizedFlights * 3
        : undefined,
    hrMin: Number.isFinite(hrMin) ? hrMin : undefined,
    hrMax: Number.isFinite(hrMax) ? hrMax : undefined,
    hrAvg: hrWeight > 0 ? hrWeightedSum / hrWeight : undefined,
    avgCadenceSpm:
      typeof avgCadenceSpm === "number" && avgCadenceSpm > 0 ? avgCadenceSpm : undefined,
    avgSpeedKmh:
      typeof avgSpeedKmh === "number" && avgSpeedKmh > 0 ? avgSpeedKmh : undefined,
    maxSpeedKmh: maxSpeedKmh > 0 ? maxSpeedKmh : undefined,
  };
}

function computeMergeConfidence(
  hasCanonicalSummary: boolean,
  linkedStreamCount: number,
  exactKeyMatch: boolean,
): number {
  let confidence = hasCanonicalSummary ? 0.78 : 0.6;
  confidence += Math.min(linkedStreamCount, 6) * 0.03;
  if (exactKeyMatch) {
    confidence += 0.1;
  }
  return clamp(confidence, 0.55, 0.99);
}

function buildWorkoutDetail(workout: WorkoutEntry, streams: WorkoutStream[]): WorkoutDetail {
  return {
    workoutId: workout.id,
    workoutKey: workout.sourceWorkoutKey || `workout-${workout.id}`,
    workoutType: workout.type,
    startedAt: workout.startedAt,
    endedAt: workout.endedAt,
    durationMin: workout.durationMin,
    mergeConfidence: workout.mergeConfidence || 0.7,
    streamCount: workout.streamCount || streams.length,
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
    hrAvg: workout.hrAvg,
    sourceFiles: [...new Set(streams.map((stream) => stream.sourceFile))],
    streams,
    heartRateSeries: flattenSeries(streams, ["heart_rate", "hr_recovery"]),
    distanceSeries: flattenSeries(streams, ["distance"]),
    stepSeries: flattenSeries(streams, ["steps"]),
    activeEnergySeries: flattenSeries(streams, ["active_energy"]),
    restingEnergySeries: flattenSeries(streams, ["resting_energy"]),
  };
}

function preferCanonicalMetric(
  canonicalValue: number | undefined,
  inferredValue: number | undefined,
): number | undefined {
  if (typeof canonicalValue === "number" && canonicalValue > 0) {
    return canonicalValue;
  }
  return inferredValue;
}

function mergeWorkouts(
  canonicalWorkouts: WorkoutEntry[],
  streams: WorkoutStream[],
  importedAt: string,
): { workouts: WorkoutEntry[]; details: WorkoutDetail[]; linkedStreams: number } {
  const detailsById = new Map<string, WorkoutDetail>();
  const canonical = canonicalWorkouts.map((workout) => ({ ...workout }));
  let linkedStreams = 0;

  const streamByKey = new Map<string, WorkoutStream[]>();
  for (const stream of streams) {
    if (!streamByKey.has(stream.workoutKey)) {
      streamByKey.set(stream.workoutKey, []);
    }
    streamByKey.get(stream.workoutKey)!.push(stream);
  }

  const unresolvedStreams = new Map<string, WorkoutStream[]>(streamByKey);

  for (const workout of canonical) {
    const startMs = new Date(workout.startedAt).getTime();
    const hasExplicitKeyMatch =
      Boolean(workout.sourceWorkoutKey) && unresolvedStreams.has(workout.sourceWorkoutKey || "");
    let matchedKey = hasExplicitKeyMatch ? workout.sourceWorkoutKey : undefined;

    if (!matchedKey) {
      let bestDiff = Number.POSITIVE_INFINITY;
      for (const [key, streamList] of unresolvedStreams.entries()) {
        const expectedType = inferWorkoutType(workoutStemFromKey(key));
        if (expectedType !== workout.type) {
          continue;
        }

        const keyStart = streamList
          .map((stream) => new Date(stream.startedAt || 0).getTime())
          .filter((value) => Number.isFinite(value))
          .sort((left, right) => left - right)[0];

        if (!Number.isFinite(keyStart)) {
          continue;
        }

        const diff = Math.abs(keyStart - startMs);
        if (diff <= 3 * 60_000 && diff < bestDiff) {
          bestDiff = diff;
          matchedKey = key;
        }
      }
    }

    const linked = matchedKey ? unresolvedStreams.get(matchedKey) || [] : [];
    if (matchedKey) {
      unresolvedStreams.delete(matchedKey);
    }

    const metrics = summarizeStreamMetrics(linked);

    workout.sourceWorkoutKey = workout.sourceWorkoutKey || matchedKey;
    workout.distanceKm = preferCanonicalMetric(workout.distanceKm, metrics.distanceKm);
    workout.avgSpeedKmh = preferCanonicalMetric(workout.avgSpeedKmh, metrics.avgSpeedKmh);
    workout.maxSpeedKmh = preferCanonicalMetric(workout.maxSpeedKmh, metrics.maxSpeedKmh);
    workout.stepCount = preferCanonicalMetric(workout.stepCount, metrics.stepCount);
    workout.avgCadenceSpm = preferCanonicalMetric(workout.avgCadenceSpm, metrics.avgCadenceSpm);
    workout.activeEnergyKj = preferCanonicalMetric(workout.activeEnergyKj, metrics.activeEnergyKj);
    workout.restingEnergyKj = preferCanonicalMetric(workout.restingEnergyKj, metrics.restingEnergyKj);
    workout.flights = preferCanonicalMetric(workout.flights, metrics.flights);
    workout.elevationAscM = preferCanonicalMetric(workout.elevationAscM, metrics.elevationAscM);
    workout.activeKcal =
      workout.activeKcal ??
      (typeof workout.activeEnergyKj === "number" ? workout.activeEnergyKj / 4.184 : undefined);
    workout.hrMin = preferCanonicalMetric(workout.hrMin, metrics.hrMin);
    workout.hrMax = preferCanonicalMetric(workout.hrMax, metrics.hrMax);
    workout.hrAvg = preferCanonicalMetric(workout.hrAvg, metrics.hrAvg);
    workout.avgHeartRate = workout.avgHeartRate ?? workout.hrAvg;
    workout.streamCount = 1 + linked.length;
    workout.mergeConfidence = computeMergeConfidence(
      true,
      linked.length,
      Boolean(hasExplicitKeyMatch),
    );

    detailsById.set(workout.id, buildWorkoutDetail(workout, linked));
    linkedStreams += linked.length;
  }

  for (const [workoutKey, streamList] of unresolvedStreams.entries()) {
    const allRows = streamList
      .flatMap((stream) => stream.rows)
      .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());

    const startedAt = allRows[0]?.timestamp;
    const endedAt = allRows[allRows.length - 1]?.timestamp;
    if (!startedAt || !endedAt) {
      continue;
    }

    const metrics = summarizeStreamMetrics(streamList);
    const durationMin = Math.max(1, (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000);
    const stem = workoutStemFromKey(workoutKey);

    const id = hashText(`inferred|${workoutKey}|${startedAt}|${endedAt}`).slice(0, 24);
    const inferred: WorkoutEntry = {
      id,
      sourceWorkoutKey: workoutKey,
      type: inferWorkoutType(stem),
      startedAt,
      endedAt,
      durationMin,
      distanceKm: metrics.distanceKm,
      avgSpeedKmh: metrics.avgSpeedKmh,
      maxSpeedKmh: metrics.maxSpeedKmh,
      stepCount: metrics.stepCount,
      avgCadenceSpm: metrics.avgCadenceSpm,
      activeEnergyKj: metrics.activeEnergyKj,
      restingEnergyKj: metrics.restingEnergyKj,
      flights: metrics.flights,
      elevationAscM: metrics.elevationAscM,
      activeKcal: metrics.activeEnergyKj ? metrics.activeEnergyKj / 4.184 : undefined,
      hrMin: metrics.hrMin,
      hrMax: metrics.hrMax,
      hrAvg: metrics.hrAvg,
      avgHeartRate: metrics.hrAvg,
      streamCount: streamList.length,
      mergeConfidence: computeMergeConfidence(false, streamList.length, true),
      source: "health_import",
      createdAt: importedAt,
    };

    canonical.push(inferred);
    detailsById.set(id, buildWorkoutDetail(inferred, streamList));
    linkedStreams += streamList.length;
  }

  return {
    workouts: canonical.sort((left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime()),
    details: [...detailsById.values()],
    linkedStreams,
  };
}

export function importHealthFiles(
  current: AppData,
  files: HealthImportInputFile[],
): { nextData: AppData; summary: HealthImportSummary } {
  const existingHashes = new Set(current.healthRawFiles.map((file) => file.hash));
  const parsedFiles: ParsedFile[] = [];

  for (const file of files) {
    if (!file.filename || typeof file.csv !== "string" || file.csv.trim().length === 0) {
      continue;
    }

    const parsed = parseFile(file, existingHashes);
    parsedFiles.push(parsed);
    if (parsed.file.fileType !== "ignored") {
      existingHashes.add(parsed.file.hash);
    }
  }

  const importedAt = new Date().toISOString();
  const dailyHealthMerged = mergeDailyHealth([
    ...current.dailyHealth,
    ...parsedFiles.flatMap((entry) => entry.dailyHealth),
  ]);

  const existingWorkouts = [...current.workouts];
  const canonicalFromFiles = parsedFiles.flatMap((entry) => entry.workouts);
  const streamFromFiles = parsedFiles.flatMap((entry) => entry.streams);

  const canonicalById = new Map(existingWorkouts.map((workout) => [workout.id, workout]));
  for (const workout of canonicalFromFiles) {
    canonicalById.set(workout.id, workout);
  }

  const merged = mergeWorkouts([...canonicalById.values()], streamFromFiles, importedAt);

  const detailById = new Map(current.workoutDetails.map((detail) => [detail.workoutId, detail]));
  for (const detail of merged.details) {
    detailById.set(detail.workoutId, detail);
  }

  const rawFileById = new Map(current.healthRawFiles.map((file) => [file.id, file]));
  for (const parsed of parsedFiles) {
    rawFileById.set(parsed.file.id, parsed.file);
  }

  const rawRowById = new Map(current.healthRawRows.map((row) => [row.id, row]));
  for (const parsed of parsedFiles) {
    for (const row of parsed.rawRows) {
      rawRowById.set(row.id, row);
    }
  }

  const filesProcessed = parsedFiles.filter((entry) => entry.file.fileType !== "ignored").length;
  const filesIgnored = parsedFiles.filter((entry) => entry.file.fileType === "ignored").length;

  const nextData: AppData = {
    ...current,
    dailyHealth: dailyHealthMerged,
    workouts: merged.workouts,
    workoutDetails: [...detailById.values()],
    healthRawFiles: [...rawFileById.values()],
    healthRawRows: [...rawRowById.values()],
  };

  return {
    nextData,
    summary: {
      importedHealthDays: parsedFiles.flatMap((entry) => entry.dailyHealth).length,
      importedWorkouts: Math.max(0, merged.workouts.length - current.workouts.length),
      filesProcessed,
      filesSkipped: files.length - parsedFiles.length,
      filesIgnored,
      linkedStreams: merged.linkedStreams,
    },
  };
}

export function importSingleHealthCsv(
  current: AppData,
  csv: string,
  filename = "HealthAutoExport.csv",
): { nextData: AppData; summary: HealthImportSummary } {
  return importHealthFiles(current, [{ filename, csv }]);
}
