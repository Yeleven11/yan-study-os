import { neon } from "@neondatabase/serverless";
import { createDefaultAppData, createDefaultPerformanceGoals } from "@/lib/constants";
import { sortTodos } from "@/lib/dashboard-utils";
import { normalizeFlashcards } from "@/lib/flashcards/scheduler";
import type {
  AppData,
  DailyHealthFact,
  HealthRawFile,
  HealthRawRow,
  PerformanceGoals,
  WorkoutDetail,
  WorkoutEntry,
} from "@/lib/types";
import type { DashboardStore } from "./types";

const DEFAULT_TIMEZONE = "Europe/Berlin";
const DEFAULT_TABLE = "yan_study_state";
const DEFAULT_IDEMPOTENCY_TABLE = "yan_study_idempotency";
const MAX_IDEMPOTENCY_RECORDS = 1000;

let schemaReadyPromise: Promise<void> | null = null;
let writeQueue = Promise.resolve();

function normalizeGoals(goals: Partial<PerformanceGoals> | undefined): PerformanceGoals {
  const defaults = createDefaultPerformanceGoals();
  return {
    sleepHoursTarget:
      typeof goals?.sleepHoursTarget === "number" && Number.isFinite(goals.sleepHoursTarget)
        ? goals.sleepHoursTarget
        : defaults.sleepHoursTarget,
    baselineStudyHours:
      typeof goals?.baselineStudyHours === "number" && Number.isFinite(goals.baselineStudyHours)
        ? goals.baselineStudyHours
        : defaults.baselineStudyHours,
    weeklyWorkoutTarget:
      typeof goals?.weeklyWorkoutTarget === "number" &&
      Number.isFinite(goals.weeklyWorkoutTarget)
        ? goals.weeklyWorkoutTarget
        : defaults.weeklyWorkoutTarget,
    weekdayWakeTime:
      typeof goals?.weekdayWakeTime === "string" && goals.weekdayWakeTime.trim().length > 0
        ? goals.weekdayWakeTime
        : defaults.weekdayWakeTime,
    weekendWakeTime:
      typeof goals?.weekendWakeTime === "string" && goals.weekendWakeTime.trim().length > 0
        ? goals.weekendWakeTime
        : defaults.weekendWakeTime,
    preferredBedtimeStart:
      typeof goals?.preferredBedtimeStart === "string" &&
      goals.preferredBedtimeStart.trim().length > 0
        ? goals.preferredBedtimeStart
        : defaults.preferredBedtimeStart,
    preferredBedtimeEnd:
      typeof goals?.preferredBedtimeEnd === "string" && goals.preferredBedtimeEnd.trim().length > 0
        ? goals.preferredBedtimeEnd
        : defaults.preferredBedtimeEnd,
    ageYears:
      typeof goals?.ageYears === "number" && Number.isFinite(goals.ageYears)
        ? goals.ageYears
        : defaults.ageYears,
  };
}

function normalizeDailyHealth(items: DailyHealthFact[] | undefined): DailyHealthFact[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter(
      (item) =>
        item &&
        typeof item.date === "string" &&
        typeof item.sleepHours === "number" &&
        Number.isFinite(item.sleepHours),
    )
    .map((item) => ({
      ...item,
      source: item.source || "manual",
      createdAt: item.createdAt || new Date().toISOString(),
    }))
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
}

function normalizeWorkouts(items: WorkoutEntry[] | undefined): WorkoutEntry[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.type === "string" &&
        typeof item.startedAt === "string" &&
        typeof item.endedAt === "string" &&
        typeof item.durationMin === "number" &&
        Number.isFinite(item.durationMin),
    )
    .map((item) => ({
      ...item,
      source: item.source || "manual",
      createdAt: item.createdAt || item.startedAt,
    }))
    .sort(
      (left, right) =>
        new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
    );
}

function normalizeWorkoutDetails(items: WorkoutDetail[] | undefined): WorkoutDetail[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter(
      (item) =>
        item &&
        typeof item.workoutId === "string" &&
        typeof item.workoutKey === "string" &&
        typeof item.workoutType === "string" &&
        typeof item.startedAt === "string" &&
        typeof item.endedAt === "string" &&
        typeof item.durationMin === "number" &&
        typeof item.mergeConfidence === "number" &&
        typeof item.streamCount === "number" &&
        Array.isArray(item.sourceFiles) &&
        Array.isArray(item.streams),
    )
    .map((item) => ({
      ...item,
      sourceFiles: item.sourceFiles.filter((value) => typeof value === "string"),
      streams: item.streams
        .filter(
          (stream) =>
            stream &&
            typeof stream.id === "string" &&
            typeof stream.workoutKey === "string" &&
            typeof stream.streamType === "string" &&
            typeof stream.sourceFile === "string" &&
            Array.isArray(stream.rows),
        )
        .map((stream) => ({
          ...stream,
          rows: stream.rows.filter(
            (row) =>
              row &&
              typeof row.timestamp === "string" &&
              (typeof row.value === "number" ||
                typeof row.avg === "number" ||
                typeof row.min === "number" ||
                typeof row.max === "number"),
          ),
        })),
    }));
}

