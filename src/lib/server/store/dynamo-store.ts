import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
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
  Exam,
  PlannedDayTarget,
  PerformanceGoals,
  PlannerDateOverride,
  PlannerDayTemplate,
  PlannerProfile,
  PlannerRun,
  PlannerTimeWindow,
  PlannerWeights,
  StudySession,
  TodoItem,
  WorkoutDetail,
  WorkoutEntry,
} from "@/lib/types";
import type { DashboardStore } from "./types";

const SETTINGS_PK = "settings";
const MAX_DAILY_HEALTH_DAYS = 730;
const MAX_WORKOUTS = 1000;
const MAX_WORKOUT_DETAILS = 240;
const MAX_HEALTH_RAW_FILES = 1000;
const MAX_STREAM_ROWS_PER_WORKOUT_STREAM = 480;
const MAX_SERIES_POINTS = 480;
const MAX_PLANNER_RUNS = 80;
const MAX_PLANNED_TARGETS = 180;
const MAX_HEALTH_INGEST_REPORTS = 90;

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

  const normalized = items
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
          rows: takeTail(
            stream.rows.filter(
              (row) =>
                row &&
                typeof row.timestamp === "string" &&
                (typeof row.value === "number" ||
                  typeof row.avg === "number" ||
                  typeof row.min === "number" ||
                  typeof row.max === "number"),
            ),
            MAX_STREAM_ROWS_PER_WORKOUT_STREAM,
          ),
        })),
      heartRateSeries: Array.isArray(item.heartRateSeries)
        ? takeTail(item.heartRateSeries, MAX_SERIES_POINTS)
        : item.heartRateSeries,
      distanceSeries: Array.isArray(item.distanceSeries)
        ? takeTail(item.distanceSeries, MAX_SERIES_POINTS)
        : item.distanceSeries,
      stepSeries: Array.isArray(item.stepSeries)
        ? takeTail(item.stepSeries, MAX_SERIES_POINTS)
        : item.stepSeries,
      activeEnergySeries: Array.isArray(item.activeEnergySeries)
        ? takeTail(item.activeEnergySeries, MAX_SERIES_POINTS)
        : item.activeEnergySeries,
      restingEnergySeries: Array.isArray(item.restingEnergySeries)
        ? takeTail(item.restingEnergySeries, MAX_SERIES_POINTS)
        : item.restingEnergySeries,
    }))
    .sort(
      (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
    );

  return takeTail(normalized, MAX_WORKOUT_DETAILS);
}

function normalizeRawFiles(items: HealthRawFile[] | undefined): HealthRawFile[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const normalized = items
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

  return takeTail(normalized, MAX_HEALTH_RAW_FILES);
}

function normalizeRawRows(items: HealthRawRow[] | undefined): HealthRawRow[] {
  // DynamoDB settings-item storage cannot safely hold unbounded per-row raw payloads.
  // Keep file-level transparency while omitting row-level raw data in this backend.
  void items;
  return [];
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
  const dailyHealth = normalizeDailyHealth(data.dailyHealth);
  const workouts = normalizeWorkouts(data.workouts);
  const timezone = data.settings?.timezone || "Europe/Berlin";

  return {
    exams: [...data.exams].sort(
      (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    ),
    studySessions: [...data.studySessions].sort(
      (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
    ),
    todos: sortTodos(data.todos),
    dailyHealth: takeTail(dailyHealth, MAX_DAILY_HEALTH_DAYS),
    workouts: takeTail(workouts, MAX_WORKOUTS),
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
    const plannerProfile = normalizePlannerProfile(
      settingsResult.Item?.plannerProfile as PlannerProfile,
      settings.timezone || defaults.settings.timezone,
    );
    const plannerRuns = normalizePlannerRuns(settingsResult.Item?.plannerRuns as PlannerRun[]);
    const plannedTargets = normalizePlannedTargets(
      settingsResult.Item?.plannedTargets as PlannedDayTarget[],
    );
    const healthIngestReports = normalizeHealthIngestReports(
      settingsResult.Item?.healthIngestReports as HealthIngestReconcileReport[],
    );

    return normalizeData({
      exams,
      studySessions: (sessionsResult.Items || []) as StudySession[],
      todos: (todosResult.Items || []) as TodoItem[],
      dailyHealth,
      workouts,
      workoutDetails,
      healthRawFiles,
      healthRawRows,
      plannerProfile,
      plannerRuns,
      plannedTargets,
      healthIngestReports,
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
          plannerProfile: data.plannerProfile,
          plannerRuns: data.plannerRuns,
          plannedTargets: data.plannedTargets,
          healthIngestReports: data.healthIngestReports,
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
