import { sortTodos } from "@/lib/dashboard-utils";
import { applyFlashcardGrade } from "@/lib/flashcards/scheduler";
import type {
  AppData,
  Exam,
  OfflineAction,
  PerformanceGoals,
  SubjectId,
} from "@/lib/types";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
export type GoalsDraftState = {
  sleepHoursTarget: string;
  baselineStudyHours: string;
  weeklyWorkoutTarget: string;
  weekdayWakeTime: string;
  weekendWakeTime: string;
  preferredBedtimeStart: string;
  preferredBedtimeEnd: string;
  ageYears: string;
};
export type GoalsDraftErrors = Partial<Record<keyof GoalsDraftState, string>>;

export function createOfflineAction(
  action: Omit<OfflineAction, "id" | "createdAt">,
): OfflineAction {
  return {
    ...action,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  } as OfflineAction;
}

export function toGoalsDraft(goals: PerformanceGoals): GoalsDraftState {
  return {
    sleepHoursTarget: goals.sleepHoursTarget.toString(),
    baselineStudyHours: goals.baselineStudyHours.toString(),
    weeklyWorkoutTarget: goals.weeklyWorkoutTarget.toString(),
    weekdayWakeTime: goals.weekdayWakeTime,
    weekendWakeTime: goals.weekendWakeTime,
    preferredBedtimeStart: goals.preferredBedtimeStart,
    preferredBedtimeEnd: goals.preferredBedtimeEnd,
    ageYears: goals.ageYears.toString(),
  };
}

export function parseGoalsDraft(draft: GoalsDraftState): {
  parsed: PerformanceGoals | null;
  errors: GoalsDraftErrors;
} {
  const errors: GoalsDraftErrors = {};
  const parseBoundedNumber = (
    key: keyof GoalsDraftState,
    label: string,
    min: number,
    max: number,
    roundToInt = false,
  ): number | null => {
    const raw = draft[key].trim().replace(",", ".");
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      errors[key] = `${label} must be a valid number.`;
      return null;
    }
    if (value < min || value > max) {
      errors[key] = `${label} must be between ${min} and ${max}.`;
      return null;
    }
    return roundToInt ? Math.round(value) : value;
  };

  const sleepHoursTarget = parseBoundedNumber("sleepHoursTarget", "Sleep target", 4, 12);
  const baselineStudyHours = parseBoundedNumber("baselineStudyHours", "Study target", 0.5, 12);
  const weeklyWorkoutTarget = parseBoundedNumber(
    "weeklyWorkoutTarget",
    "Weekly run target",
    0,
    14,
    true,
  );
  const ageYears = parseBoundedNumber("ageYears", "Age", 12, 90, true);

  if (!TIME_PATTERN.test(draft.weekdayWakeTime.trim())) {
    errors.weekdayWakeTime = "Weekday wake time must use HH:mm.";
  }
  if (!TIME_PATTERN.test(draft.weekendWakeTime.trim())) {
    errors.weekendWakeTime = "Weekend wake time must use HH:mm.";
  }
  if (!TIME_PATTERN.test(draft.preferredBedtimeStart.trim())) {
    errors.preferredBedtimeStart = "Preferred bedtime start must use HH:mm.";
  }
  if (!TIME_PATTERN.test(draft.preferredBedtimeEnd.trim())) {
    errors.preferredBedtimeEnd = "Preferred bedtime end must use HH:mm.";
  }

  if (Object.keys(errors).length > 0) {
    return { parsed: null, errors };
  }

  return {
    parsed: {
      sleepHoursTarget: sleepHoursTarget as number,
      baselineStudyHours: baselineStudyHours as number,
      weeklyWorkoutTarget: weeklyWorkoutTarget as number,
      weekdayWakeTime: draft.weekdayWakeTime.trim(),
      weekendWakeTime: draft.weekendWakeTime.trim(),
      preferredBedtimeStart: draft.preferredBedtimeStart.trim(),
      preferredBedtimeEnd: draft.preferredBedtimeEnd.trim(),
      ageYears: ageYears as number,
    },
    errors,
  };
}

export function applyOfflineAction(data: AppData, action: OfflineAction): AppData {
  if (action.type === "createStudySession") {
    return {
      ...data,
      studySessions: [...data.studySessions, action.payload],
    };
  }

  if (action.type === "createTodo") {
    return {
      ...data,
      todos: sortTodos([...data.todos, action.payload]),
    };
  }

  if (action.type === "updateTodo") {
    return {
      ...data,
      todos: sortTodos(
        data.todos.map((todo) =>
          todo.id === action.payload.id ? { ...todo, ...action.payload.patch } : todo,
        ),
      ),
    };
  }

  if (action.type === "archiveTodo") {
    return {
      ...data,
      todos: sortTodos(
        data.todos.map((todo) =>
          todo.id === action.payload.id
            ? {
                ...todo,
                archived: true,
                completed: true,
                completedAt: todo.completedAt ?? new Date().toISOString(),
              }
            : todo,
        ),
      ),
    };
  }

  if (action.type === "restoreTodo") {
    return {
      ...data,
      todos: sortTodos(
        data.todos.map((todo) =>
          todo.id === action.payload.id
            ? {
                ...todo,
                archived: false,
                completed: false,
                completedAt: undefined,
              }
            : todo,
        ),
      ),
    };
  }

  if (action.type === "updateExams") {
    return {
      ...data,
      exams: [...action.payload.exams].sort(
        (left, right) =>
          new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
      ),
    };
  }

  if (action.type === "createFlashcard") {
    const exists = data.flashcards.some((card) => card.id === action.payload.id);
    return {
      ...data,
      flashcards: exists ? data.flashcards : [...data.flashcards, action.payload],
    };
  }

  if (action.type === "gradeFlashcard") {
    const timezone = data.settings?.timezone || "Europe/Berlin";
    const result = applyFlashcardGrade(data.flashcards, action.payload, timezone);
    return {
      ...data,
      flashcards: result.cards,
    };
  }

  return data;
}

export function getExamSubjectIds(exams: Exam[]): SubjectId[] {
  const seen = new Set<SubjectId>();
  const ordered: SubjectId[] = [];

  for (const exam of exams) {
    if (seen.has(exam.subjectId)) {
      continue;
    }
    seen.add(exam.subjectId);
    ordered.push(exam.subjectId);
  }

  return ordered;
}
