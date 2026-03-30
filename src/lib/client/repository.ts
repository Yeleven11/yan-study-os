"use client";

import { createDefaultAppData, createDefaultPerformanceGoals } from "@/lib/constants";
import { createDemoAppData } from "@/lib/demo-data";
import { sortTodos } from "@/lib/dashboard-utils";
import { applyFlashcardGrade, normalizeFlashcards } from "@/lib/flashcards/scheduler";
import type {
  AppData,
  DashboardBootstrap,
  DailyHealthFact,
  Exam,
  Flashcard,
  FlashcardGradeInput,
  HealthRawFile,
  PerformanceGoals,
  StudySession,
  TodoItem,
  WorkoutDetail,
  WorkoutEntry,
} from "@/lib/types";

const DEFAULT_STORAGE_KEY = "yan-study-os:data:v1";
const DEMO_STORAGE_KEY = "yan-study-os:demo-data:v1";

type RepositoryMode = "local" | "api" | "demo";

export interface DashboardRepository {
  mode: RepositoryMode;
  getBootstrap: () => Promise<DashboardBootstrap>;
  createStudySession: (session: StudySession) => Promise<void>;
  createWorkout: (workout: WorkoutEntry) => Promise<void>;
  updateWorkout: (
    id: string,
    patch: Omit<Partial<WorkoutEntry>, "difficultyUser"> & { difficultyUser?: number | null },
  ) => Promise<void>;
  createTodo: (todo: TodoItem) => Promise<void>;
  createFlashcard: (flashcard: Flashcard) => Promise<void>;
  gradeFlashcard: (input: FlashcardGradeInput) => Promise<void>;
  updateTodo: (id: string, patch: Partial<TodoItem>) => Promise<void>;
  archiveTodo: (id: string) => Promise<void>;
  restoreTodo: (id: string) => Promise<void>;
  updateExams: (exams: Exam[]) => Promise<void>;
  updateGoals: (goals: PerformanceGoals) => Promise<void>;
  importHealthCsv: (csv: string) => Promise<{
    importedHealthDays: number;
    importedWorkouts: number;
    filesProcessed?: number;
    filesSkipped?: number;
    linkedStreams?: number;
  }>;
  importHealthBatch: (
    files: Array<{ filename: string; csv: string }>,
  ) => Promise<{
    importedHealthDays: number;
    importedWorkouts: number;
    filesProcessed: number;
    filesSkipped: number;
    linkedStreams?: number;
  }>;
  getWorkoutDetail: (id: string) => Promise<WorkoutDetail | null>;
  getHealthRawFiles: () => Promise<HealthRawFile[]>;
}

function parseDailyHealth(items: DailyHealthFact[] | undefined): DailyHealthFact[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(
    (item) =>
      item &&
      typeof item.date === "string" &&
      typeof item.sleepHours === "number" &&
      Number.isFinite(item.sleepHours),
  );
}

function parseWorkouts(items: WorkoutEntry[] | undefined): WorkoutEntry[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(
    (item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.type === "string" &&
      typeof item.startedAt === "string" &&
      typeof item.endedAt === "string" &&
      typeof item.durationMin === "number" &&
      Number.isFinite(item.durationMin),
  );
}

function parseWorkoutDetails(items: WorkoutDetail[] | undefined): WorkoutDetail[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(
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
  );
}

function parseRawFiles(items: HealthRawFile[] | undefined): HealthRawFile[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(
    (item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.hash === "string" &&
      typeof item.filename === "string" &&
      typeof item.fileType === "string" &&
      typeof item.importedAt === "string",
  );
}

function parseGoals(goals: Partial<PerformanceGoals> | undefined): PerformanceGoals {
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

function parseStoredData(
  raw: string | null,
  createSeedData: (timezone?: string) => AppData = createDefaultAppData,
): AppData {
  if (!raw) {
    return createSeedData(getTimezone());
  }

  try {
    const parsed = JSON.parse(raw) as AppData;
    const defaults = createSeedData(getTimezone());

    return {
      exams: Array.isArray(parsed.exams) ? parsed.exams : defaults.exams,
      studySessions: Array.isArray(parsed.studySessions) ? parsed.studySessions : [],
      todos: Array.isArray(parsed.todos) ? parsed.todos : [],
      flashcards: normalizeFlashcards(parsed.flashcards),
      dailyHealth: parseDailyHealth(parsed.dailyHealth),
      workouts: parseWorkouts(parsed.workouts),
      workoutDetails: parseWorkoutDetails(parsed.workoutDetails),
      healthRawFiles: parseRawFiles(parsed.healthRawFiles),
      healthRawRows: Array.isArray(parsed.healthRawRows) ? parsed.healthRawRows : [],
      healthImportDeadLetters: Array.isArray(parsed.healthImportDeadLetters) ? parsed.healthImportDeadLetters : [],
      goals: parseGoals(parsed.goals),
      settings: {
        timezone: parsed.settings?.timezone ?? getTimezone(),
        examHighlightColor: parsed.settings?.examHighlightColor ?? defaults.settings.examHighlightColor,
      },
    };
  } catch {
    return createSeedData(getTimezone());
  }
}

function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin";
}

function readLocalData(
  storageKey = DEFAULT_STORAGE_KEY,
  createSeedData: (timezone?: string) => AppData = createDefaultAppData,
): AppData {
  if (typeof window === "undefined") {
    return createSeedData("Europe/Berlin");
  }

  return parseStoredData(window.localStorage.getItem(storageKey), createSeedData);
}

function writeLocalData(data: AppData, storageKey = DEFAULT_STORAGE_KEY): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      ...data,
      todos: sortTodos(data.todos),
    }),
  );
}

