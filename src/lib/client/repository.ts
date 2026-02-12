"use client";

import { createDefaultAppData } from "@/lib/constants";
import { sortTodos } from "@/lib/dashboard-utils";
import type { AppData, DashboardBootstrap, Exam, StudySession, TodoItem } from "@/lib/types";

const STORAGE_KEY = "yan-study-os:data:v1";

export interface DashboardRepository {
  mode: "local" | "api";
  getBootstrap: () => Promise<DashboardBootstrap>;
  createStudySession: (session: StudySession) => Promise<void>;
  createTodo: (todo: TodoItem) => Promise<void>;
  updateTodo: (id: string, patch: Partial<TodoItem>) => Promise<void>;
  archiveTodo: (id: string) => Promise<void>;
  restoreTodo: (id: string) => Promise<void>;
  updateExams: (exams: Exam[]) => Promise<void>;
}

function parseStoredData(raw: string | null): AppData {
  if (!raw) {
    return createDefaultAppData(getTimezone());
  }

  try {
    const parsed = JSON.parse(raw) as AppData;

    return {
      exams: Array.isArray(parsed.exams) ? parsed.exams : createDefaultAppData().exams,
      studySessions: Array.isArray(parsed.studySessions) ? parsed.studySessions : [],
      todos: Array.isArray(parsed.todos) ? parsed.todos : [],
      settings: {
        timezone: parsed.settings?.timezone ?? getTimezone(),
        examHighlightColor:
          parsed.settings?.examHighlightColor ?? createDefaultAppData().settings.examHighlightColor,
      },
    };
  } catch {
    return createDefaultAppData(getTimezone());
  }
}

function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin";
}

function readLocalData(): AppData {
  if (typeof window === "undefined") {
    return createDefaultAppData("Europe/Berlin");
  }

  return parseStoredData(window.localStorage.getItem(STORAGE_KEY));
}

function writeLocalData(data: AppData): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...data,
      todos: sortTodos(data.todos),
    }),
  );
}

function createLocalRepository(): DashboardRepository {
  return {
    mode: "local",
    async getBootstrap() {
      const data = readLocalData();
      writeLocalData(data);

      return {
        ...data,
        generatedAt: new Date().toISOString(),
      };
    },
    async createStudySession(session) {
      const data = readLocalData();
      data.studySessions = [...data.studySessions, session];
      writeLocalData(data);
    },
    async createTodo(todo) {
      const data = readLocalData();
      data.todos = sortTodos([...data.todos, todo]);
      writeLocalData(data);
    },
    async updateTodo(id, patch) {
      const data = readLocalData();
      data.todos = sortTodos(
        data.todos.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)),
      );
      writeLocalData(data);
    },
    async archiveTodo(id) {
      const data = readLocalData();
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
      writeLocalData(data);
    },
    async restoreTodo(id) {
      const data = readLocalData();
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
      writeLocalData(data);
    },
    async updateExams(exams) {
      const data = readLocalData();
      data.exams = [...exams].sort(
        (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
      );
      writeLocalData(data);
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
    async createTodo(todo) {
      await apiRequest<{ ok: true }>("/api/todos", {
        method: "POST",
        body: JSON.stringify(todo),
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
  };
}

export function createDashboardRepository(): DashboardRepository {
  const mode = process.env.NEXT_PUBLIC_DATA_MODE === "local" ? "local" : "api";
  if (mode === "local") {
    return createLocalRepository();
  }
  return createApiRepository();
}