function normalizeRawFiles(items: HealthRawFile[] | undefined): HealthRawFile[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.hash === "string" &&
        typeof item.filename === "string" &&
        typeof item.fileType === "string" &&
        typeof item.rowCount === "number" &&
        typeof item.importedAt === "string",
    )
    .sort(
      (left, right) =>
        new Date(left.importedAt).getTime() - new Date(right.importedAt).getTime(),
    );
}

function normalizeRawRows(items: HealthRawRow[] | undefined): HealthRawRow[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.fileId === "string" &&
        typeof item.rowIndex === "number" &&
        item.values &&
        typeof item.values === "object",
    )
    .map((item) => ({
      ...item,
      values: Object.fromEntries(
        Object.entries(item.values).filter(
          ([key, value]) => typeof key === "string" && typeof value === "string",
        ),
      ),
    }));
}

function normalizeData(data: AppData): AppData {
  return {
    exams: [...data.exams].sort(
      (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    ),
    studySessions: [...data.studySessions].sort(
      (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
    ),
    todos: sortTodos(data.todos),
    flashcards: normalizeFlashcards(data.flashcards),
    dailyHealth: normalizeDailyHealth(data.dailyHealth),
    workouts: normalizeWorkouts(data.workouts),
    workoutDetails: normalizeWorkoutDetails(data.workoutDetails),
    healthRawFiles: normalizeRawFiles(data.healthRawFiles),
    healthRawRows: normalizeRawRows(data.healthRawRows),
    goals: normalizeGoals(data.goals),
    settings: {
      timezone: data.settings?.timezone || DEFAULT_TIMEZONE,
      examHighlightColor: data.settings?.examHighlightColor || "#00F0FF",
    },
  };
}

function getStateTableName(): string {
  const raw = (process.env.NEON_STATE_TABLE || DEFAULT_TABLE).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(raw)) {
    throw new Error("NEON_STATE_TABLE must be a valid SQL identifier");
  }
  return raw;
}

function getIdempotencyTableName(): string {
  const raw = (process.env.NEON_IDEMPOTENCY_TABLE || DEFAULT_IDEMPOTENCY_TABLE).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(raw)) {
    throw new Error("NEON_IDEMPOTENCY_TABLE must be a valid SQL identifier");
  }
  return raw;
}

function getDatabaseUrl(): string {
  const candidates = [
    process.env.NEON_DATABASE_URL,
    process.env.DATABASE_URL,
    process.env.STORAGE_URL,
    process.env.POSTGRES_URL,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  throw new Error(
    "Neon backend requires one of: NEON_DATABASE_URL, DATABASE_URL, STORAGE_URL, POSTGRES_URL",
  );
}

function getSqlClient() {
  return neon(getDatabaseUrl());
}

async function ensureSchema(): Promise<void> {
  if (schemaReadyPromise) {
    return schemaReadyPromise;
  }

  const table = getStateTableName();
  const idempotencyTable = getIdempotencyTableName();

  schemaReadyPromise = (async () => {
    const sql = getSqlClient();
    await sql.query(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id SMALLINT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await sql.query(`
      CREATE TABLE IF NOT EXISTS ${idempotencyTable} (
        scope TEXT NOT NULL,
        key TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        status SMALLINT NOT NULL,
        body JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (scope, key)
      )
    `);
  })();

  return schemaReadyPromise;
}

function parseStoredAppData(value: unknown): AppData | null {
  if (value == null) {
    return null;
  }

  const parsed =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        })()
      : value;

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  return normalizeData(parsed as AppData);
}

async function writeDataDirect(data: AppData): Promise<void> {
  await ensureSchema();

  const sql = getSqlClient();
  const table = getStateTableName();
  const normalized = normalizeData(data);

  await sql.query(
    `
      INSERT INTO ${table} (id, data, updated_at)
      VALUES (1, $1::jsonb, NOW())
      ON CONFLICT (id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `,
    [JSON.stringify(normalized)],
  );
}

async function readData(): Promise<AppData> {
  await ensureSchema();

  const sql = getSqlClient();
  const table = getStateTableName();
  const rows = await sql.query(`SELECT data FROM ${table} WHERE id = 1 LIMIT 1`);
  const parsed = parseStoredAppData((rows[0] as { data?: unknown } | undefined)?.data);

  if (parsed) {
    return parsed;
  }

  const seeded = createDefaultAppData(DEFAULT_TIMEZONE);
  await writeDataDirect(seeded);
  return seeded;
}

