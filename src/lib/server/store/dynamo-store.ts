import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { createDefaultAppData } from "@/lib/constants";
import { sortTodos } from "@/lib/dashboard-utils";
import type { AppData, Exam, StudySession, TodoItem } from "@/lib/types";
import type { DashboardStore } from "./types";

const SETTINGS_PK = "settings";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for DynamoDB mode`);
  }
  return value;
}

function createDocumentClient(): DynamoDBDocumentClient {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-central-1",
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

    return normalizeData({
      exams,
      studySessions: (sessionsResult.Items || []) as StudySession[],
      todos: (todosResult.Items || []) as TodoItem[],
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
  };
}

export { createDynamoStore };
