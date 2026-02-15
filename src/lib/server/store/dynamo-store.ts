import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { createDefaultAppData, createDefaultPerformanceGoals } from "@/lib/constants";
import { sortTodos } from "@/lib/dashboard-utils";
import type {
  AppData,
  DailyHealthFact,
  HealthRawFile,
  HealthRawRow,
  Exam,
  PerformanceGoals,
  StudySession,
  TodoItem,
  WorkoutDetail,
  WorkoutEntry,
} from "@/lib/types";
import type { DashboardStore } from "./types";

const SETTINGS_PK = "settings";

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

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for DynamoDB mode`);
  }
  return value;
}

function createDocumentClient(): DynamoDBDocumentClient {
  const region =
    process.env.DYNAMO_REGION ||
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    "eu-central-1";

  const client = new DynamoDBClient({
    region,
  });

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
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
    dailyHealth: normalizeDailyHealth(data.dailyHealth),
    workouts: normalizeWorkouts(data.workouts),
    workoutDetails: normalizeWorkoutDetails(data.workoutDetails),
    healthRawFiles: normalizeRawFiles(data.healthRawFiles),
    healthRawRows: normalizeRawRows(data.healthRawRows),
    goals: normalizeGoals(data.goals),
    settings: {
      timezone: data.settings.timezone || "Europe/Berlin",
      examHighlightColor: data.settings.examHighlightColor || "#00F0FF",
    },
  };
}

function createDynamoStore(): DashboardStore {
  const doc = createDocumentClient();
  const sessionsTable = getRequiredEnv("YAN_STUDY_SESSIONS_TABLE");
  const todosTable = getRequiredEnv("YAN_STUDY_TODOS_TABLE");
  const settingsTable = getRequiredEnv("YAN_STUDY_SETTINGS_TABLE");

  async function loadData(): Promise<AppData> {
    const [sessionsResult, todosResult, settingsResult] = await Promise.all([
      doc.send(new ScanCommand({ TableName: sessionsTable })),
      doc.send(new ScanCommand({ TableName: todosTable })),
      doc.send(
        new GetCommand({
          TableName: settingsTable,
          Key: { pk: SETTINGS_PK },
        }),
      ),
    ]);

    const defaults = createDefaultAppData("Europe/Berlin");

    const settings = settingsResult.Item
      ? {
          timezone: settingsResult.Item.timezone || defaults.settings.timezone,
          examHighlightColor:
            settingsResult.Item.examHighlightColor || defaults.settings.examHighlightColor,
        }
      : defaults.settings;

    const exams = Array.isArray(settingsResult.Item?.exams)
      ? (settingsResult.Item?.exams as Exam[])
      : defaults.exams;

    const goals = normalizeGoals(settingsResult.Item?.goals as Partial<PerformanceGoals>);
    const dailyHealth = normalizeDailyHealth(settingsResult.Item?.dailyHealth as DailyHealthFact[]);
    const workouts = normalizeWorkouts(settingsResult.Item?.workouts as WorkoutEntry[]);
    const workoutDetails = normalizeWorkoutDetails(
      settingsResult.Item?.workoutDetails as WorkoutDetail[],
    );
    const healthRawFiles = normalizeRawFiles(settingsResult.Item?.healthRawFiles as HealthRawFile[]);
    const healthRawRows = normalizeRawRows(settingsResult.Item?.healthRawRows as HealthRawRow[]);

    return normalizeData({
      exams,
      studySessions: (sessionsResult.Items || []) as StudySession[],
      todos: (todosResult.Items || []) as TodoItem[],
      dailyHealth,
      workouts,
      workoutDetails,
      healthRawFiles,
      healthRawRows,
      goals,
      settings,
    });
  }

  async function persistSettings(data: AppData): Promise<void> {
    await doc.send(
      new PutCommand({
        TableName: settingsTable,
        Item: {
          pk: SETTINGS_PK,
          timezone: data.settings.timezone,
          examHighlightColor: data.settings.examHighlightColor,
          exams: data.exams,
          dailyHealth: data.dailyHealth,
          workouts: data.workouts,
          workoutDetails: data.workoutDetails,
          healthRawFiles: data.healthRawFiles,
          healthRawRows: data.healthRawRows,
          goals: data.goals,
          updatedAt: new Date().toISOString(),
        },
      }),
    );
  }

  return {
    async getData() {
      return loadData();
    },
    async saveData(data) {
      const normalized = normalizeData(data);

      await Promise.all([
        persistSettings(normalized),
        ...normalized.studySessions.map((session) =>
          doc.send(
            new PutCommand({
              TableName: sessionsTable,
              Item: session,
            }),
          ),
        ),
        ...normalized.todos.map((todo) =>
          doc.send(
            new PutCommand({
              TableName: todosTable,
              Item: todo,
            }),
          ),
        ),
      ]);
    },
    async appendStudySession(session) {
      await doc.send(
        new PutCommand({
          TableName: sessionsTable,
          Item: session,
        }),
      );
    },
    async addTodo(todo) {
      await doc.send(
        new PutCommand({
          TableName: todosTable,
          Item: todo,
        }),
      );
    },
    async updateTodo(id, patch) {
      const expressionParts: string[] = [];
      const expressionNames: Record<string, string> = {};
      const expressionValues: Record<string, unknown> = {};

      Object.entries(patch).forEach(([key, value], index) => {
        const nameKey = `#k${index}`;
        const valueKey = `:v${index}`;
        expressionParts.push(`${nameKey} = ${valueKey}`);
        expressionNames[nameKey] = key;
        expressionValues[valueKey] = value;
      });

      if (expressionParts.length === 0) {
        return;
      }

      await doc.send(
        new UpdateCommand({
          TableName: todosTable,
          Key: { id },
          UpdateExpression: `SET ${expressionParts.join(", ")}`,
          ExpressionAttributeNames: expressionNames,
          ExpressionAttributeValues: expressionValues,
        }),
      );
    },
    async archiveTodo(id) {
      await doc.send(
        new UpdateCommand({
          TableName: todosTable,
          Key: { id },
          UpdateExpression:
            "SET archived = :archived, completed = :completed, completedAt = :completedAt",
          ExpressionAttributeValues: {
            ":archived": true,
            ":completed": true,
            ":completedAt": new Date().toISOString(),
          },
        }),
      );
    },
    async restoreTodo(id) {
      await doc.send(
        new UpdateCommand({
          TableName: todosTable,
          Key: { id },
          UpdateExpression:
            "SET archived = :archived, completed = :completed REMOVE completedAt",
          ExpressionAttributeValues: {
            ":archived": false,
            ":completed": false,
          },
        }),
      );
    },
    async updateExams(exams) {
      const data = await loadData();
      data.exams = exams;
      await persistSettings(data);
    },
    async appendHealthRawFiles(files) {
      if (files.length === 0) {
        return;
      }

      const data = await loadData();
      const byId = new Map(data.healthRawFiles.map((file) => [file.id, file]));
      for (const file of files) {
        byId.set(file.id, file);
      }
      data.healthRawFiles = [...byId.values()];
      await persistSettings(data);
    },
    async appendHealthRawRows(rows) {
      if (rows.length === 0) {
        return;
      }

      const data = await loadData();
      const byId = new Map(data.healthRawRows.map((row) => [row.id, row]));
      for (const row of rows) {
        byId.set(row.id, row);
      }
      data.healthRawRows = [...byId.values()];
      await persistSettings(data);
    },
    async upsertWorkoutDetails(details) {
      if (details.length === 0) {
        return;
      }

      const data = await loadData();
      const byId = new Map(data.workoutDetails.map((detail) => [detail.workoutId, detail]));
      for (const detail of details) {
        byId.set(detail.workoutId, detail);
      }
      data.workoutDetails = [...byId.values()];
      await persistSettings(data);
    },
  };
}

export { createDynamoStore };
