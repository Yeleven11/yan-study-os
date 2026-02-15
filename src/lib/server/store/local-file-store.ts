import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createDefaultAppData,
  createDefaultPerformanceGoals,
  createDefaultPlannerProfile,
} from "@/lib/constants";
import { sortTodos } from "@/lib/dashboard-utils";
import type {
  AppData,
  DailyHealthFact,
  HealthRawFile,
  HealthRawRow,
  HealthIngestReconcileReport,
  PlannedDayTarget,
  PerformanceGoals,
  PlannerDateOverride,
  PlannerDayTemplate,
  PlannerProfile,
  PlannerRun,
  PlannerTimeWindow,
  PlannerWeights,
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
const MAX_PLANNER_RUNS = 80;
const MAX_PLANNED_TARGETS = 180;
const MAX_HEALTH_INGEST_REPORTS = 90;

let writeQueue = Promise.resolve();

function takeTail<T>(items: T[], max: number): T[] {
  if (items.length <= max) {
    return items;
  }

  return items.slice(items.length - max);
}

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

function normalizePlannerTimeWindows(
  windows: PlannerTimeWindow[] | undefined,
): PlannerTimeWindow[] {
  if (!Array.isArray(windows)) {
    return [];
  }

  return windows
    .filter(
      (window) =>
        window &&
        typeof window.start === "string" &&
        typeof window.end === "string" &&
        /^\d{2}:\d{2}$/.test(window.start) &&
        /^\d{2}:\d{2}$/.test(window.end),
    )
    .map((window) => ({
      start: window.start,
      end: window.end,
      label: typeof window.label === "string" ? window.label : undefined,
    }));
}

function normalizePlannerDayTemplates(
  templates: PlannerDayTemplate[] | undefined,
  defaults: PlannerDayTemplate[],
): PlannerDayTemplate[] {
  const templateByDay = new Map<number, PlannerDayTemplate>();

  for (const template of Array.isArray(templates) ? templates : []) {
    if (!template || typeof template.dayOfWeek !== "number") {
      continue;
    }

    const dayOfWeek = Math.max(0, Math.min(6, Math.floor(template.dayOfWeek)));
    templateByDay.set(dayOfWeek, {
      dayOfWeek,
      studyWindows: normalizePlannerTimeWindows(template.studyWindows),
      blockedWindows: normalizePlannerTimeWindows(template.blockedWindows),
      minStudyHours:
        typeof template.minStudyHours === "number" && Number.isFinite(template.minStudyHours)
          ? template.minStudyHours
          : 0,
      maxStudyHours:
        typeof template.maxStudyHours === "number" && Number.isFinite(template.maxStudyHours)
          ? template.maxStudyHours
          : 8,
      defaultSessionMin:
        typeof template.defaultSessionMin === "number" &&
        Number.isFinite(template.defaultSessionMin)
          ? template.defaultSessionMin
          : 75,
    });
  }

  return defaults.map((defaultTemplate) => ({
    ...defaultTemplate,
    ...(templateByDay.get(defaultTemplate.dayOfWeek) || {}),
    studyWindows:
      templateByDay.get(defaultTemplate.dayOfWeek)?.studyWindows || defaultTemplate.studyWindows,
    blockedWindows:
      templateByDay.get(defaultTemplate.dayOfWeek)?.blockedWindows || defaultTemplate.blockedWindows,
  }));
}

function normalizePlannerOverrides(
  overrides: PlannerDateOverride[] | undefined,
): PlannerDateOverride[] {
  if (!Array.isArray(overrides)) {
    return [];
  }

  return overrides
    .filter((override) => override && typeof override.date === "string")
    .map((override) => ({
      date: override.date,
      unavailable: Boolean(override.unavailable),
      minStudyHours:
        typeof override.minStudyHours === "number" && Number.isFinite(override.minStudyHours)
          ? override.minStudyHours
          : undefined,
      maxStudyHours:
        typeof override.maxStudyHours === "number" && Number.isFinite(override.maxStudyHours)
          ? override.maxStudyHours
          : undefined,
      studyWindows: normalizePlannerTimeWindows(override.studyWindows),
      blockedWindows: normalizePlannerTimeWindows(override.blockedWindows),
      note: typeof override.note === "string" ? override.note : undefined,
    }))
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
}

function normalizePlannerWeights(
  weights: PlannerWeights | undefined,
  defaults: PlannerWeights,
): PlannerWeights {
  if (!weights) {
    return defaults;
  }

  const next = {
    examUrgency:
      typeof weights.examUrgency === "number" && Number.isFinite(weights.examUrgency)
        ? weights.examUrgency
        : defaults.examUrgency,
    todoUrgency:
      typeof weights.todoUrgency === "number" && Number.isFinite(weights.todoUrgency)
        ? weights.todoUrgency
        : defaults.todoUrgency,
    readiness:
      typeof weights.readiness === "number" && Number.isFinite(weights.readiness)
        ? weights.readiness
        : defaults.readiness,
    consistency:
      typeof weights.consistency === "number" && Number.isFinite(weights.consistency)
        ? weights.consistency
        : defaults.consistency,
    lifeBalance:
      typeof weights.lifeBalance === "number" && Number.isFinite(weights.lifeBalance)
        ? weights.lifeBalance
        : defaults.lifeBalance,
  };

  const sum =
    next.examUrgency +
    next.todoUrgency +
    next.readiness +
    next.consistency +
    next.lifeBalance;

  if (sum <= 0) {
    return defaults;
  }

  return {
    examUrgency: next.examUrgency / sum,
    todoUrgency: next.todoUrgency / sum,
    readiness: next.readiness / sum,
    consistency: next.consistency / sum,
    lifeBalance: next.lifeBalance / sum,
  };
}

function normalizePlannerProfile(
  profile: PlannerProfile | undefined,
  timezone: string,
): PlannerProfile {
  const defaults = createDefaultPlannerProfile(timezone);
  const next = profile || defaults;

  return {
    version: 1,
    timezone:
      typeof next.timezone === "string" && next.timezone.trim().length > 0
        ? next.timezone
        : defaults.timezone,
    horizonDays:
      typeof next.horizonDays === "number" && Number.isFinite(next.horizonDays)
        ? Math.max(3, Math.min(14, Math.round(next.horizonDays)))
        : defaults.horizonDays,
    applyMode: next.applyMode === "write_targets" ? "write_targets" : "recommend_only",
    blockMode: next.blockMode === "targets_only" ? "targets_only" : "time_blocks",
    includeWorkoutPlanning:
      typeof next.includeWorkoutPlanning === "boolean"
        ? next.includeWorkoutPlanning
        : defaults.includeWorkoutPlanning,
    includeBedtimeGuidance:
      typeof next.includeBedtimeGuidance === "boolean"
        ? next.includeBedtimeGuidance
        : defaults.includeBedtimeGuidance,
    defaultSessionMin:
      typeof next.defaultSessionMin === "number" && Number.isFinite(next.defaultSessionMin)
        ? Math.max(20, Math.min(180, Math.round(next.defaultSessionMin)))
        : defaults.defaultSessionMin,
    minSessionMin:
      typeof next.minSessionMin === "number" && Number.isFinite(next.minSessionMin)
        ? Math.max(15, Math.min(120, Math.round(next.minSessionMin)))
        : defaults.minSessionMin,
    maxSessionMin:
      typeof next.maxSessionMin === "number" && Number.isFinite(next.maxSessionMin)
        ? Math.max(30, Math.min(240, Math.round(next.maxSessionMin)))
        : defaults.maxSessionMin,
    breakMin:
      typeof next.breakMin === "number" && Number.isFinite(next.breakMin)
        ? Math.max(0, Math.min(60, Math.round(next.breakMin)))
        : defaults.breakMin,
    maxConsecutiveStudyDays:
      typeof next.maxConsecutiveStudyDays === "number" &&
      Number.isFinite(next.maxConsecutiveStudyDays)
        ? Math.max(2, Math.min(14, Math.round(next.maxConsecutiveStudyDays)))
        : defaults.maxConsecutiveStudyDays,
    recoveryProtectionThreshold:
      typeof next.recoveryProtectionThreshold === "number" &&
      Number.isFinite(next.recoveryProtectionThreshold)
        ? Math.max(30, Math.min(80, Math.round(next.recoveryProtectionThreshold)))
        : defaults.recoveryProtectionThreshold,
    allowWeekendStudy:
      typeof next.allowWeekendStudy === "boolean"
        ? next.allowWeekendStudy
        : defaults.allowWeekendStudy,
    weeklyTemplate: normalizePlannerDayTemplates(next.weeklyTemplate, defaults.weeklyTemplate),
    dateOverrides: normalizePlannerOverrides(next.dateOverrides),
    weights: normalizePlannerWeights(next.weights, defaults.weights),
    updatedAt:
      typeof next.updatedAt === "string" && next.updatedAt
        ? next.updatedAt
        : new Date().toISOString(),
  };
}

function normalizePlannerRuns(items: PlannerRun[] | undefined): PlannerRun[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const normalized = items.filter(
    (item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.createdAt === "string" &&
      typeof item.startDate === "string" &&
      typeof item.horizonDays === "number" &&
      item.summary &&
      Array.isArray(item.days),
  );

  normalized.sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );

  return takeTail(normalized, MAX_PLANNER_RUNS);
}

function normalizePlannedTargets(items: PlannedDayTarget[] | undefined): PlannedDayTarget[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const normalized = items
    .filter(
      (item) =>
        item &&
        typeof item.date === "string" &&
        typeof item.studyTargetHours === "number" &&
        Number.isFinite(item.studyTargetHours) &&
        typeof item.workoutType === "string" &&
        typeof item.workoutDurationMin === "number" &&
        Number.isFinite(item.workoutDurationMin) &&
        typeof item.bedtimeLabel === "string" &&
        typeof item.sourceRunId === "string" &&
        typeof item.createdAt === "string",
    )
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

  return takeTail(normalized, MAX_PLANNED_TARGETS);
}

function normalizeHealthIngestReports(
  items: HealthIngestReconcileReport[] | undefined,
): HealthIngestReconcileReport[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const normalized = items
    .filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.createdAt === "string" &&
        typeof item.filesProcessed === "number" &&
        typeof item.filesSkipped === "number" &&
        typeof item.filesIgnored === "number" &&
        typeof item.importedHealthDays === "number" &&
        typeof item.importedWorkouts === "number" &&
        typeof item.linkedStreams === "number",
    )
    .map((item) => ({
      ...item,
      warnings: Array.isArray(item.warnings)
        ? item.warnings.filter((warning) => typeof warning === "string")
        : [],
    }))
    .sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );

  return takeTail(normalized, MAX_HEALTH_INGEST_REPORTS);
}

function normalizeData(data: AppData): AppData {
  const timezone = data.settings?.timezone || "Europe/Berlin";
  return {
    exams: [...data.exams].sort(
      (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    ),
    studySessions: [...data.studySessions].sort(
      (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
    ),
    todos: sortTodos(data.todos),
    dailyHealth: normalizeDailyHealth(data.dailyHealth),
    workouts: normalizeWorkouts(data.workouts),
    workoutDetails: normalizeWorkoutDetails(data.workoutDetails),
    healthRawFiles: normalizeRawFiles(data.healthRawFiles),
    healthRawRows: normalizeRawRows(data.healthRawRows),
    plannerProfile: normalizePlannerProfile(data.plannerProfile, timezone),
    plannerRuns: normalizePlannerRuns(data.plannerRuns),
    plannedTargets: normalizePlannedTargets(data.plannedTargets),
    healthIngestReports: normalizeHealthIngestReports(data.healthIngestReports),
    goals: normalizeGoals(data.goals),
    settings: {
      timezone,
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
