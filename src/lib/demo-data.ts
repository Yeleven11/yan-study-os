import { createFlashcard, normalizeFlashcards } from "@/lib/flashcards/scheduler";
import { sortTodos } from "@/lib/dashboard-utils";
import {
  EXAM_HIGHLIGHT_COLOR,
  SUBJECT_BY_ID,
  createDefaultPerformanceGoals,
} from "@/lib/constants";
import type {
  AppData,
  DailyHealthFact,
  Exam,
  Flashcard,
  SubjectId,
  TodoItem,
  StudySession,
  WorkoutDetail,
  WorkoutEntry,
  WorkoutStream,
  WorkoutStreamPoint,
} from "@/lib/types";

type RelativeTimeInput = {
  days?: number;
  hours?: number;
  minutes?: number;
};

function atRelative(
  now: Date,
  { days = 0, hours = 0, minutes = 0 }: RelativeTimeInput,
): Date {
  return new Date(
    now.getTime() + days * 86_400_000 + hours * 3_600_000 + minutes * 60_000,
  );
}

function buildExam(
  id: string,
  subjectId: SubjectId,
  paper: string,
  startsAt: string,
  importance?: number,
): Exam {
  return {
    id,
    subjectId,
    title: SUBJECT_BY_ID[subjectId].name,
    paper,
    startsAt,
    importance,
  };
}

function buildStudySession(
  id: string,
  subjectId: SubjectId,
  startedAt: Date,
  durationMin: number,
): StudySession {
  const endedAt = new Date(startedAt.getTime() + durationMin * 60_000);
  return {
    id,
    subjectId,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationSec: durationMin * 60,
    createdAt: endedAt.toISOString(),
  };
}

function buildTodo(
  id: string,
  title: string,
  subjectId: SubjectId,
  deadline: Date,
  options?: {
    ultraPriority?: boolean;
    completed?: boolean;
    archived?: boolean;
    createdAt?: Date;
    completedAt?: Date;
  },
): TodoItem {
  return {
    id,
    title,
    subjectId,
    deadline: deadline.toISOString(),
    ultraPriority: Boolean(options?.ultraPriority),
    completed: Boolean(options?.completed),
    archived: Boolean(options?.archived),
    createdAt: (options?.createdAt || deadline).toISOString(),
    completedAt: options?.completedAt?.toISOString(),
  };
}

function buildReviewFlashcard(
  question: string,
  answer: string,
  createdAt: Date,
  dueAt: Date,
  overrides?: Partial<Flashcard>,
): Flashcard {
  const base = createFlashcard(question, answer, createdAt.toISOString());
  return {
    ...base,
    status: "review",
    dueAt: dueAt.toISOString(),
    updatedAt: dueAt.toISOString(),
    intervalDays: 4,
    easeFactor: 2.45,
    reviewCount: 5,
    consecutiveCorrect: 4,
    ...overrides,
  };
}

function buildSeriesRows(
  startAt: Date,
  values: number[],
  stepMinutes: number,
): WorkoutStreamPoint[] {
  let cumulative = 0;

  return values.map((value, index) => {
    cumulative += value;
    return {
      timestamp: atRelative(startAt, { minutes: index * stepMinutes }).toISOString(),
      value,
      avg: value,
      max: value,
      min: value,
      context: `${cumulative.toFixed(2)}`,
    };
  });
}

function buildCumulativeRows(
  startAt: Date,
  values: number[],
  stepMinutes: number,
): WorkoutStreamPoint[] {
  let cumulative = 0;

  return values.map((value, index) => {
    cumulative += value;
    return {
      timestamp: atRelative(startAt, { minutes: index * stepMinutes }).toISOString(),
      value: Number(cumulative.toFixed(2)),
    };
  });
}

