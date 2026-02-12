import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createDefaultAppData } from "@/lib/constants";
import { sortTodos } from "@/lib/dashboard-utils";
import type { AppData } from "@/lib/types";
import type { DashboardStore } from "./types";

const DATA_DIRECTORY = path.join(process.cwd(), "runtime-data");
const DATA_FILE_PATH = path.join(DATA_DIRECTORY, "yan-study-os.json");
const EXAMS_BACKUP_FILE_PATH = path.join(
  DATA_DIRECTORY,
  "yan-study-os-exams-backup.json",
);

let writeQueue = Promise.resolve();

function normalizeData(data: AppData): AppData {
  return {
    exams: [...data.exams].sort(
      (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    ),
    studySessions: [...data.studySessions].sort(
      (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
    ),
    todos: sortTodos(data.todos),
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
  };
}

export { createLocalFileStore };