async function runQueuedWrite(task: () => Promise<void>): Promise<void> {
  writeQueue = writeQueue.then(task, task);
  await writeQueue;
}

async function mutateData(mutator: (data: AppData) => void | Promise<void>): Promise<void> {
  await runQueuedWrite(async () => {
    const data = await readData();
    await mutator(data);
    await writeDataDirect(data);
  });
}

function createNeonStore(): DashboardStore {
  return {
    async getData() {
      await writeQueue.catch(() => undefined);
      return readData();
    },
    async saveData(data) {
      await runQueuedWrite(async () => {
        await writeDataDirect(data);
      });
    },
    async appendStudySession(session) {
      await mutateData((data) => {
        data.studySessions = [...data.studySessions, session];
      });
    },
    async addTodo(todo) {
      await mutateData((data) => {
        data.todos = sortTodos([...data.todos, todo]);
      });
    },
    async updateTodo(id, patch) {
      await mutateData((data) => {
        data.todos = sortTodos(
          data.todos.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)),
        );
      });
    },
    async archiveTodo(id) {
      await mutateData((data) => {
        data.todos = sortTodos(
          data.todos.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  archived: true,
                  completed: true,
                  completedAt: todo.completedAt ?? new Date().toISOString(),
                }
              : todo,
          ),
        );
      });
    },
    async restoreTodo(id) {
      await mutateData((data) => {
        data.todos = sortTodos(
          data.todos.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  archived: false,
                  completed: false,
                  completedAt: undefined,
                }
              : todo,
          ),
        );
      });
    },
    async updateExams(exams) {
      await mutateData((data) => {
        data.exams = [...exams].sort(
          (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
        );
      });
    },
    async appendHealthRawFiles(files) {
      if (files.length === 0) {
        return;
      }

      await mutateData((data) => {
        const byId = new Map(data.healthRawFiles.map((file) => [file.id, file]));
        for (const file of files) {
          byId.set(file.id, file);
        }
        data.healthRawFiles = [...byId.values()];
      });
    },
    async appendHealthRawRows(rows) {
      if (rows.length === 0) {
        return;
      }

      await mutateData((data) => {
        const byId = new Map(data.healthRawRows.map((row) => [row.id, row]));
        for (const row of rows) {
          byId.set(row.id, row);
        }
        data.healthRawRows = [...byId.values()];
      });
    },
    async upsertWorkoutDetails(details) {
      if (details.length === 0) {
        return;
      }

      await mutateData((data) => {
        const byId = new Map(data.workoutDetails.map((detail) => [detail.workoutId, detail]));
        for (const detail of details) {
          byId.set(detail.workoutId, detail);
        }
        data.workoutDetails = [...byId.values()];
      });
    },
    async getIdempotencyRecord(scope, key) {
      await ensureSchema();
      const sql = getSqlClient();
      const table = getIdempotencyTableName();
      await sql.query(`DELETE FROM ${table} WHERE expires_at <= NOW()`);
      const rows = await sql.query(
        `SELECT scope, key, payload_hash, status, body, created_at, expires_at
         FROM ${table}
         WHERE scope = $1 AND key = $2
         LIMIT 1`,
        [scope, key],
      );
      const row = rows[0] as
        | {
            scope: string;
            key: string;
            payload_hash: string;
            status: number;
            body: unknown;
            created_at: string;
            expires_at: string;
          }
        | undefined;
      if (!row) {
        return null;
      }
      return {
        scope: row.scope,
        key: row.key,
        payloadHash: row.payload_hash,
        status: row.status,
        body: row.body,
        createdAt: new Date(row.created_at).toISOString(),
        expiresAt: new Date(row.expires_at).toISOString(),
      };
    },
    async putIdempotencyRecord(record) {
      await ensureSchema();
      const sql = getSqlClient();
      const table = getIdempotencyTableName();
      await sql.query(
        `INSERT INTO ${table} (scope, key, payload_hash, status, body, created_at, expires_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::timestamptz, $7::timestamptz)
         ON CONFLICT (scope, key)
         DO UPDATE SET
           payload_hash = EXCLUDED.payload_hash,
           status = EXCLUDED.status,
           body = EXCLUDED.body,
           created_at = EXCLUDED.created_at,
           expires_at = EXCLUDED.expires_at`,
        [
          record.scope,
          record.key,
          record.payloadHash,
          record.status,
          JSON.stringify(record.body),
          record.createdAt,
          record.expiresAt,
        ],
      );
      await sql.query(`DELETE FROM ${table} WHERE expires_at <= NOW()`);
      await sql.query(
        `DELETE FROM ${table}
         WHERE (scope, key) IN (
           SELECT scope, key
           FROM ${table}
           ORDER BY created_at DESC
           OFFSET $1
         )`,
        [MAX_IDEMPOTENCY_RECORDS],
      );
    },
  };
}

export { createNeonStore };