function buildWorkoutDetail(
  workout: WorkoutEntry,
  sourceFiles: string[],
  heartRateValues: number[],
  distanceValues: number[],
  stepValues: number[],
  activeEnergyValues: number[],
): WorkoutDetail {
  const startAt = new Date(workout.startedAt);
  const stepMinutes = Math.max(1, Math.round(workout.durationMin / heartRateValues.length));
  const heartRateSeries = buildSeriesRows(startAt, heartRateValues, stepMinutes).map((point) => ({
    ...point,
    context: undefined,
  }));
  const distanceSeries = buildCumulativeRows(startAt, distanceValues, stepMinutes);
  const stepSeries = buildCumulativeRows(startAt, stepValues, stepMinutes);
  const activeEnergySeries = buildCumulativeRows(startAt, activeEnergyValues, stepMinutes);

  const streams: WorkoutStream[] = [
    {
      id: `${workout.id}:heart-rate`,
      workoutKey: workout.sourceWorkoutKey || workout.id,
      streamType: "heart_rate",
      sourceFile: sourceFiles[0] || "demo-heart-rate.csv",
      startedAt: workout.startedAt,
      endedAt: workout.endedAt,
      rows: heartRateSeries,
    },
    {
      id: `${workout.id}:distance`,
      workoutKey: workout.sourceWorkoutKey || workout.id,
      streamType: "distance",
      sourceFile: sourceFiles[1] || sourceFiles[0] || "demo-distance.csv",
      startedAt: workout.startedAt,
      endedAt: workout.endedAt,
      rows: distanceSeries,
    },
    {
      id: `${workout.id}:steps`,
      workoutKey: workout.sourceWorkoutKey || workout.id,
      streamType: "steps",
      sourceFile: sourceFiles[1] || sourceFiles[0] || "demo-steps.csv",
      startedAt: workout.startedAt,
      endedAt: workout.endedAt,
      rows: stepSeries,
    },
    {
      id: `${workout.id}:active-energy`,
      workoutKey: workout.sourceWorkoutKey || workout.id,
      streamType: "active_energy",
      sourceFile: sourceFiles[2] || sourceFiles[0] || "demo-energy.csv",
      startedAt: workout.startedAt,
      endedAt: workout.endedAt,
      rows: activeEnergySeries,
    },
  ];

  return {
    workoutId: workout.id,
    workoutKey: workout.sourceWorkoutKey || workout.id,
    workoutType: workout.type,
    workoutNameRaw: workout.workoutNameRaw,
    workoutDisplayLabel: workout.workoutDisplayLabel,
    startedAt: workout.startedAt,
    endedAt: workout.endedAt,
    durationMin: workout.durationMin,
    mergeConfidence: workout.mergeConfidence || 0.98,
    streamCount: streams.length,
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
    hrAvg: workout.hrAvg ?? workout.avgHeartRate,
    sourceFiles,
    streams,
    heartRateSeries,
    distanceSeries,
    stepSeries,
    activeEnergySeries,
  };
}