function createLocalRepository(
  mode: Extract<RepositoryMode, "local" | "demo"> = "local",
  storageKey = DEFAULT_STORAGE_KEY,
  createSeedData: (timezone?: string) => AppData = createDefaultAppData,
): DashboardRepository {
  return {
    mode,
    async getBootstrap() {
      const data = readLocalData(storageKey, createSeedData);
      writeLocalData(data, storageKey);

      return {
        ...data,
        generatedAt: new Date().toISOString(),
      };
    },
    async createStudySession(session) {
      const data = readLocalData(storageKey, createSeedData);
      data.studySessions = [...data.studySessions, session];
      writeLocalData(data, storageKey);
    },
    async createWorkout(workout) {
      const data = readLocalData(storageKey, createSeedData);
      const exists = data.workouts.some((entry) => entry.id === workout.id);
      data.workouts = exists ? data.workouts : [...data.workouts, workout];
      writeLocalData(data, storageKey);
    },
    async updateWorkout(id, patch) {
      const data = readLocalData(storageKey, createSeedData);
      data.workouts = data.workouts.map((workout) => {
        if (workout.id !== id) {
          return workout;
        }

        const { difficultyUser, ...otherPatch } = patch;
        const next: WorkoutEntry = {
          ...workout,
          ...otherPatch,
        };

        if (typeof difficultyUser === "number") {
          next.difficultyUser = difficultyUser;
        } else if (difficultyUser === null) {
          delete next.difficultyUser;
        }

        return next;
      });
      writeLocalData(data, storageKey);
    },
    async createTodo(todo) {
      const data = readLocalData(storageKey, createSeedData);
      data.todos = sortTodos([...data.todos, todo]);
      writeLocalData(data, storageKey);
    },
    async createFlashcard(flashcard) {
      const data = readLocalData(storageKey, createSeedData);
      const exists = data.flashcards.some((item) => item.id === flashcard.id);
      data.flashcards = exists
        ? normalizeFlashcards(data.flashcards)
        : normalizeFlashcards([...data.flashcards, flashcard]);
      writeLocalData(data, storageKey);
    },
    async gradeFlashcard(input) {
      const data = readLocalData(storageKey, createSeedData);
      const timezone = data.settings?.timezone || getTimezone();
      const result = applyFlashcardGrade(data.flashcards, input, timezone);
      data.flashcards = result.cards;
      writeLocalData(data, storageKey);
    },
    async updateTodo(id, patch) {
      const data = readLocalData(storageKey, createSeedData);
      data.todos = sortTodos(
        data.todos.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)),
      );
      writeLocalData(data, storageKey);
    },
    async archiveTodo(id) {
      const data = readLocalData(storageKey, createSeedData);
      data.todos = sortTodos(
        data.todos.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                completed: true,
                archived: true,
                completedAt: todo.completedAt ?? new Date().toISOString(),
              }
            : todo,
        ),
      );
      writeLocalData(data, storageKey);
    },
    async restoreTodo(id) {
      const data = readLocalData(storageKey, createSeedData);
      data.todos = sortTodos(
        data.todos.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                completed: false,
                archived: false,
                completedAt: undefined,
              }
            : todo,
        ),
      );
      writeLocalData(data, storageKey);
    },
    async updateExams(exams) {
      const data = readLocalData(storageKey, createSeedData);
      data.exams = [...exams].sort(
        (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
      );
      writeLocalData(data, storageKey);
    },
    async updateGoals(goals) {
      const data = readLocalData(storageKey, createSeedData);
      data.goals = parseGoals(goals);
      writeLocalData(data, storageKey);
    },
    async importHealthCsv(csv) {
      const data = readLocalData(storageKey, createSeedData);
      const now = new Date().toISOString();
      const synthetic: DailyHealthFact[] = [];
      const workouts: WorkoutEntry[] = [];

      // Local mode fallback: create one synthetic daily point and one workout on import.
      if (csv.trim().length > 0) {
        synthetic.push({
          date: now.slice(0, 10),
          sleepHours: 8.2,
          hrvMs: 59,
          restingHrBpm: 53,
          source: "manual",
          createdAt: now,
        });
        workouts.push({
          id: crypto.randomUUID(),
          type: "cardio",
          startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          endedAt: now,
          durationMin: 45,
          avgHeartRate: 146,
          activeKcal: 420,
          source: "manual",
          createdAt: now,
        });
      }

      const healthByDate = new Map(data.dailyHealth.map((item) => [item.date, item]));
      for (const item of synthetic) {
        healthByDate.set(item.date, item);
      }

      const workoutsById = new Map(data.workouts.map((item) => [item.id, item]));
      for (const workout of workouts) {
        workoutsById.set(workout.id, workout);
      }

      data.dailyHealth = [...healthByDate.values()].sort(
        (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
      );
      data.workouts = [...workoutsById.values()].sort(
        (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
      );
      writeLocalData(data, storageKey);
      return {
        importedHealthDays: synthetic.length,
        importedWorkouts: workouts.length,
        filesProcessed: 1,
        filesSkipped: 0,
        linkedStreams: 0,
      };
    },
    async importHealthBatch(files) {
      const nonEmpty = files.filter((file) => file.csv?.trim());
      let importedHealthDays = 0;
      let importedWorkouts = 0;

      for (const file of nonEmpty) {
        const result = await this.importHealthCsv(file.csv);
        importedHealthDays += result.importedHealthDays;
        importedWorkouts += result.importedWorkouts;
      }

      return {
        importedHealthDays,
        importedWorkouts,
        filesProcessed: nonEmpty.length,
        filesSkipped: files.length - nonEmpty.length,
        linkedStreams: 0,
      };
    },
    async getWorkoutDetail(id) {
      const data = readLocalData(storageKey, createSeedData);
      return data.workoutDetails.find((detail) => detail.workoutId === id) || null;
    },
    async getHealthRawFiles() {
      const data = readLocalData(storageKey, createSeedData);
      return data.healthRawFiles;
    },
  };
}

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(endpoint, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ error: `Request failed (${response.status})` }));
    throw new Error(payload.error || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

function createApiRepository(): DashboardRepository {
  return {
    mode: "api",
    async getBootstrap() {
      const payload = await apiRequest<{ data: DashboardBootstrap }>(
        "/api/dashboard/bootstrap",
      );
      return payload.data;
    },
    async createStudySession(session) {
      await apiRequest<{ ok: true }>("/api/study-sessions", {
        method: "POST",
        body: JSON.stringify(session),
      });
    },
    async createWorkout(workout) {
      await apiRequest<{ ok: true }>("/api/workouts", {
        method: "POST",
        body: JSON.stringify(workout),
      });
    },
    async updateWorkout(id, patch) {
      await apiRequest<{ ok: true }>(`/api/workouts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    },
    async createTodo(todo) {
      await apiRequest<{ ok: true }>("/api/todos", {
        method: "POST",
        body: JSON.stringify(todo),
      });
    },
    async createFlashcard(flashcard) {
      await apiRequest<{ ok: true }>("/api/flashcards", {
        method: "POST",
        body: JSON.stringify(flashcard),
      });
    },
    async gradeFlashcard(input) {
      await apiRequest<{ ok: true }>("/api/flashcards/review", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    async updateTodo(id, patch) {
      await apiRequest<{ ok: true }>("/api/todos", {
        method: "PATCH",
        body: JSON.stringify({ id, patch }),
      });
    },
    async archiveTodo(id) {
      await apiRequest<{ ok: true }>(`/api/todos/${id}/archive`, {
        method: "POST",
      });
    },
    async restoreTodo(id) {
      await apiRequest<{ ok: true }>(`/api/todos/${id}/restore`, {
        method: "POST",
      });
    },
    async updateExams(exams) {
      await apiRequest<{ ok: true }>("/api/settings/exams", {
        method: "PUT",
        body: JSON.stringify({ exams }),
      });
    },
    async updateGoals(goals) {
      await apiRequest<{ ok: true }>("/api/settings/goals", {
        method: "PUT",
        body: JSON.stringify({ goals }),
      });
    },
    async importHealthCsv(csv) {
      return apiRequest<{
        importedHealthDays: number;
        importedWorkouts: number;
        filesProcessed?: number;
        filesSkipped?: number;
        linkedStreams?: number;
      }>(
        "/api/integrations/health/csv",
        {
          method: "POST",
          body: JSON.stringify({ csv }),
        },
      );
    },
    async importHealthBatch(files) {
      return apiRequest<{
        importedHealthDays: number;
        importedWorkouts: number;
        filesProcessed: number;
        filesSkipped: number;
        linkedStreams?: number;
      }>("/api/integrations/health/import-batch", {
        method: "POST",
        body: JSON.stringify({ files }),
      });
    },
    async getWorkoutDetail(id) {
      const payload = await apiRequest<{ data: WorkoutDetail | null }>(`/api/workouts/${id}`);
      return payload.data;
    },
    async getHealthRawFiles() {
      const payload = await apiRequest<{ data: HealthRawFile[] }>("/api/health/raw/files");
      return payload.data;
    },
  };
}

export function resetDemoRepositoryData(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(DEMO_STORAGE_KEY);
}

export function createDashboardRepository(options?: {
  sessionMode?: "full" | "demo";
}): DashboardRepository {
  if (options?.sessionMode === "demo") {
    return createLocalRepository("demo", DEMO_STORAGE_KEY, createDemoAppData);
  }

  const mode = process.env.NEXT_PUBLIC_DATA_MODE === "local" ? "local" : "api";
  if (mode === "local") {
    return createLocalRepository();
  }
  return createApiRepository();
}
