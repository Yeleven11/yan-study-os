import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
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

const DATA_DIRECTORY = path.join(process.cwd(), "runtime-data");
const DATA_FILE_PATH = path.join(DATA_DIRECTORY, "yan-study-os.json");
const EXAMS_BACKUP_FILE_PATH = path.join(
  DATA_DIRECTORY,
  "yan-study-os-exams-backup.json",
);

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


function normalizeDeadLetters(items: AppData["healthImportDeadLetters"] | undefined): AppData["healthImportDeadLetters"] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && typeof item.id === "string" && typeof item.channel === "string" && typeof item.requestHash === "string" && typeof item.firstFailedAt === "string" && typeof item.lastFailedAt === "string" && typeof item.retryCount === "number" && typeof item.errorCode === "string" && typeof item.errorMessage === "string")
    .sort((left, right) => new Date(left.lastFailedAt).getTime() - new Date(right.lastFailedAt).getTime());
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
    healthImportDeadLetters: normalizeDeadLetters(data.healthImportDeadLetters),
    goals: normalizeGoals(data.goals),
    settings: {
      timezone: data.settings?.timezone || "Europe/Berlin",
      examHighlightColor: data.settings?.examHighlightColor || "#00F0FF",
    },
  };
}

async function ensureDataFile(): Promise<void> {
  await mkdir(DATA_DIRECTORY, { recursive: true });

  try {
    await readFile(DATA_FILE_PATH, "utf-8");
  } catch {
    const seeded = createDefaultAppData("Europe/Berlin");
    await writeFile(DATA_FILE_PATH, JSON.stringify(seeded, null, 2), "utf-8");
  }
}

async function readData(): Promise<AppData> {
  await ensureDataFile();
  const raw = await readFile(DATA_FILE_PATH, "utf-8");

  try {
    const parsed = JSON.parse(raw) as AppData;
    return normalizeData(parsed);
  } catch {
    const seeded = createDefaultAppData("Europe/Berlin");
    await writeData(seeded);
    return seeded;
  }
}

async function writeData(data: AppData): Promise<void> {
  await ensureDataFile();
  const normalized = normalizeData(data);

  writeQueue = writeQueue.then(() =>
    writeFile(DATA_FILE_PATH, JSON.stringify(normalized, null, 2), "utf-8"),
  );

  await writeQueue;
}

async function writeExamBackup(data: AppData): Promise<void> {
  await ensureDataFile();
  const normalized = normalizeData(data);
  const payload = {
    savedAt: new Date().toISOString(),
    exams: normalized.exams,
  };

  writeQueue = writeQueue.then(() =>
    writeFile(EXAMS_BACKUP_FILE_PATH, JSON.stringify(payload, null, 2), "utf-8"),
  );

  await writeQueue;
}

function createLocalFileStore(): DashboardStore {
  return {
    async getData() {
      return readData();
    },
    async saveData(data) {
      await writeData(data);
    },
    async appendStudySession(session) {
      const data = await readData();
      data.studySessions = [...data.studySessions, session];
      await writeData(data);
    },
    async addTodo(todo) {
      const data = await readData();
      data.todos = sortTodos([...data.todos, todo]);
      await writeData(data);
    },
    async updateTodo(id, patch) {
      const data = await readData();
      data.todos = sortTodos(
        data.todos.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)),
      );
      await writeData(data);
    },
    async archiveTodo(id) {
      const data = await readData();
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
      await writeData(data);
    },
    async restoreTodo(id) {
      const data = await readData();
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
      await writeData(data);
    },
    async updateExams(exams) {
      const data = await readData();
      data.exams = [...exams].sort(
        (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
      );
      await writeData(data);
      await writeExamBackup(data);
    },
    async appendHealthRawFiles(files) {
      if (files.length === 0) {
        return;
      }

      const data = await readData();
      const byId = new Map(data.healthRawFiles.map((file) => [file.id, file]));
      for (const file of files) {
        byId.set(file.id, file);
      }
      data.healthRawFiles = [...byId.values()];
      await writeData(data);
    },
    async appendHealthRawRows(rows) {
      if (rows.length === 0) {
        return;
      }

      const data = await readData();
      const byId = new Map(data.healthRawRows.map((row) => [row.id, row]));
      for (const row of rows) {
        byId.set(row.id, row);
      }
      data.healthRawRows = [...byId.values()];
      await writeData(data);
    },
    async upsertWorkoutDetails(details) {
      if (details.length === 0) {
        return;
      }

      const data = await readData();
      const byId = new Map(data.workoutDetails.map((detail) => [detail.workoutId, detail]));
      for (const detail of details) {
        byId.set(detail.workoutId, detail);
      }
      data.workoutDetails = [...byId.values()];
      await writeData(data);
    },
  };
}

export { createLocalFileStore };