export function createDemoAppData(timezone = "Europe/Berlin"): AppData {
  const now = new Date();
  const goals = {
    ...createDefaultPerformanceGoals(),
    sleepHoursTarget: 8.5,
    baselineStudyHours: 4.25,
    weeklyWorkoutTarget: 4,
    weekdayWakeTime: "06:45",
    weekendWakeTime: "08:15",
    preferredBedtimeStart: "21:45",
    preferredBedtimeEnd: "22:30",
  };

  const exams: Exam[] = [
    buildExam(
      "demo-exam-physics-p2",
      "physics_hl",
      "Paper 2",
      atRelative(now, { days: 11, hours: 9 }).toISOString(),
      5,
    ),
    buildExam(
      "demo-exam-math-p3",
      "math_aa_hl",
      "Paper 3",
      atRelative(now, { days: 14, hours: 13 }).toISOString(),
      5,
    ),
    buildExam(
      "demo-exam-english-io",
      "english_lang_lit_sl",
      "Oral Review",
      atRelative(now, { days: 17, hours: 10 }).toISOString(),
      4,
    ),
    buildExam(
      "demo-exam-cs-p1",
      "computer_science_hl",
      "Paper 1",
      atRelative(now, { days: 21, hours: 9 }).toISOString(),
      5,
    ),
    buildExam(
      "demo-exam-business-case",
      "business_sl",
      "Case Study",
      atRelative(now, { days: 24, hours: 13 }).toISOString(),
      3,
    ),
    buildExam(
      "demo-exam-german-p1",
      "german_lang_lit_sl",
      "Paper 1",
      atRelative(now, { days: 27, hours: 9 }).toISOString(),
      3,
    ),
  ].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());

  const studySessions: StudySession[] = [
    buildStudySession("demo-session-01", "physics_hl", atRelative(now, { days: -5, hours: -10 }), 105),
    buildStudySession("demo-session-02", "math_aa_hl", atRelative(now, { days: -5, hours: -7 }), 70),
    buildStudySession("demo-session-03", "computer_science_hl", atRelative(now, { days: -4, hours: -11 }), 95),
    buildStudySession("demo-session-04", "english_lang_lit_sl", atRelative(now, { days: -4, hours: -7 }), 55),
    buildStudySession("demo-session-05", "physics_hl", atRelative(now, { days: -3, hours: -11 }), 65),
    buildStudySession("demo-session-06", "math_aa_hl", atRelative(now, { days: -3, hours: -8 }), 35),
    buildStudySession("demo-session-07", "business_sl", atRelative(now, { days: -3, hours: -6 }), 30),
    buildStudySession("demo-session-08", "computer_science_hl", atRelative(now, { days: -2, hours: -10 }), 80),
    buildStudySession("demo-session-09", "german_lang_lit_sl", atRelative(now, { days: -2, hours: -7 }), 25),
    buildStudySession("demo-session-10", "english_lang_lit_sl", atRelative(now, { days: -2, hours: -5 }), 20),
    buildStudySession("demo-session-11", "math_aa_hl", atRelative(now, { days: -1, hours: -12 }), 95),
    buildStudySession("demo-session-12", "physics_hl", atRelative(now, { days: -1, hours: -8 }), 40),
    buildStudySession("demo-session-13", "computer_science_hl", atRelative(now, { hours: -9 }), 75),
    buildStudySession("demo-session-14", "business_sl", atRelative(now, { hours: -5 }), 30),
  ];

  const todos = sortTodos([
    buildTodo(
      "demo-todo-01",
      "Finish magnetic fields question set",
      "physics_hl",
      atRelative(now, { days: 1, hours: 18 }),
      { ultraPriority: true, createdAt: atRelative(now, { days: -2 }) },
    ),
    buildTodo(
      "demo-todo-02",
      "Write Math AA HL Paper 3 reflection sheet",
      "math_aa_hl",
      atRelative(now, { days: 2, hours: 17 }),
      { ultraPriority: true, createdAt: atRelative(now, { days: -4 }) },
    ),
    buildTodo(
      "demo-todo-03",
      "Memorize German oral quotes",
      "german_lang_lit_sl",
      atRelative(now, { days: 3, hours: 16 }),
      { createdAt: atRelative(now, { days: -3 }) },
    ),
    buildTodo(
      "demo-todo-04",
      "Refactor recursive trace example",
      "computer_science_hl",
      atRelative(now, { days: 4, hours: 14 }),
      { createdAt: atRelative(now, { days: -1 }) },
    ),
    buildTodo(
      "demo-todo-05",
      "Plan Business case-study structure",
      "business_sl",
      atRelative(now, { days: 5, hours: 15 }),
      { createdAt: atRelative(now, { days: -2 }) },
    ),
    buildTodo(
      "demo-todo-06",
      "Annotate two English paper 2 extracts",
      "english_lang_lit_sl",
      atRelative(now, { days: -1, hours: 12 }),
      {
        completed: true,
        createdAt: atRelative(now, { days: -5 }),
        completedAt: atRelative(now, { days: -1, hours: 20 }),
      },
    ),
    buildTodo(
      "demo-todo-07",
      "Upload workout CSV exports",
      "computer_science_hl",
      atRelative(now, { days: -3, hours: 11 }),
      {
        completed: true,
        archived: true,
        createdAt: atRelative(now, { days: -8 }),
        completedAt: atRelative(now, { days: -4, hours: 18 }),
      },
    ),
  ]);

  const flashcards = normalizeFlashcards([
    buildReviewFlashcard(
      "What is the uncertainty propagation rule for multiplication/division?",
      "Add percentage uncertainties, then apply the result to the final value.",
      atRelative(now, { days: -10 }),
      atRelative(now, { days: -1, hours: -1 }),
      { intervalDays: 6, easeFactor: 2.6, reviewCount: 7, consecutiveCorrect: 6 },
    ),
    buildReviewFlashcard(
      "State the time complexity of binary search.",
      "O(log n), because the search interval halves each iteration.",
      atRelative(now, { days: -7 }),
      atRelative(now, { hours: -2 }),
      { intervalDays: 5, easeFactor: 2.45, reviewCount: 6, consecutiveCorrect: 5 },
    ),
    buildReviewFlashcard(
      "Which German connective introduces a subordinate clause?",
      "Conjunctions like 'weil' or 'obwohl' send the finite verb to the end.",
      atRelative(now, { days: -6 }),
      atRelative(now, { hours: 1 }),
      { intervalDays: 3, easeFactor: 2.35, reviewCount: 4, consecutiveCorrect: 3 },
    ),
    {
      ...createFlashcard(
        "Differentiate demand-pull inflation from cost-push inflation.",
        "Demand-pull comes from excess aggregate demand; cost-push comes from rising production costs.",
        atRelative(now, { days: -2 }).toISOString(),
      ),
      status: "learning",
      dueAt: atRelative(now, { minutes: -5 }).toISOString(),
      updatedAt: atRelative(now, { minutes: -5 }).toISOString(),
      learningStepIndex: 1,
      reviewCount: 1,
      consecutiveCorrect: 1,
    },
    {
      ...createFlashcard(
        "What does a stack frame store during recursion?",
        "The return address, local variables, and arguments for each active call.",
        atRelative(now, { days: -1 }).toISOString(),
      ),
      status: "relearning",
      dueAt: atRelative(now, { minutes: -12 }).toISOString(),
      updatedAt: atRelative(now, { hours: -4 }).toISOString(),
      intervalDays: 2,
      easeFactor: 2.1,
      reviewCount: 3,
      lapseCount: 1,
      consecutiveCorrect: 0,
      learningStepIndex: 0,
      lastReviewedAt: atRelative(now, { hours: -4 }).toISOString(),
      lastOutcome: "incorrect",
    },
    createFlashcard(
      "What is the role of allusion in literary analysis?",
      "It creates layered meaning by referencing external texts, myths, or historical contexts.",
      atRelative(now, { hours: -6 }).toISOString(),
    ),
    createFlashcard(
      "How do you test for nitrate ions?",
      "Add sodium hydroxide and aluminium foil, warm gently, and test for released ammonia.",
      atRelative(now, { hours: -3 }).toISOString(),
    ),
    buildReviewFlashcard(
      "How is tree traversal represented in recursive pseudocode?",
      "Visit the node, then recurse through child branches in the chosen order.",
      atRelative(now, { days: -9 }),
      atRelative(now, { days: 2, hours: 2 }),
      { intervalDays: 8, easeFactor: 2.55, reviewCount: 8, consecutiveCorrect: 8 },
    ),
    buildReviewFlashcard(
      "Define opportunity cost.",
      "The value of the next best alternative forgone when making a choice.",
      atRelative(now, { days: -8 }),
      atRelative(now, { days: 1, hours: 5 }),
      { intervalDays: 7, easeFactor: 2.5, reviewCount: 6, consecutiveCorrect: 6 },
    ),
  ]);

  const dailyHealth: DailyHealthFact[] = Array.from({ length: 14 }, (_, index) => {
    const dayOffset = 13 - index;
    const date = atRelative(now, { days: -dayOffset });
    const dateKey = date.toISOString().slice(0, 10);
    const sleepHours = Number((7.4 + (index % 4) * 0.35 - (index % 5 === 0 ? 0.45 : 0)).toFixed(1));
    const steps = 8_100 + index * 420;
    const exerciseTimeMin = 38 + (index % 3) * 14;
    const bedtime = atRelative(date, { hours: -2, minutes: 10 + (index % 3) * 12 });
    const wakeup = atRelative(date, { hours: 5, minutes: 35 + (index % 4) * 8 });

    return {
      date: dateKey,
      sleepHours,
      sleepAsleepHours: Number((sleepHours - 0.3).toFixed(1)),
      sleepInBedHours: Number((sleepHours + 0.4).toFixed(1)),
      sleepCoreHours: Number((sleepHours * 0.54).toFixed(1)),
      sleepDeepHours: Number((sleepHours * 0.17).toFixed(1)),
      sleepRemHours: Number((sleepHours * 0.22).toFixed(1)),
      sleepAwakeHours: 0.4,
      sleepMidpointHour: 2.4 + (index % 2) * 0.2,
      sleepBedtimeHour: 22.3 + (index % 3) * 0.15,
      sleepBedtimeAt: bedtime.toISOString(),
      sleepWakeupAt: wakeup.toISOString(),
      sleepRegularitySRI: 78 + (index % 4) * 3,
      hrvMs: 56 + (index % 5) * 3,
      restingHrBpm: 52 + (index % 4),
      heartRateMinBpm: 45 + (index % 2),
      heartRateMaxBpm: 162 + (index % 6) * 2,
      heartRateAvgBpm: 69 + (index % 4),
      respiratoryRateBpm: Number((15.2 + (index % 3) * 0.4).toFixed(1)),
      steps,
      walkRunDistanceKm: Number((5.8 + index * 0.28).toFixed(1)),
      activeEnergyKj: 2_100 + index * 90,
      restingEnergyKj: 6_700 + index * 35,
      physicalEffort: 42 + (index % 5) * 8,
      exerciseTimeMin,
      standHours: 11 + (index % 3),
      standTimeMin: 710 + index * 9,
      wristTemperatureC: Number((36.5 + ((index % 3) - 1) * 0.06).toFixed(2)),
      source: "sample",
      createdAt: atRelative(date, { hours: 7, minutes: 30 }).toISOString(),
    };
  });

  const workouts: WorkoutEntry[] = [
    {
      id: "demo-workout-01",
      sourceWorkoutKey: "demo-outdoor-run-01",
      workoutNameRaw: "Outdoor Run",
      workoutDisplayLabel: "Threshold Run",
      mergeConfidence: 0.99,
      streamCount: 4,
      type: "cardio",
      startedAt: atRelative(now, { days: -6, hours: -8 }).toISOString(),
      endedAt: atRelative(now, { days: -6, hours: -7, minutes: -14 }).toISOString(),
      durationMin: 46,
      activeKcal: 462,
      activeEnergyKj: 1_934,
      restingEnergyKj: 242,
      avgHeartRate: 154,
      hrMin: 109,
      hrMax: 178,
      hrAvg: 154,
      distanceKm: 8.2,
      avgSpeedKmh: 10.7,
      maxSpeedKmh: 14.3,
      stepCount: 8_640,
      avgCadenceSpm: 178,
      flights: 9,
      elevationAscM: 62,
      elevationDescM: 61,
      intensityKcalHrKg: 7.4,
      difficultyAuto: 7.1,
      difficultyEffective: 7.1,
      trainingLoad: 78,
      source: "sample",
      createdAt: atRelative(now, { days: -6, hours: -7 }).toISOString(),
    },
    {
      id: "demo-workout-02",
      sourceWorkoutKey: "demo-strength-01",
      workoutNameRaw: "Functional Strength Training",
      workoutDisplayLabel: "Upper Body + Core",
      mergeConfidence: 0.94,
      streamCount: 1,
      type: "strength",
      startedAt: atRelative(now, { days: -4, hours: -7 }).toISOString(),
      endedAt: atRelative(now, { days: -4, hours: -6, minutes: -12 }).toISOString(),
      durationMin: 48,
      activeKcal: 328,
      activeEnergyKj: 1_372,
      avgHeartRate: 132,
      hrMin: 94,
      hrMax: 161,
      hrAvg: 132,
      source: "sample",
      difficultyAuto: 6.2,
      difficultyEffective: 6.2,
      trainingLoad: 55,
      createdAt: atRelative(now, { days: -4, hours: -6 }).toISOString(),
    },
    {
      id: "demo-workout-03",
      sourceWorkoutKey: "demo-recovery-walk-01",
      workoutNameRaw: "Outdoor Walk",
      workoutDisplayLabel: "Recovery Walk",
      mergeConfidence: 0.97,
      streamCount: 2,
      type: "recovery",
      startedAt: atRelative(now, { days: -2, hours: -6 }).toISOString(),
      endedAt: atRelative(now, { days: -2, hours: -5, minutes: -8 }).toISOString(),
      durationMin: 52,
      activeKcal: 244,
      activeEnergyKj: 1_020,
      avgHeartRate: 108,
      hrMin: 88,
      hrMax: 129,
      hrAvg: 108,
      distanceKm: 4.4,
      avgSpeedKmh: 5.1,
      maxSpeedKmh: 6.1,
      stepCount: 5_940,
      flights: 6,
      source: "sample",
      difficultyAuto: 2.8,
      difficultyEffective: 2.8,
      trainingLoad: 20,
      createdAt: atRelative(now, { days: -2, hours: -5 }).toISOString(),
    },
    {
      id: "demo-workout-04",
      sourceWorkoutKey: "demo-run-02",
      workoutNameRaw: "Outdoor Run",
      workoutDisplayLabel: "Intervals",
      mergeConfidence: 0.99,
      streamCount: 4,
      type: "cardio",
      startedAt: atRelative(now, { hours: -30 }).toISOString(),
      endedAt: atRelative(now, { hours: -29, minutes: -22 }).toISOString(),
      durationMin: 38,
      activeKcal: 401,
      activeEnergyKj: 1_678,
      restingEnergyKj: 206,
      avgHeartRate: 161,
      hrMin: 118,
      hrMax: 184,
      hrAvg: 161,
      distanceKm: 6.6,
      avgSpeedKmh: 10.4,
      maxSpeedKmh: 16.1,
      stepCount: 6_820,
      avgCadenceSpm: 182,
      flights: 11,
      elevationAscM: 54,
      elevationDescM: 53,
      intensityKcalHrKg: 7.8,
      difficultyAuto: 7.8,
      difficultyEffective: 7.8,
      trainingLoad: 81,
      source: "sample",
      createdAt: atRelative(now, { hours: -29 }).toISOString(),
    },
    {
      id: "demo-workout-05",
      sourceWorkoutKey: "demo-mobility-01",
      workoutNameRaw: "Mobility Flow",
      workoutDisplayLabel: "Mobility Reset",
      mergeConfidence: 0.88,
      streamCount: 1,
      type: "mobility",
      startedAt: atRelative(now, { hours: -5 }).toISOString(),
      endedAt: atRelative(now, { hours: -4, minutes: -28 }).toISOString(),
      durationMin: 32,
      activeKcal: 126,
      activeEnergyKj: 528,
      avgHeartRate: 89,
      hrMin: 72,
      hrMax: 108,
      hrAvg: 89,
      source: "sample",
      difficultyAuto: 1.9,
      difficultyEffective: 1.9,
      trainingLoad: 11,
      createdAt: atRelative(now, { hours: -4 }).toISOString(),
    },
  ];

  const workoutDetails: WorkoutDetail[] = [
    buildWorkoutDetail(
      workouts[0],
      [
        "demo-outdoor-run-01-heart-rate.csv",
        "demo-outdoor-run-01-distance.csv",
        "demo-outdoor-run-01-energy.csv",
      ],
      [128, 137, 146, 152, 158, 162, 166, 171, 168, 160, 152],
      [0.48, 0.56, 0.63, 0.71, 0.78, 0.83, 0.89, 0.92, 0.78, 0.72, 0.4],
      [760, 780, 806, 818, 830, 844, 856, 864, 820, 782, 480],
      [132, 146, 168, 181, 194, 205, 214, 226, 192, 168, 108],
    ),
    buildWorkoutDetail(
      workouts[3],
      [
        "demo-run-02-heart-rate.csv",
        "demo-run-02-distance.csv",
        "demo-run-02-energy.csv",
      ],
      [136, 149, 162, 171, 178, 183, 175, 168],
      [0.62, 0.78, 0.9, 0.95, 1.02, 0.94, 0.81, 0.58],
      [790, 850, 902, 924, 948, 930, 862, 614],
      [154, 172, 198, 214, 228, 216, 188, 142],
    ),
  ];

  const healthRawFiles = [
    {
      id: "demo-raw-file-01",
      hash: "demo-hash-aggregate",
      filename: "demo-health-export-aggregate.csv",
      fileType: "aggregate" as const,
      rowCount: 14,
      importedAt: atRelative(now, { days: -7, hours: -1 }).toISOString(),
    },
    {
      id: "demo-raw-file-02",
      hash: "demo-hash-run",
      filename: "demo-outdoor-run-01-heart-rate.csv",
      fileType: "workout_stream" as const,
      rowCount: 11,
      importedAt: atRelative(now, { days: -6, hours: -6 }).toISOString(),
    },
    {
      id: "demo-raw-file-03",
      hash: "demo-hash-mobile",
      filename: "demo-mobile-sync.json",
      fileType: "mobile_sync" as const,
      rowCount: 5,
      importedAt: atRelative(now, { hours: -26 }).toISOString(),
    },
  ];

  return {
    exams,
    studySessions,
    todos,
    flashcards,
    dailyHealth,
    workouts,
    workoutDetails,
    healthRawFiles,
    healthRawRows: [],
    healthImportDeadLetters: [],
    goals,
    settings: {
      timezone,
      examHighlightColor: EXAM_HIGHLIGHT_COLOR,
    },
  };
}
