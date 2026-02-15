"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AFTERNOON_MESSAGES,
  CALENDAR_DAYS_AHEAD,
  EVENING_MESSAGES,
  LATE_NIGHT_MESSAGES,
  MIN_SESSION_SECONDS,
  MORNING_MESSAGES,
  SUBJECT_BY_ID,
  SUBJECT_IDS,
  SUBJECTS,
  createDefaultAppData,
  createEmptySubjectTotals,
} from "@/lib/constants";
import {
  buildDayAggregates,
  buildForwardDates,
  buildSubjectTotals,
  formatClock,
  formatDateTime,
  formatDuration,
  getCountdown,
  getGreetingBucket,
  getNearestExams,
  sortTodos,
  toDateKey,
} from "@/lib/dashboard-utils";
import { createDashboardRepository } from "@/lib/client/repository";
import { buildPerformanceInsights } from "@/lib/health-engine";
import {
  buildDayHoverModel,
  computeTooltipPlacement,
  type DayHoverModel,
} from "@/lib/calendar-tooltip";
import type {
  ActiveTimerState,
  AppData,
  DailyHealthFact,
  DailyRecommendation,
  DailyReadiness,
  DashboardBootstrap,
  Exam,
  OfflineAction,
  PerformanceGoals,
  StudySession,
  SubjectId,
  TodoItem,
  WorkoutDetail,
  WorkoutEntry,
  WorkoutStreamPoint,
  WorkoutType,
} from "@/lib/types";

type AuthStatus = "checking" | "signedOut" | "signedIn";
type ExpandedCard = "calendar" | "timer" | "totals" | "health" | null;

const TIMER_STORAGE_KEY = "yan-study-os:active-timer:v1";
const OFFLINE_QUEUE_KEY = "yan-study-os:offline-queue:v1";
const EXAM_BACKUP_KEY = "yan-study-os:exam-backup:v1";
const COUNTDOWN_BASELINES_KEY = "yan-study-os:countdown-baselines:v1";
const INITIAL_NOW_MS = Date.now();
const CALENDAR_MIN_START_DATE = "2026-02-10";
type ExamTimeSlot = "09:00" | "13:00";
type ExamDraftRow = Exam & {
  monthDay: string;
  timeSlot: ExamTimeSlot;
};

function createOfflineAction(
  action: Omit<OfflineAction, "id" | "createdAt">,
): OfflineAction {
  return {
    ...action,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  } as OfflineAction;
}

function getActiveElapsedSeconds(timer: ActiveTimerState | null, nowMs: number): number {
  if (!timer) {
    return 0;
  }

  const currentRunSeconds =
    timer.isRunning && timer.resumedAt
      ? Math.max(
          0,
          Math.floor((nowMs - new Date(timer.resumedAt).getTime()) / 1000),
        )
      : 0;

  return timer.elapsedBeforePauseSec + currentRunSeconds;
}

function applyOfflineAction(data: AppData, action: OfflineAction): AppData {
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
          todo.id === action.payload.id
            ? { ...todo, ...action.payload.patch }
            : todo,
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

  return data;
}

function getExamMonthDayValue(isoDate: string): string {
  const date = new Date(isoDate);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${month}-${day}`;
}

function getExamTimeSlotValue(isoDate: string): ExamTimeSlot {
  const date = new Date(isoDate);
  return date.getHours() >= 12 ? "13:00" : "09:00";
}

function toExamDraftRow(exam: Exam): ExamDraftRow {
  return {
    ...exam,
    monthDay: getExamMonthDayValue(exam.startsAt),
    timeSlot: getExamTimeSlotValue(exam.startsAt),
  };
}

function monthDayToIso(monthDay: string, timeValue: string): string | null {
  const trimmed = monthDay.trim();
  const match = /^(\d{1,2})-(\d{1,2})$/.exec(trimmed);

  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const [hourString, minuteString] = (timeValue || "18:00").split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const now = new Date();
  let year = now.getFullYear();
  let candidate = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day ||
    candidate.getHours() !== hour ||
    candidate.getMinutes() !== minute
  ) {
    return null;
  }

  if (candidate.getTime() < now.getTime()) {
    year += 1;
    candidate = new Date(year, month - 1, day, hour, minute, 0, 0);
  }

  return candidate.toISOString();
}

function readStoredTimer(): ActiveTimerState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(TIMER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ActiveTimerState;
  } catch {
    window.localStorage.removeItem(TIMER_STORAGE_KEY);
    return null;
  }
}

function readStoredQueue(): OfflineAction[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as OfflineAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return [];
  }
}

function readCountdownBaselines(): Record<string, number> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(COUNTDOWN_BASELINES_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, seconds]) => typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0,
      ),
    );
  } catch {
    window.localStorage.removeItem(COUNTDOWN_BASELINES_KEY);
    return {};
  }
}

function mergeCountdownBaselines(
  exams: Exam[],
  currentBaselines: Record<string, number>,
  nowMs = Date.now(),
): Record<string, number> {
  const nextBaselines = { ...currentBaselines };
  const activeIds = new Set<string>();
  let changed = false;

  for (const exam of exams) {
    const examMs = new Date(exam.startsAt).getTime();
    if (examMs <= nowMs) {
      continue;
    }

    activeIds.add(exam.id);
    const secondsLeft = Math.max(1, Math.floor((examMs - nowMs) / 1000));
    const currentValue = nextBaselines[exam.id];

    if (!currentValue || currentValue <= 0 || secondsLeft > currentValue + 3600) {
      nextBaselines[exam.id] = secondsLeft;
      changed = true;
    }
  }

  for (const examId of Object.keys(nextBaselines)) {
    if (!activeIds.has(examId)) {
      delete nextBaselines[examId];
      changed = true;
    }
  }

  return changed ? nextBaselines : currentBaselines;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
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

function toAppData(bootstrap: DashboardBootstrap, timezone: string): AppData {
  return {
    exams: bootstrap.exams,
    studySessions: bootstrap.studySessions,
    todos: bootstrap.todos,
    dailyHealth: Array.isArray(bootstrap.dailyHealth) ? bootstrap.dailyHealth : [],
    workouts: Array.isArray(bootstrap.workouts) ? bootstrap.workouts : [],
    workoutDetails: Array.isArray(bootstrap.workoutDetails) ? bootstrap.workoutDetails : [],
    healthRawFiles: Array.isArray(bootstrap.healthRawFiles) ? bootstrap.healthRawFiles : [],
    healthRawRows: Array.isArray(bootstrap.healthRawRows) ? bootstrap.healthRawRows : [],
    goals: bootstrap.goals || createDefaultAppData(timezone).goals,
    settings: {
      timezone: bootstrap.settings?.timezone || timezone,
      examHighlightColor: bootstrap.settings?.examHighlightColor || "#00F0FF",
    },
  };
}

function FocusModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const focusable = panel.querySelectorAll<HTMLElement>(
      "button, input, select, textarea, [href], [tabindex]:not([tabindex='-1'])",
    );

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (first) {
      first.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }

      if (event.key === "Tab" && focusable.length > 0) {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }

        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        className="h-full max-h-[92vh] w-full max-w-[1200px] overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--panel-border)] px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--panel-border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
          >
            Close
          </button>
        </div>
        <div className="h-[calc(92vh-56px)] overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export default function StudyDashboard() {
  const repository = useMemo(() => createDashboardRepository(), []);

  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [data, setData] = useState<AppData | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<ExpandedCard>(null);
  const [isCountdownExpanded, setIsCountdownExpanded] = useState(false);
  const focusFeedSectionRef = useRef<HTMLElement | null>(null);
  const focusFeedScrollRef = useRef<HTMLDivElement | null>(null);
  const focusFeedTooltipRef = useRef<HTMLDivElement | null>(null);
  const [hoveredFocusDay, setHoveredFocusDay] = useState<{
    dateKey: string;
    anchorElement: HTMLButtonElement;
  } | null>(null);
  const [focusTooltipPosition, setFocusTooltipPosition] = useState<{
    left: number;
    top: number;
    placement: "above" | "below";
  } | null>(null);
  const [focusTooltipMaxWidth, setFocusTooltipMaxWidth] = useState(360);

  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(() =>
    readStoredTimer(),
  );
  const [timerSubjectId, setTimerSubjectId] = useState<SubjectId>(() => {
    const storedTimer = readStoredTimer();
    return storedTimer?.subjectId ?? SUBJECT_IDS[0];
  });
  const [quickAddMinutes, setQuickAddMinutes] = useState("45");
  const [clockNowMs, setClockNowMs] = useState(INITIAL_NOW_MS);
  const [timePulse, setTimePulse] = useState(INITIAL_NOW_MS);

  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>(() =>
    readStoredQueue(),
  );
  const [countdownBaselines, setCountdownBaselines] = useState<Record<string, number>>(
    () => readCountdownBaselines(),
  );
  const [goalsDraft, setGoalsDraft] = useState<PerformanceGoals | null>(null);
  const [goalsSaving, setGoalsSaving] = useState(false);
  const [csvInput, setCsvInput] = useState("");
  const [csvImporting, setCsvImporting] = useState(false);
  const [batchImportSummary, setBatchImportSummary] = useState<{
    importedHealthDays: number;
    importedWorkouts: number;
    filesProcessed: number;
    filesSkipped: number;
    linkedStreams?: number;
  } | null>(null);
  const [workoutTypeDraft, setWorkoutTypeDraft] = useState<WorkoutType>("cardio");
  const [workoutDurationDraft, setWorkoutDurationDraft] = useState("35");
  const [workoutKcalDraft, setWorkoutKcalDraft] = useState("");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState<WorkoutDetail | null>(null);
  const [loadingWorkoutDetail, setLoadingWorkoutDetail] = useState(false);

  useEffect(() => {
    let isMounted = true;

    request<{ authenticated: boolean }>("/api/auth/session")
      .then((payload) => {
        if (!isMounted) {
          return;
        }
        setAuthStatus(payload.authenticated ? "signedIn" : "signedOut");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setAuthStatus("signedOut");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimePulse(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!activeTimer?.isRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setClockNowMs(Date.now());
    }, 1_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeTimer?.isRunning]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (activeTimer) {
      window.localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(activeTimer));
      return;
    }

    window.localStorage.removeItem(TIMER_STORAGE_KEY);
  }, [activeTimer]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      COUNTDOWN_BASELINES_KEY,
      JSON.stringify(countdownBaselines),
    );
  }, [countdownBaselines]);

  const queueOfflineAction = useCallback((action: OfflineAction) => {
    setOfflineQueue((currentQueue) => [...currentQueue, action]);
  }, []);

  const flushOfflineQueue = useCallback(async () => {
    if (repository.mode !== "api" || offlineQueue.length === 0) {
      return;
    }

    const remaining: OfflineAction[] = [];

    for (const action of offlineQueue) {
      try {
        if (action.type === "createStudySession") {
          await repository.createStudySession(action.payload);
        }

        if (action.type === "createTodo") {
          await repository.createTodo(action.payload);
        }

        if (action.type === "updateTodo") {
          await repository.updateTodo(action.payload.id, action.payload.patch);
        }

        if (action.type === "archiveTodo") {
          await repository.archiveTodo(action.payload.id);
        }

        if (action.type === "restoreTodo") {
          await repository.restoreTodo(action.payload.id);
        }

        if (action.type === "updateExams") {
          await repository.updateExams(action.payload.exams);
        }
      } catch {
        remaining.push(action);
      }
    }

    setOfflineQueue(remaining);
  }, [offlineQueue, repository]);

  useEffect(() => {
    if (authStatus !== "signedIn") {
      return;
    }

    let isMounted = true;

    async function loadDashboard() {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin";

      try {
        const bootstrap = await repository.getBootstrap();

        let nextData = toAppData(bootstrap, timezone);

        if (offlineQueue.length > 0) {
          nextData = offlineQueue.reduce(applyOfflineAction, nextData);
        }

        if (isMounted) {
          setData(nextData);
          setCountdownBaselines((currentBaselines) =>
            mergeCountdownBaselines(nextData.exams, currentBaselines, Date.now()),
          );
          setStatusMessage(null);
        }
      } catch {
        if (!isMounted) {
          return;
        }

        const fallbackData = createDefaultAppData(timezone);
        setData(fallbackData);
        setCountdownBaselines((currentBaselines) =>
          mergeCountdownBaselines(fallbackData.exams, currentBaselines, Date.now()),
        );
        setStatusMessage(
          "Dashboard fallback mode: seeded local data loaded because bootstrap failed.",
        );
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [authStatus, repository, offlineQueue]);

  useEffect(() => {
    if (repository.mode !== "api") {
      return;
    }

    const flushTimeout = window.setTimeout(() => {
      void flushOfflineQueue();
    }, 0);

    const onOnline = () => {
      void flushOfflineQueue();
    };

    window.addEventListener("online", onOnline);
    return () => {
      window.clearTimeout(flushTimeout);
      window.removeEventListener("online", onOnline);
    };
  }, [flushOfflineQueue, repository.mode]);

  useEffect(() => {
    if (!data) {
      return;
    }

    setGoalsDraft(data.goals);
  }, [data]);

  useEffect(() => {
    if (!data || !selectedWorkoutId) {
      return;
    }

    const detail =
      data.workoutDetails.find((item) => item.workoutId === selectedWorkoutId) || null;
    setSelectedWorkoutDetail(detail);
  }, [data, selectedWorkoutId]);

  const greeting = useMemo(() => {
    const now = new Date(timePulse);
    const bucket = getGreetingBucket(now);
    const source =
      bucket === "morning"
        ? MORNING_MESSAGES
        : bucket === "afternoon"
        ? AFTERNOON_MESSAGES
        : bucket === "evening"
        ? EVENING_MESSAGES
        : LATE_NIGHT_MESSAGES;

    const seed = Number(
      `${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}${now.getHours()}`,
    );
    const index = source.length > 0 ? seed % source.length : 0;
    return source[index] || source[0];
  }, [timePulse]);

  const elapsedSeconds = useMemo(
    () => getActiveElapsedSeconds(activeTimer, clockNowMs),
    [activeTimer, clockNowMs],
  );

  const dayAggregates = useMemo(() => {
    return data ? buildDayAggregates(data.studySessions) : {};
  }, [data]);

  const subjectTotals = useMemo(() => {
    return data ? buildSubjectTotals(data.studySessions) : createEmptySubjectTotals();
  }, [data]);

  const nearestExams = useMemo(() => {
    return data ? getNearestExams(data.exams, 3, new Date(timePulse)) : [];
  }, [data, timePulse]);

  const allUpcomingExams = useMemo(() => {
    return data ? getNearestExams(data.exams, 99, new Date(timePulse)) : [];
  }, [data, timePulse]);

  const getExamBaselineSeconds = useCallback(
    (exam: Exam): number => {
      const persistedBaseline = countdownBaselines[exam.id];
      if (persistedBaseline && persistedBaseline > 0) {
        return persistedBaseline;
      }

      const initialBaseline = Math.max(
        1,
        Math.floor((new Date(exam.startsAt).getTime() - INITIAL_NOW_MS) / 1000),
      );
      return initialBaseline;
    },
    [countdownBaselines],
  );

  const upcomingExamWeekGroups = useMemo(() => {
    if (allUpcomingExams.length === 0) {
      return [] as Array<{ week: number; exams: Exam[] }>;
    }

    const anchorDate = new Date(allUpcomingExams[0].startsAt);
    anchorDate.setHours(0, 0, 0, 0);
    const weekBuckets = new Map<number, Exam[]>();

    for (const exam of allUpcomingExams) {
      const examDate = new Date(exam.startsAt);
      examDate.setHours(0, 0, 0, 0);
      const rawWeek =
        Math.floor((examDate.getTime() - anchorDate.getTime()) / (7 * 86400 * 1000)) + 1;
      const week = Math.max(1, Math.min(4, rawWeek));

      if (!weekBuckets.has(week)) {
        weekBuckets.set(week, []);
      }

      weekBuckets.get(week)!.push(exam);
    }

    return [1, 2, 3, 4]
      .map((week) => ({ week, exams: weekBuckets.get(week) || [] }))
      .filter((group) => group.exams.length > 0);
  }, [allUpcomingExams]);

  const calendarStartDate = useMemo(() => {
    const date = new Date(`${CALENDAR_MIN_START_DATE}T00:00:00`);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const calendarDays = useMemo(
    () => buildForwardDates(calendarStartDate, CALENDAR_DAYS_AHEAD),
    [calendarStartDate],
  );

  const examsByDate = useMemo(() => {
    if (!data) {
      return {} as Record<string, Exam[]>;
    }

    return data.exams.reduce<Record<string, Exam[]>>((accumulator, exam) => {
      const key = toDateKey(exam.startsAt);
      accumulator[key] = accumulator[key] || [];
      accumulator[key].push(exam);
      return accumulator;
    }, {});
  }, [data]);

  const activeTodos = useMemo(() => {
    if (!data) {
      return [];
    }

    return sortTodos(data.todos.filter((todo) => !todo.archived));
  }, [data]);

  const archivedTodos = useMemo(() => {
    if (!data) {
      return [];
    }

    return sortTodos(data.todos.filter((todo) => todo.archived));
  }, [data]);

  const todosByDate = useMemo(() => {
    return activeTodos.reduce<Record<string, TodoItem[]>>((accumulator, todo) => {
      const key = toDateKey(todo.deadline);
      accumulator[key] = accumulator[key] || [];
      accumulator[key].push(todo);
      return accumulator;
    }, {});
  }, [activeTodos]);

  const performanceInsights = useMemo(() => {
    if (!data) {
      return null;
    }

    return buildPerformanceInsights(data, new Date(timePulse));
  }, [data, timePulse]);

  const readinessByDate = useMemo(
    () => performanceInsights?.readinessByDate || {},
    [performanceInsights],
  );
  const recommendationsByDate = useMemo(
    () => performanceInsights?.recommendationsByDate || {},
    [performanceInsights],
  );
  const todayReadiness = performanceInsights?.todayReadiness || null;
  const todayRecommendation = performanceInsights?.todayRecommendation || null;

  const workoutsByDate = useMemo(() => {
    if (!performanceInsights) {
      return {} as Record<string, WorkoutEntry[]>;
    }

    return performanceInsights.workouts.reduce<Record<string, WorkoutEntry[]>>(
      (accumulator, workout) => {
        const key = toDateKey(workout.startedAt);
        accumulator[key] = accumulator[key] || [];
        accumulator[key].push(workout);
        return accumulator;
      },
      {},
    );
  }, [performanceInsights]);

  const sortedWorkouts = useMemo(() => {
    if (!performanceInsights) {
      return [];
    }

    return [...performanceInsights.workouts].sort(
      (left, right) =>
        new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
    );
  }, [performanceInsights]);

  const healthDaysSorted = useMemo(() => {
    if (!performanceInsights) {
      return [] as DailyHealthFact[];
    }

    return [...performanceInsights.healthDays].sort(
      (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
    );
  }, [performanceInsights]);

  const sleepTrend14 = useMemo(
    () => healthDaysSorted.slice(-14),
    [healthDaysSorted],
  );

  const sleepTrend30 = useMemo(
    () => healthDaysSorted.slice(-30),
    [healthDaysSorted],
  );

  const sleepAverage7 = useMemo(() => {
    const tail = healthDaysSorted.slice(-7).map((day) => day.sleepHours);
    if (tail.length === 0) {
      return 0;
    }

    return tail.reduce((sum, value) => sum + value, 0) / tail.length;
  }, [healthDaysSorted]);

  const sleepScoreSeries7 = useMemo(() => {
    return healthDaysSorted.slice(-7).map((day) => ({
      date: day.date,
      score: readinessByDate[day.date]?.sleepScore || 0,
    }));
  }, [healthDaysSorted, readinessByDate]);

  const sleepScoreAverage7 = useMemo(() => {
    if (sleepScoreSeries7.length === 0) {
      return 0;
    }

    return (
      sleepScoreSeries7.reduce((sum, item) => sum + item.score, 0) /
      sleepScoreSeries7.length
    );
  }, [sleepScoreSeries7]);

  const healthByDate = useMemo(() => {
    return healthDaysSorted.reduce<Record<string, DailyHealthFact>>((accumulator, item) => {
      accumulator[item.date] = item;
      return accumulator;
    }, {});
  }, [healthDaysSorted]);

  const sleepRollingByDate = useMemo(() => {
    const sleepHourAverages: Record<string, number> = {};
    const sleepScoreAverages: Record<string, number> = {};
    const hourWindow: number[] = [];
    const scoreWindow: number[] = [];

    for (const item of healthDaysSorted) {
      hourWindow.push(item.sleepHours);
      if (hourWindow.length > 7) {
        hourWindow.shift();
      }

      const sleepScore = readinessByDate[item.date]?.sleepScore;
      if (typeof sleepScore === "number" && Number.isFinite(sleepScore)) {
        scoreWindow.push(sleepScore);
      }
      if (scoreWindow.length > 7) {
        scoreWindow.shift();
      }

      sleepHourAverages[item.date] =
        hourWindow.reduce((sum, value) => sum + value, 0) / hourWindow.length;

      sleepScoreAverages[item.date] =
        scoreWindow.length > 0
          ? scoreWindow.reduce((sum, value) => sum + value, 0) / scoreWindow.length
          : 0;
    }

    return {
      sleepHourAverages,
      sleepScoreAverages,
    };
  }, [healthDaysSorted, readinessByDate]);

  const todayKey = useMemo(() => toDateKey(new Date(timePulse)), [timePulse]);

  const dayHoverByDate = useMemo(() => {
    const result: Record<string, DayHoverModel> = {};

    for (const dateKey of calendarDays) {
      result[dateKey] = buildDayHoverModel({
        dateKey,
        todayKey,
        aggregate: dayAggregates[dateKey],
        workouts: workoutsByDate[dateKey] || [],
        tests: examsByDate[dateKey] || [],
        todos: todosByDate[dateKey] || [],
        healthDay: healthByDate[dateKey],
        readiness: readinessByDate[dateKey],
        sleepHours7d: sleepRollingByDate.sleepHourAverages[dateKey],
        sleepScore7d: sleepRollingByDate.sleepScoreAverages[dateKey],
      });
    }

    return result;
  }, [
    calendarDays,
    dayAggregates,
    examsByDate,
    healthByDate,
    readinessByDate,
    sleepRollingByDate.sleepHourAverages,
    sleepRollingByDate.sleepScoreAverages,
    todayKey,
    todosByDate,
    workoutsByDate,
  ]);

  const hoveredFocusModel = useMemo(() => {
    if (!hoveredFocusDay) {
      return null;
    }

    return dayHoverByDate[hoveredFocusDay.dateKey] || null;
  }, [dayHoverByDate, hoveredFocusDay]);

  const updateFocusTooltipPosition = useCallback(() => {
    if (!hoveredFocusDay || !focusFeedSectionRef.current) {
      setFocusTooltipPosition(null);
      return;
    }

    if (!document.body.contains(hoveredFocusDay.anchorElement)) {
      setHoveredFocusDay(null);
      setFocusTooltipPosition(null);
      return;
    }

    const containerRect = focusFeedSectionRef.current.getBoundingClientRect();
    const anchorRect = hoveredFocusDay.anchorElement.getBoundingClientRect();
    const tooltipRect = focusFeedTooltipRef.current?.getBoundingClientRect();

    setFocusTooltipMaxWidth(Math.max(260, Math.floor(containerRect.width - 16)));
    setFocusTooltipPosition(
      computeTooltipPlacement({
        anchorRect,
        containerRect,
        tooltipRect: {
          width: tooltipRect?.width || 320,
          height: tooltipRect?.height || 160,
        },
      }),
    );
  }, [hoveredFocusDay]);

  useEffect(() => {
    if (!hoveredFocusDay) {
      setFocusTooltipPosition(null);
      return;
    }

    const frame = window.requestAnimationFrame(updateFocusTooltipPosition);
    const handleRefresh = () => updateFocusTooltipPosition();
    const scrollElement = focusFeedScrollRef.current;

    window.addEventListener("resize", handleRefresh);
    scrollElement?.addEventListener("scroll", handleRefresh, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleRefresh);
      scrollElement?.removeEventListener("scroll", handleRefresh);
    };
  }, [hoveredFocusDay, updateFocusTooltipPosition]);

  useEffect(() => {
    if (!hoveredFocusDay) {
      return;
    }

    updateFocusTooltipPosition();
  }, [hoveredFocusModel, hoveredFocusDay, updateFocusTooltipPosition]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    try {
      await request<{ ok: true }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ passcode }),
      });
      setPasscode("");
      setAuthStatus("signedIn");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Unable to verify passcode",
      );
    }
  };

  const handleLogout = async () => {
    await request<{ ok: true }>("/api/auth/logout", { method: "POST" }).catch(() => null);
    setAuthStatus("signedOut");
    setData(null);
  };

  const applyMutation = useCallback(
    async (
      optimisticUpdate: (prev: AppData) => AppData,
      remoteAction: () => Promise<void>,
      fallbackAction?: OfflineAction,
    ) => {
      setData((previous) => (previous ? optimisticUpdate(previous) : previous));

      try {
        await remoteAction();
      } catch {
        if (fallbackAction && repository.mode === "api") {
          queueOfflineAction(fallbackAction);
          setStatusMessage("Offline queue updated. Changes will sync when connection recovers.");
        } else {
          setStatusMessage("Action failed and was not synced.");
        }
      }
    },
    [queueOfflineAction, repository.mode],
  );

  const handleStartTimer = () => {
    const nowIso = new Date().toISOString();

    setActiveTimer({
      subjectId: timerSubjectId,
      startedAt: nowIso,
      elapsedBeforePauseSec: 0,
      isRunning: true,
      resumedAt: nowIso,
    });

    setClockNowMs(Date.now());
    setStatusMessage(null);
  };

  const handlePauseResumeTimer = () => {
    setActiveTimer((current) => {
      if (!current) {
        return current;
      }

      if (current.isRunning && current.resumedAt) {
        const elapsedThisRun = Math.max(
          0,
          Math.floor((Date.now() - new Date(current.resumedAt).getTime()) / 1000),
        );

        return {
          ...current,
          elapsedBeforePauseSec: current.elapsedBeforePauseSec + elapsedThisRun,
          isRunning: false,
          resumedAt: undefined,
        };
      }

      const nowIso = new Date().toISOString();
      return {
        ...current,
        isRunning: true,
        resumedAt: nowIso,
      };
    });
  };

  const handleEndTimer = async () => {
    if (!activeTimer || !data) {
      return;
    }

    const endedAt = new Date().toISOString();
    const totalSeconds = getActiveElapsedSeconds(activeTimer, Date.now());
    const subjectId = activeTimer.subjectId;

    setActiveTimer(null);

    if (totalSeconds < MIN_SESSION_SECONDS) {
      setStatusMessage("Session shorter than 5 minutes was not added to your log.");
      return;
    }

    const session: StudySession = {
      id: crypto.randomUUID(),
      subjectId,
      startedAt: activeTimer.startedAt,
      endedAt,
      durationSec: totalSeconds,
      createdAt: endedAt,
    };

    await applyMutation(
      (previous) => ({
        ...previous,
        studySessions: [...previous.studySessions, session],
      }),
      () => repository.createStudySession(session),
      createOfflineAction({ type: "createStudySession", payload: session }),
    );

    setStatusMessage(`Saved ${formatDuration(totalSeconds)} of ${SUBJECT_BY_ID[subjectId].name}.`);
  };

  const handleQuickAddSession = async () => {
    if (!data) {
      return;
    }

    const minutes = Number(quickAddMinutes.replace(",", "."));
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setStatusMessage("Enter quick-add minutes greater than 0.");
      return;
    }

    const durationSec = Math.max(60, Math.round(minutes * 60));
    const endedAt = new Date().toISOString();
    const startedAt = new Date(Date.now() - durationSec * 1000).toISOString();
    const subjectId = activeTimer ? activeTimer.subjectId : timerSubjectId;

    const session: StudySession = {
      id: crypto.randomUUID(),
      subjectId,
      startedAt,
      endedAt,
      durationSec,
      createdAt: endedAt,
    };

    await applyMutation(
      (previous) => ({
        ...previous,
        studySessions: [...previous.studySessions, session],
      }),
      () => repository.createStudySession(session),
      createOfflineAction({ type: "createStudySession", payload: session }),
    );

    setQuickAddMinutes("");
    setStatusMessage(
      `Quick-added ${formatDuration(durationSec)} of ${SUBJECT_BY_ID[subjectId].name}.`,
    );
  };

  const handleAddTodo = async (todo: TodoItem) => {
    await applyMutation(
      (previous) => ({
        ...previous,
        todos: sortTodos([...previous.todos, todo]),
      }),
      () => repository.createTodo(todo),
      createOfflineAction({ type: "createTodo", payload: todo }),
    );
  };

  const handleArchiveTodo = async (todoId: string) => {
    await applyMutation(
      (previous) => ({
        ...previous,
        todos: sortTodos(
          previous.todos.map((todo) =>
            todo.id === todoId
              ? {
                  ...todo,
                  archived: true,
                  completed: true,
                  completedAt: todo.completedAt || new Date().toISOString(),
                }
              : todo,
          ),
        ),
      }),
      () => repository.archiveTodo(todoId),
      createOfflineAction({ type: "archiveTodo", payload: { id: todoId } }),
    );
  };

  const handleRestoreTodo = async (todoId: string) => {
    await applyMutation(
      (previous) => ({
        ...previous,
        todos: sortTodos(
          previous.todos.map((todo) =>
            todo.id === todoId
              ? {
                  ...todo,
                  archived: false,
                  completed: false,
                  completedAt: undefined,
                }
              : todo,
          ),
        ),
      }),
      () => repository.restoreTodo(todoId),
      createOfflineAction({ type: "restoreTodo", payload: { id: todoId } }),
    );
  };

  const handleUpdateExams = async (exams: Exam[]) => {
    const sortedExams = [...exams].sort(
      (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    );

    await applyMutation(
      (previous) => ({
        ...previous,
        exams: sortedExams,
      }),
      () => repository.updateExams(sortedExams),
      createOfflineAction({
        type: "updateExams",
        payload: { exams: sortedExams },
      }),
    );

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        EXAM_BACKUP_KEY,
        JSON.stringify({
          savedAt: new Date().toISOString(),
          exams: sortedExams,
        }),
      );
    }

    setCountdownBaselines((currentBaselines) =>
      mergeCountdownBaselines(sortedExams, currentBaselines, Date.now()),
    );

    setStatusMessage("Exam schedule updated.");
  };

  const handleSaveGoals = async () => {
    if (!goalsDraft || !data) {
      return;
    }

    setGoalsSaving(true);

    try {
      await applyMutation(
        (previous) => ({
          ...previous,
          goals: goalsDraft,
        }),
        () => repository.updateGoals(goalsDraft),
      );
      setStatusMessage("Performance goals updated.");
    } finally {
      setGoalsSaving(false);
    }
  };

  const handleImportCsv = async () => {
    if (!csvInput.trim()) {
      setStatusMessage("Paste CSV data first.");
      return;
    }

    setCsvImporting(true);
    try {
      const result = await repository.importHealthCsv(csvInput);
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || data?.settings.timezone || "Europe/Berlin";
      const bootstrap = await repository.getBootstrap();
      setData(toAppData(bootstrap, timezone));
      setBatchImportSummary(null);
      setStatusMessage(
        `Imported ${result.importedHealthDays} health days and ${result.importedWorkouts} workouts.`,
      );
      setCsvInput("");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "CSV import failed.");
    } finally {
      setCsvImporting(false);
    }
  };

  const handleImportBatchFiles = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const inputFiles = Array.from(event.target.files || []);
    if (inputFiles.length === 0) {
      return;
    }

    setCsvImporting(true);
    setBatchImportSummary(null);

    try {
      const files = await Promise.all(
        inputFiles.map(async (file) => ({
          filename: file.name,
          csv: await file.text(),
        })),
      );

      const result = await repository.importHealthBatch(files);
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || data?.settings.timezone || "Europe/Berlin";
      const bootstrap = await repository.getBootstrap();
      setData(toAppData(bootstrap, timezone));
      setBatchImportSummary(result);
      setStatusMessage(
        `Batch import finished: ${result.filesProcessed} files parsed, ${result.importedWorkouts} workouts merged.`,
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Batch CSV import failed.");
    } finally {
      setCsvImporting(false);
      event.target.value = "";
    }
  };

  const handleAddWorkout = async () => {
    if (!data) {
      return;
    }

    const durationMin = Number(workoutDurationDraft);
    if (!Number.isFinite(durationMin) || durationMin < 10) {
      setStatusMessage("Workout duration must be at least 10 minutes.");
      return;
    }

    const activeKcal = Number(workoutKcalDraft);
    const endedAt = new Date().toISOString();
    const startedAt = new Date(Date.now() - durationMin * 60_000).toISOString();
    const workout: WorkoutEntry = {
      id: crypto.randomUUID(),
      type: workoutTypeDraft,
      startedAt,
      endedAt,
      durationMin,
      activeKcal: Number.isFinite(activeKcal) && activeKcal > 0 ? activeKcal : undefined,
      source: "manual",
      createdAt: endedAt,
    };

    await applyMutation(
      (previous) => ({
        ...previous,
        workouts: [...previous.workouts, workout].sort(
          (left, right) =>
            new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
        ),
      }),
      () => repository.createWorkout(workout),
    );

    setWorkoutDurationDraft("35");
    setWorkoutKcalDraft("");
    setStatusMessage(`${workout.type} workout logged (${durationMin} min).`);
  };

  const handleSelectWorkout = useCallback(
    async (workoutId: string) => {
      if (!data) {
        return;
      }

      setSelectedWorkoutId(workoutId);
      setExpandedCard("health");

      const cachedDetail =
        data.workoutDetails.find((detail) => detail.workoutId === workoutId) || null;
      setSelectedWorkoutDetail(cachedDetail);
      setLoadingWorkoutDetail(true);

      try {
        const detail = await repository.getWorkoutDetail(workoutId);
        setSelectedWorkoutDetail(detail || cachedDetail);
      } catch {
        setSelectedWorkoutDetail(cachedDetail);
      } finally {
        setLoadingWorkoutDetail(false);
      }
    },
    [data, repository],
  );

  useEffect(() => {
    if (expandedCard !== "health" || selectedWorkoutId || sortedWorkouts.length === 0) {
      return;
    }

    void handleSelectWorkout(sortedWorkouts[0].id);
  }, [expandedCard, handleSelectWorkout, selectedWorkoutId, sortedWorkouts]);

  if (authStatus === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 text-[var(--text)]">
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-8 py-6 text-sm text-[var(--muted)]">
          Initializing Yan Study OS...
        </div>
      </div>
    );
  }

  if (authStatus === "signedOut") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 text-[var(--text)]">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Yan Study OS</p>
          <h1 className="mt-2 text-xl font-semibold">Secure Entry</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Enter your personal passcode to open the dashboard.
          </p>
          <label className="mt-5 block text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            Passcode
          </label>
          <input
            type="password"
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            className="mt-2 w-full rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] px-3 py-2 text-sm outline-none transition focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/40"
            autoComplete="current-password"
          />
          {authError ? (
            <p className="mt-3 text-sm text-[#ff7f7f]" role="alert">
              {authError}
            </p>
          ) : null}
          <button
            type="submit"
            className="mt-5 w-full rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] px-3 py-2 text-sm font-semibold transition hover:border-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
          >
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 text-[var(--text)]">
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-8 py-6 text-sm text-[var(--muted)]">
          Loading dashboard data...
        </div>
      </div>
    );
  }

  const maxSubjectSeconds = Math.max(...Object.values(subjectTotals), 1);

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="h-full w-full p-3 md:p-4">
        <div
          className="grid h-full min-h-0 gap-4"
          style={{
            gridTemplateColumns: "320px minmax(0, 1fr) 320px",
          }}
        >
          <TodoRail
            activeTodos={activeTodos}
            archivedTodos={archivedTodos}
            onAddTodo={handleAddTodo}
            onArchive={handleArchiveTodo}
            onRestore={handleRestoreTodo}
          />

          <main
            className="grid h-full min-h-0 gap-4 overflow-hidden"
            style={{
              gridTemplateRows: isCountdownExpanded
                ? "1fr 0fr 0fr"
                : "220px minmax(0, 1fr) 280px",
              transition: "grid-template-rows 340ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <section
              className="h-full min-h-0 overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4"
              onClick={() => {
                if (!isCountdownExpanded) {
                  setIsCountdownExpanded(true);
                }
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Closest Exams</p>
                  <h2 className="text-sm font-semibold">Countdown Monitor</h2>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsCountdownExpanded((current) => !current);
                  }}
                  className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                >
                  {isCountdownExpanded ? "Done" : "Edit"}
                </button>
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                <span className="rounded border border-[var(--panel-border)] px-2 py-1">
                  Mode: {repository.mode.toUpperCase()}
                </span>
                <span className="rounded border border-[var(--panel-border)] px-2 py-1">
                  Pending Sync: {offlineQueue.length}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded border border-[var(--panel-border)] px-2 py-1 transition hover:border-[var(--text)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                >
                  Logout
                </button>
              </div>

              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
              >
                {nearestExams.map((exam) => {
                  const countdown = getCountdown(
                    exam,
                    new Date(timePulse),
                    getExamBaselineSeconds(exam),
                  );
                  return (
                    <article
                      key={exam.id}
                      className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3"
                    >
                      <p className="text-xs text-[var(--muted)]">
                        {SUBJECT_BY_ID[exam.subjectId].name} • {exam.paper}
                      </p>
                      <p className="mt-1 text-sm font-semibold">{formatDateTime(exam.startsAt)}</p>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {countdown.done
                          ? "Started"
                          : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m left`}
                      </p>
                      <div className="mt-2 h-1.5 rounded bg-black/35">
                        <div
                          className="h-full rounded transition-all duration-300"
                          style={{
                            width: `${Math.max(4, countdown.progressRatio * 100)}%`,
                            backgroundColor: SUBJECT_BY_ID[exam.subjectId].color,
                          }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>

              <div
                className={`overflow-hidden transition-[max-height,margin-top,opacity] duration-300 ease-out ${
                  isCountdownExpanded ? "mt-3 max-h-[1400px] opacity-100" : "max-h-0 opacity-0"
                }`}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="max-h-[calc(100vh-420px)] space-y-2 overflow-auto pr-1">
                  {upcomingExamWeekGroups.map((group) => (
                    <div key={`week-${group.week}`} className="space-y-2">
                      <p className="text-xs tracking-[0.08em] text-[var(--muted)]">
                        -----------------Week {group.week}-----------------
                      </p>
                      {group.exams.map((exam) => {
                        const countdown = getCountdown(
                          exam,
                          new Date(timePulse),
                          getExamBaselineSeconds(exam),
                        );

                        return (
                          <article
                            key={`expanded-${exam.id}`}
                            className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs text-[var(--muted)]">
                                {SUBJECT_BY_ID[exam.subjectId].name} • {exam.paper}
                              </p>
                              <p className="text-xs text-[var(--muted)]">
                                {countdown.done
                                  ? "Started"
                                  : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`}
                              </p>
                            </div>
                            <div className="mt-2 h-1.5 rounded bg-black/35">
                              <div
                                className="h-full rounded transition-all duration-300"
                                style={{
                                  width: `${Math.max(2, countdown.progressRatio * 100)}%`,
                                  backgroundColor: SUBJECT_BY_ID[exam.subjectId].color,
                                }}
                              />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ))}

                  <div className="mt-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                      Edit Exam Schedule
                    </p>
                    <ExamEditor exams={data.exams} onSave={handleUpdateExams} />
                  </div>
                </div>
              </div>
            </section>

            <section
              ref={focusFeedSectionRef}
              className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 transition-[opacity,filter] duration-300"
              style={{
                opacity: isCountdownExpanded ? 0 : 1,
                filter: isCountdownExpanded ? "blur(2px)" : "blur(0px)",
                pointerEvents: isCountdownExpanded ? "none" : "auto",
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Focus Feed</p>
                  <h2 className="text-2xl font-semibold">{greeting}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedCard("calendar")}
                  className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                >
                  Expand
                </button>
              </div>

              <div ref={focusFeedScrollRef} className="min-h-0 flex-1 overflow-auto pr-1">
                {todayReadiness && todayRecommendation ? (
                  <div className="mb-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                          Condition
                        </p>
                        <p className="text-sm font-semibold">
                          Readiness {Math.round(todayReadiness.score)} / 100
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          Zone: {todayReadiness.zone.toUpperCase()} • Confidence{" "}
                          {Math.round(todayReadiness.confidence * 100)}%
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                        <span className="rounded border border-[var(--panel-border)] px-2 py-1">
                          Study target: {todayRecommendation.studyTargetHours.toFixed(1)}h
                        </span>
                        <span className="rounded border border-[var(--panel-border)] px-2 py-1">
                          Bedtime: {todayRecommendation.bedtimeLabel}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <p className="text-xs text-[var(--muted)]">
                        {todayRecommendation.workoutSuggestion}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        7-day trend: {performanceInsights?.trendDelta7d && performanceInsights.trendDelta7d > 0 ? "+" : ""}
                        {performanceInsights?.trendDelta7d || 0}
                      </p>
                    </div>
                    {performanceInsights?.usingSampleData ? (
                      <p className="mt-2 text-xs text-[#8fb9ff]">
                        Running in sample mode until real health CSV data is imported.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid grid-cols-[repeat(12,minmax(0,1fr))] gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))] md:grid-cols-[repeat(20,minmax(0,1fr))] xl:grid-cols-[repeat(24,minmax(0,1fr))]">
                  {calendarDays.map((dateKey) => {
                    const aggregate = dayAggregates[dateKey];
                    const dayModel = dayHoverByDate[dateKey];
                    const workouts = dayModel.workouts;
                    const readiness = readinessByDate[dateKey];
                    const readinessColor =
                      readiness?.zone === "green"
                        ? "#4ade80"
                        : readiness?.zone === "yellow"
                          ? "#facc15"
                          : readiness?.zone === "orange"
                            ? "#fb923c"
                            : readiness?.zone === "red"
                              ? "#f87171"
                              : null;
                    const dominantColor = aggregate?.dominantSubjectId
                      ? SUBJECT_BY_ID[aggregate.dominantSubjectId].color
                      : "rgba(255,255,255,0.04)";
                    const dayOfMonth = dateKey.slice(8);
                    const isPast = dayModel.state === "past";
                    const squareTitleParts = [dateKey];

                    if (dayModel.state === "future" && !dayModel.hasAnyData) {
                      squareTitleParts.push("No data");
                    } else {
                      squareTitleParts.push(
                        dayModel.studySeconds > 0
                          ? `Study ${formatDuration(dayModel.studySeconds)}`
                          : dayModel.state === "future"
                            ? "No study data"
                            : "No study",
                      );
                      squareTitleParts.push(
                        workouts.length > 0
                          ? `${workouts.length} workout${workouts.length === 1 ? "" : "s"}`
                          : dayModel.state === "future"
                            ? "No workout data"
                            : "No workout",
                      );
                      if (dayModel.tests.length > 0) {
                        squareTitleParts.push(
                          `${dayModel.tests.length} test${dayModel.tests.length === 1 ? "" : "s"}`,
                        );
                      }
                      if (dayModel.todos.length > 0) {
                        squareTitleParts.push(
                          `${dayModel.todos.length} todo${dayModel.todos.length === 1 ? "" : "s"}`,
                        );
                      }
                      if (typeof dayModel.sleepHours === "number") {
                        squareTitleParts.push(`Sleep ${dayModel.sleepHours.toFixed(2)}h`);
                      }
                      if (typeof dayModel.sleepScore === "number") {
                        squareTitleParts.push(`Sleep score ${dayModel.sleepScore.toFixed(1)}`);
                      }
                    }

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        title={squareTitleParts.join(" • ")}
                        className={`relative aspect-square rounded-[4px] border transition hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-[var(--focus)] ${
                          isPast ? "border-black/60" : "border-white/5"
                        }`}
                        style={{ backgroundColor: dominantColor }}
                        aria-label={dateKey}
                        onMouseEnter={(event) =>
                          setHoveredFocusDay({
                            dateKey,
                            anchorElement: event.currentTarget,
                          })
                        }
                        onFocus={(event) =>
                          setHoveredFocusDay({
                            dateKey,
                            anchorElement: event.currentTarget,
                          })
                        }
                        onMouseLeave={(event) => {
                          if (hoveredFocusDay?.anchorElement === event.currentTarget) {
                            setHoveredFocusDay(null);
                          }
                        }}
                        onBlur={(event) => {
                          if (hoveredFocusDay?.anchorElement === event.currentTarget) {
                            setHoveredFocusDay(null);
                          }
                        }}
                      >
                        {readinessColor ? (
                          <span
                            className="pointer-events-none absolute left-0.5 top-0.5 h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: readinessColor }}
                          />
                        ) : null}

                        {workouts.length > 0 ? (
                          <span className="pointer-events-none absolute bottom-0.5 right-0.5 rounded bg-[#5BC0EB] px-1 text-[8px] text-black">
                            {workouts.length}
                          </span>
                        ) : null}
                        <span className="pointer-events-none absolute bottom-0.5 left-0.5 text-[8px] text-white/65">
                          {dayOfMonth}
                        </span>

                        {dayModel.tests.length > 0 ? (
                          <span
                            className="pointer-events-none absolute inset-[-2px] rounded-[6px] border"
                            style={{
                              borderColor: data.settings.examHighlightColor,
                              boxShadow: `0 0 10px ${data.settings.examHighlightColor}`,
                            }}
                          />
                        ) : null}

                        {isPast ? (
                          <span className="pointer-events-none absolute inset-0 rounded-[4px] border border-black/55" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
              {hoveredFocusModel && focusTooltipPosition ? (
                <div
                  ref={focusFeedTooltipRef}
                  className="pointer-events-none absolute z-30 w-max rounded border border-[var(--panel-border)] bg-[var(--panel)] p-2 text-left shadow-2xl"
                  style={{
                    left: focusTooltipPosition.left,
                    top: focusTooltipPosition.top,
                    maxWidth: focusTooltipMaxWidth,
                  }}
                >
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                    {hoveredFocusModel.dateKey}
                  </p>
                  {hoveredFocusModel.state === "future" && !hoveredFocusModel.hasAnyData ? (
                    <p className="mt-1 text-xs text-[var(--muted)]">No data</p>
                  ) : (
                    <>
                      {hoveredFocusModel.state !== "future" ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Study:{" "}
                          {hoveredFocusModel.studySeconds > 0
                            ? formatDuration(hoveredFocusModel.studySeconds)
                            : "0m"}
                        </p>
                      ) : hoveredFocusModel.studySeconds > 0 ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Study: {formatDuration(hoveredFocusModel.studySeconds)}
                        </p>
                      ) : null}

                      {hoveredFocusModel.state !== "future" ? (
                        <p className="text-xs text-[var(--muted)]">
                          Workouts: {hoveredFocusModel.workouts.length}
                        </p>
                      ) : hoveredFocusModel.workouts.length > 0 ? (
                        <p className="text-xs text-[var(--muted)]">
                          Workouts: {hoveredFocusModel.workouts.length}
                        </p>
                      ) : null}

                      {typeof hoveredFocusModel.sleepHours === "number" ? (
                        <p className="text-xs text-[var(--muted)]">
                          Sleep: {hoveredFocusModel.sleepHours.toFixed(2)}h
                        </p>
                      ) : null}
                      {typeof hoveredFocusModel.sleepScore === "number" ? (
                        <p className="text-xs text-[var(--muted)]">
                          Sleep score: {hoveredFocusModel.sleepScore.toFixed(1)}
                        </p>
                      ) : null}
                      {typeof hoveredFocusModel.sleepHours7d === "number" ? (
                        <p className="text-xs text-[var(--muted)]">
                          Sleep 7d avg: {hoveredFocusModel.sleepHours7d.toFixed(2)}h
                        </p>
                      ) : null}
                      {typeof hoveredFocusModel.sleepScore7d === "number" &&
                      hoveredFocusModel.sleepScore7d > 0 ? (
                        <p className="text-xs text-[var(--muted)]">
                          Score 7d avg: {hoveredFocusModel.sleepScore7d.toFixed(1)}
                        </p>
                      ) : null}

                      {hoveredFocusModel.tests.length > 0 ? (
                        <div className="mt-1">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                            Tests
                          </p>
                          {hoveredFocusModel.tests.map((exam) => (
                            <p key={`focus-hover-test-${exam.id}`} className="text-xs text-[var(--muted)]">
                              {SUBJECT_BY_ID[exam.subjectId].shortName} {exam.paper} •{" "}
                              {formatTimeLabel(exam.startsAt)}
                            </p>
                          ))}
                        </div>
                      ) : null}

                      {hoveredFocusModel.todos.length > 0 ? (
                        <div className="mt-1">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                            Todos
                          </p>
                          {hoveredFocusModel.todos.map((todo) => (
                            <p key={`focus-hover-todo-${todo.id}`} className="text-xs text-[var(--muted)]">
                              {todo.ultraPriority ? "[UP] " : ""}
                              {todo.title} • {formatTimeLabel(todo.deadline)}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}
              <p className="mt-3 text-xs text-[var(--muted)]">
                120-day calendar. Fill color = most studied subject. Top-left dot = readiness zone.
                Blue badge = workout count.
              </p>
            </section>

            <div
              className="grid h-full min-h-0 gap-4 transition-[opacity,filter] duration-300"
              style={{
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                opacity: isCountdownExpanded ? 0 : 1,
                filter: isCountdownExpanded ? "blur(2px)" : "blur(0px)",
                pointerEvents: isCountdownExpanded ? "none" : "auto",
              }}
            >
              <section className="h-full min-h-0 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Study Timer</p>
                    <h2 className="text-sm font-semibold">Session Recorder</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedCard("timer")}
                    className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                  >
                    Expand
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr,auto] md:items-center">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                      Subject
                    </label>
                    <select
                      value={activeTimer ? activeTimer.subjectId : timerSubjectId}
                      onChange={(event) =>
                        setTimerSubjectId(event.target.value as SubjectId)
                      }
                      disabled={Boolean(activeTimer)}
                      className="mt-1 w-full rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] px-3 py-2 text-sm outline-none transition focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/40 disabled:opacity-60"
                    >
                      {SUBJECTS.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] px-4 py-3 text-center text-3xl font-semibold tracking-widest"
                    style={{
                      color: activeTimer
                        ? SUBJECT_BY_ID[activeTimer.subjectId].color
                        : "var(--text)",
                    }}
                  >
                    {formatClock(elapsedSeconds)}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {!activeTimer ? (
                    <button
                      type="button"
                      onClick={handleStartTimer}
                      className="rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] px-3 py-2 text-sm font-semibold transition hover:border-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                    >
                      Start
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handlePauseResumeTimer}
                        className="rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] px-3 py-2 text-sm font-semibold transition hover:border-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                      >
                        {activeTimer.isRunning ? "Pause" : "Resume"}
                      </button>
                      <button
                        type="button"
                        onClick={handleEndTimer}
                        className="rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] px-3 py-2 text-sm font-semibold transition hover:border-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                      >
                        End
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-3 rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                    Quick Add Missed Session
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={quickAddMinutes}
                      onChange={(event) => setQuickAddMinutes(event.target.value)}
                      placeholder="Minutes"
                      className="w-24 rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => void handleQuickAddSession()}
                      className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs transition hover:border-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                    >
                      Quick Add
                    </button>
                  </div>
                </div>

              </section>

              <section className="h-full min-h-0 overflow-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Performance</p>
                    <h2 className="text-sm font-semibold">Condition + Totals</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedCard("totals")}
                    className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                  >
                    Expand
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {SUBJECTS.map((subject) => {
                    const value = subjectTotals[subject.id];
                    const percent = Math.max(6, (value / maxSubjectSeconds) * 100);

                    return (
                      <article
                        key={subject.id}
                        className="rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2"
                      >
                        <p className="truncate text-xs text-[var(--muted)]">{subject.shortName}</p>
                        <p className="mt-1 text-sm font-semibold">{formatDuration(value)}</p>
                        <div className="mt-2 h-1.5 rounded bg-black/35">
                          <div
                            className="h-full rounded transition-all duration-300"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: subject.color,
                            }}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>

                {todayReadiness ? (
                  <div className="mt-3 space-y-2 rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                      Readiness Components
                    </p>
                    <MetricBar label="Sleep" value={todayReadiness.sleepComponent} />
                    <MetricBar label="Autonomic" value={todayReadiness.autonomicComponent} />
                    <MetricBar label="Load" value={todayReadiness.loadComponent} />
                    <MetricBar label="Cognitive" value={todayReadiness.cognitiveComponent} />
                  </div>
                ) : null}

                <div className="mt-3 space-y-2 rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2.5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                    Workout Tracker
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    This week: {performanceInsights?.weeklyWorkoutCount || 0}/
                    {performanceInsights?.weeklyWorkoutTarget || 0} • Last workout{" "}
                    {performanceInsights?.daysSinceWorkout ?? 0}d ago
                  </p>
                  <div className="grid grid-cols-[1fr_86px_86px_auto] gap-2">
                    <select
                      value={workoutTypeDraft}
                      onChange={(event) => setWorkoutTypeDraft(event.target.value as WorkoutType)}
                      className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1 text-xs"
                    >
                      <option value="cardio">Cardio</option>
                      <option value="strength">Strength</option>
                      <option value="mobility">Mobility</option>
                      <option value="recovery">Recovery</option>
                    </select>
                    <input
                      value={workoutDurationDraft}
                      onChange={(event) => setWorkoutDurationDraft(event.target.value)}
                      placeholder="min"
                      className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1 text-xs"
                    />
                    <input
                      value={workoutKcalDraft}
                      onChange={(event) => setWorkoutKcalDraft(event.target.value)}
                      placeholder="kcal"
                      className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddWorkout}
                      className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs transition hover:border-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                    >
                      Log
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2 rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2.5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                    Goals
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={goalsDraft?.sleepHoursTarget ?? ""}
                      onChange={(event) =>
                        setGoalsDraft((current) =>
                          current
                            ? { ...current, sleepHoursTarget: Number(event.target.value) || 0 }
                            : current,
                        )
                      }
                      placeholder="Sleep h"
                      className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1 text-xs"
                    />
                    <input
                      value={goalsDraft?.baselineStudyHours ?? ""}
                      onChange={(event) =>
                        setGoalsDraft((current) =>
                          current
                            ? { ...current, baselineStudyHours: Number(event.target.value) || 0 }
                            : current,
                        )
                      }
                      placeholder="Study h"
                      className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1 text-xs"
                    />
                    <input
                      value={goalsDraft?.weeklyWorkoutTarget ?? ""}
                      onChange={(event) =>
                        setGoalsDraft((current) =>
                          current
                            ? { ...current, weeklyWorkoutTarget: Number(event.target.value) || 0 }
                            : current,
                        )
                      }
                      placeholder="Weekly WO"
                      className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={goalsDraft?.weekdayWakeTime ?? ""}
                      onChange={(event) =>
                        setGoalsDraft((current) =>
                          current ? { ...current, weekdayWakeTime: event.target.value } : current,
                        )
                      }
                      placeholder="Weekday wake"
                      className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1 text-xs"
                    />
                    <input
                      value={goalsDraft?.weekendWakeTime ?? ""}
                      onChange={(event) =>
                        setGoalsDraft((current) =>
                          current ? { ...current, weekendWakeTime: event.target.value } : current,
                        )
                      }
                      placeholder="Weekend wake"
                      className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveGoals}
                    disabled={!goalsDraft || goalsSaving}
                    className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs transition hover:border-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] disabled:opacity-60"
                  >
                    {goalsSaving ? "Saving..." : "Save Goals"}
                  </button>
                </div>

                <div className="mt-3 space-y-2 rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2.5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                    Health CSV Import
                  </p>
                  <label className="block rounded border border-dashed border-[var(--panel-border)] px-2 py-2 text-xs text-[var(--muted)]">
                    Batch import folder files (.csv)
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      multiple
                      onChange={handleImportBatchFiles}
                      className="mt-2 block w-full text-xs"
                    />
                  </label>
                  <textarea
                    value={csvInput}
                    onChange={(event) => setCsvInput(event.target.value)}
                    placeholder="Paste comma-separated CSV rows here (for future Apple export)."
                    className="h-20 w-full rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleImportCsv}
                    disabled={csvImporting}
                    className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs transition hover:border-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] disabled:opacity-60"
                  >
                    {csvImporting ? "Importing..." : "Import CSV"}
                  </button>
                  {batchImportSummary ? (
                    <div className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1.5 text-[11px] text-[var(--muted)]">
                      Parsed {batchImportSummary.filesProcessed} files, skipped{" "}
                      {batchImportSummary.filesSkipped}, imported{" "}
                      {batchImportSummary.importedHealthDays} health days, merged{" "}
                      {batchImportSummary.importedWorkouts} workouts, linked{" "}
                      {batchImportSummary.linkedStreams || 0} streams.
                    </div>
                  ) : null}
                </div>
              </section>
            </div>

          </main>

          <HealthRail
            sleepTrend14={sleepTrend14}
            sleepScoreSeries7={sleepScoreSeries7}
            sleepScoreAverage7={sleepScoreAverage7}
            sortedWorkouts={sortedWorkouts}
            todayReadiness={todayReadiness}
            sevenDaySleepAverage={sleepAverage7}
            nowMs={timePulse}
            onExpand={() => setExpandedCard("health")}
            onSelectWorkout={(workoutId) => void handleSelectWorkout(workoutId)}
            usingSampleData={Boolean(performanceInsights?.usingSampleData)}
          />
        </div>
      </div>

      {statusMessage ? (
        <div className="pointer-events-none fixed bottom-3 left-3 z-40 max-w-[460px] rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-xs text-[var(--muted)]">
          {statusMessage}
        </div>
      ) : null}

      <FocusModal
        open={expandedCard !== null}
        onClose={() => setExpandedCard(null)}
        title={
          expandedCard === "calendar"
            ? "120-Day Study Calendar"
            : expandedCard === "timer"
            ? "Study Timer"
            : expandedCard === "totals"
            ? "Cumulative Totals"
            : "Health Explorer"
        }
      >
        {expandedCard === "calendar" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-[repeat(10,minmax(0,1fr))] gap-1 md:grid-cols-[repeat(15,minmax(0,1fr))] xl:grid-cols-[repeat(20,minmax(0,1fr))]">
              {calendarDays.map((dateKey) => {
                const aggregate = dayAggregates[dateKey];
                const dayModel = dayHoverByDate[dateKey];
                const examList = dayModel.tests;
                const workouts = dayModel.workouts;
                const readiness = readinessByDate[dateKey];
                const recommendation = recommendationsByDate[dateKey];
                const dominantColor = aggregate?.dominantSubjectId
                  ? SUBJECT_BY_ID[aggregate.dominantSubjectId].color
                  : "rgba(255,255,255,0.04)";
                const readinessColor =
                  readiness?.zone === "green"
                    ? "#4ade80"
                    : readiness?.zone === "yellow"
                    ? "#facc15"
                    : readiness?.zone === "orange"
                    ? "#fb923c"
                    : readiness?.zone === "red"
                    ? "#f87171"
                    : null;
                const isPast = dayModel.state === "past";
                const titleParts = [dateKey];

                if (dayModel.state === "future" && !dayModel.hasAnyData) {
                  titleParts.push("No data");
                } else {
                  titleParts.push(
                    dayModel.studySeconds > 0
                      ? `Study ${formatDuration(dayModel.studySeconds)}`
                      : dayModel.state === "future"
                        ? "No study data"
                        : "No study",
                  );
                  titleParts.push(
                    workouts.length > 0
                      ? `${workouts.length} workout${workouts.length === 1 ? "" : "s"}`
                      : dayModel.state === "future"
                        ? "No workout data"
                        : "No workout",
                  );
                  if (typeof dayModel.sleepHours === "number") {
                    titleParts.push(`Sleep ${dayModel.sleepHours.toFixed(2)}h`);
                  }
                  if (typeof dayModel.sleepScore === "number") {
                    titleParts.push(`Sleep score ${dayModel.sleepScore.toFixed(1)}`);
                  }
                  if (dayModel.tests.length > 0) {
                    titleParts.push(
                      `${dayModel.tests.length} test${dayModel.tests.length === 1 ? "" : "s"}`,
                    );
                  }
                  if (dayModel.todos.length > 0) {
                    titleParts.push(
                      `${dayModel.todos.length} todo${dayModel.todos.length === 1 ? "" : "s"}`,
                    );
                  }
                }

                return (
                  <div key={dateKey} className="space-y-1">
                    <div
                      className={`relative aspect-square rounded border ${
                        isPast ? "border-black/60" : "border-white/10"
                      }`}
                      style={{ backgroundColor: dominantColor }}
                      title={titleParts.join(" • ")}
                    >
                      {readinessColor ? (
                        <span
                          className="absolute left-0.5 top-0.5 h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: readinessColor }}
                        />
                      ) : null}
                      {workouts.length > 0 ? (
                        <span className="absolute bottom-0.5 right-0.5 rounded bg-[#5BC0EB] px-1 text-[8px] text-black">
                          {workouts.length}
                        </span>
                      ) : null}
                      {examList.length > 0 ? (
                        <span
                          className="pointer-events-none absolute inset-[-2px] rounded border"
                          style={{
                            borderColor: data.settings.examHighlightColor,
                            boxShadow: `0 0 10px ${data.settings.examHighlightColor}`,
                          }}
                        />
                      ) : null}
                      {isPast ? (
                        <span className="pointer-events-none absolute inset-0 rounded border border-black/55" />
                      ) : null}
                    </div>
                    <p className="truncate text-[10px] text-[var(--muted)]">
                      {dateKey.slice(5)} {readiness ? `• ${Math.round(readiness.score)}` : ""}
                      {recommendation ? ` • ${recommendation.studyTargetHours.toFixed(1)}h` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {SUBJECTS.map((subject) => (
                <div key={subject.id} className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span
                    className="inline-block h-3 w-3 rounded"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span>{subject.name}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <span
                  className="inline-block h-3 w-3 rounded border"
                  style={{
                    borderColor: data.settings.examHighlightColor,
                    boxShadow: `0 0 8px ${data.settings.examHighlightColor}`,
                  }}
                />
                <span>Exam Day Highlight</span>
              </div>
            </div>
          </div>
        ) : null}

        {expandedCard === "timer" ? (
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <p>
              Timer auto-resumes after refresh using local device state. Active timer color
              matches selected subject.
            </p>
          </div>
        ) : null}

        {expandedCard === "totals" ? (
          <div className="space-y-2">
            {SUBJECTS.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between rounded border border-[var(--panel-border)] bg-[var(--panel-soft)] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="text-sm">{subject.name}</span>
                </div>
                <span className="text-sm font-semibold">{formatDuration(subjectTotals[subject.id])}</span>
              </div>
            ))}
          </div>
        ) : null}

        {expandedCard === "health" ? (
          <HealthExplorer
            todayReadiness={todayReadiness}
            todayRecommendation={todayRecommendation}
            sleepTrend30={sleepTrend30}
            readinessByDate={readinessByDate}
            workouts={sortedWorkouts}
            selectedWorkoutId={selectedWorkoutId}
            selectedWorkoutDetail={selectedWorkoutDetail}
            loadingWorkoutDetail={loadingWorkoutDetail}
            onSelectWorkout={(workoutId) => void handleSelectWorkout(workoutId)}
            rawFiles={data.healthRawFiles}
          />
        ) : null}
      </FocusModal>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.1em] text-[var(--muted)]">
        <span>{label}</span>
        <span>{Math.round(safe)}</span>
      </div>
      <div className="h-1.5 rounded bg-black/35">
        <div
          className="h-full rounded transition-all duration-300"
          style={{
            width: `${safe}%`,
            backgroundColor: safe >= 75 ? "#4ade80" : safe >= 55 ? "#facc15" : "#fb923c",
          }}
        />
      </div>
    </div>
  );
}

function TodoRail({
  activeTodos,
  archivedTodos,
  onAddTodo,
  onArchive,
  onRestore,
}: {
  activeTodos: TodoItem[];
  archivedTodos: TodoItem[];
  onAddTodo: (todo: TodoItem) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [title, setTitle] = useState("");
  const [deadlineMonthDay, setDeadlineMonthDay] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("18:00");
  const [todoError, setTodoError] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<SubjectId>(SUBJECT_IDS[0]);
  const [ultraPriority, setUltraPriority] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !deadlineMonthDay.trim()) {
      setTodoError("Please enter task name and deadline (MM-DD).");
      return;
    }

    const parsedDeadline = monthDayToIso(deadlineMonthDay, deadlineTime);
    if (!parsedDeadline) {
      setTodoError("Deadline format should be MM-DD. Example: 04-27");
      return;
    }
    setTodoError(null);

    const todo: TodoItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      subjectId,
      deadline: parsedDeadline,
      ultraPriority,
      completed: false,
      archived: false,
      createdAt: new Date().toISOString(),
    };

    await onAddTodo(todo);

    setTitle("");
    setDeadlineMonthDay("");
    setDeadlineTime("18:00");
    setUltraPriority(false);
    setAdding(false);
  };

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Todo Rail</p>
          <h2 className="text-sm font-semibold">Chronological Tasks</h2>
        </div>
        <button
          type="button"
          onClick={() => setAdding((current) => !current)}
          className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
          aria-expanded={adding}
        >
          {adding ? "Cancel" : "+ Add"}
        </button>
      </div>

      {adding ? (
        <form onSubmit={handleSubmit} className="mb-4 space-y-2 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task"
            className="w-full rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1.5 text-sm outline-none transition focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/40"
          />
          <input
            type="text"
            value={deadlineMonthDay}
            onChange={(event) => setDeadlineMonthDay(event.target.value)}
            placeholder="MM-DD"
            className="w-full rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1.5 text-sm outline-none transition focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/40"
          />
          <input
            type="time"
            value={deadlineTime}
            onChange={(event) => setDeadlineTime(event.target.value)}
            className="w-full rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1.5 text-sm outline-none transition focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/40"
          />
          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value as SubjectId)}
            className="w-full rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1.5 text-sm outline-none transition focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/40"
          >
            {SUBJECTS.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <input
              type="checkbox"
              checked={ultraPriority}
              onChange={(event) => setUltraPriority(event.target.checked)}
            />
            Ultra priority
          </label>
          {todoError ? (
            <p className="text-xs text-[#ff9896]">{todoError}</p>
          ) : (
            <p className="text-xs text-[var(--muted)]">
              Deadline uses month-day only. Year is inferred automatically.
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1.5 text-sm font-semibold transition hover:border-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
          >
            Save Todo
          </button>
        </form>
      ) : null}

      <div className="mb-2 flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setShowArchive(false)}
          className={`rounded border px-2 py-1 transition focus:outline-none focus:ring-2 focus:ring-[var(--focus)] ${
            !showArchive
              ? "border-[var(--text)] text-[var(--text)]"
              : "border-[var(--panel-border)] text-[var(--muted)]"
          }`}
        >
          Active ({activeTodos.length})
        </button>
        <button
          type="button"
          onClick={() => setShowArchive(true)}
          className={`rounded border px-2 py-1 transition focus:outline-none focus:ring-2 focus:ring-[var(--focus)] ${
            showArchive
              ? "border-[var(--text)] text-[var(--text)]"
              : "border-[var(--panel-border)] text-[var(--muted)]"
          }`}
        >
          Archive ({archivedTodos.length})
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
        {(showArchive ? archivedTodos : activeTodos).map((todo) => (
          <article
            key={todo.id}
            className="rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] px-2 py-2"
            style={{ borderLeftWidth: "4px", borderLeftColor: SUBJECT_BY_ID[todo.subjectId].color }}
          >
            <p className="text-sm font-medium leading-tight">{todo.title}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{SUBJECT_BY_ID[todo.subjectId].name}</p>
            <p className="text-xs text-[var(--muted)]">Due {formatDateTime(todo.deadline)}</p>
            {todo.ultraPriority ? (
              <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#ff9896]">Ultra Priority</p>
            ) : null}
            <div className="mt-2">
              {showArchive ? (
                <button
                  type="button"
                  onClick={() => onRestore(todo.id)}
                  className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs transition hover:border-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                >
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onArchive(todo.id)}
                  className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs transition hover:border-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                >
                  Mark Done
                </button>
              )}
            </div>
          </article>
        ))}
        {(showArchive ? archivedTodos : activeTodos).length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No todos in this view.</p>
        ) : null}
      </div>
    </aside>
  );
}

function HealthRail({
  sleepTrend14,
  sleepScoreSeries7,
  sleepScoreAverage7,
  sortedWorkouts,
  todayReadiness,
  sevenDaySleepAverage,
  nowMs,
  onExpand,
  onSelectWorkout,
  usingSampleData,
}: {
  sleepTrend14: DailyHealthFact[];
  sleepScoreSeries7: Array<{ date: string; score: number }>;
  sleepScoreAverage7: number;
  sortedWorkouts: WorkoutEntry[];
  todayReadiness: DailyReadiness | null;
  sevenDaySleepAverage: number;
  nowMs: number;
  onExpand: () => void;
  onSelectWorkout: (workoutId: string) => void;
  usingSampleData: boolean;
}) {
  const latestSleep = sleepTrend14[sleepTrend14.length - 1];
  const workouts14 = sortedWorkouts.slice(0, 14);
  const workouts7d = sortedWorkouts.filter(
    (workout) => nowMs - new Date(workout.startedAt).getTime() <= 7 * 86_400_000,
  ).length;

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Health Rail</p>
          <h2 className="text-sm font-semibold">Sleep + Workout Explorer</h2>
        </div>
        <button
          type="button"
          onClick={onExpand}
          className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
        >
          Expand
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <MetricTile label="Sleep (last)" value={`${latestSleep?.sleepHours?.toFixed(2) || "0.00"}h`} />
        <MetricTile label="Sleep 7d avg" value={`${sevenDaySleepAverage.toFixed(2)}h`} />
        <MetricTile label="Sleep score" value={`${Math.round(todayReadiness?.sleepScore || 0)}`} />
        <MetricTile label="Workouts 7d" value={`${workouts7d}`} />
      </div>

      {todayReadiness ? (
        <p className="mb-3 rounded border border-[var(--panel-border)] bg-[var(--panel-soft)] px-2 py-1.5 text-xs text-[var(--muted)]">
          {todayReadiness.sleepDriverSentence}
        </p>
      ) : null}

      <div className="rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2">
        <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Sleep Hours (14d)
        </p>
        <CompactBars
          values={sleepTrend14.map((item) => item.sleepHours)}
          labels={sleepTrend14.map((item) => item.date)}
          max={Math.max(10, ...sleepTrend14.map((item) => item.sleepHours), 8)}
          color="#6bd4ff"
          valueFormatter={(value) => `${value.toFixed(2)}h`}
        />
      </div>

      <div className="mt-2 rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2">
        <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Sleep Score (7d)
        </p>
        <SleepScoreScatter points={sleepScoreSeries7} average={sleepScoreAverage7} />
      </div>

      {usingSampleData ? (
        <p className="mt-2 text-xs text-[#8fb9ff]">
          Sample mode active until real health exports are imported.
        </p>
      ) : null}

      <div className="mt-3 min-h-0 flex-1 overflow-auto pr-1">
        <p className="pb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
          Workout Explorer (last 14)
        </p>
        {workouts14.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No workouts yet.</p>
        ) : (
          workouts14.map((workout) => (
            <button
              type="button"
              key={`rail-workout-${workout.id}`}
              onClick={() => onSelectWorkout(workout.id)}
              className="mb-2 w-full rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2 text-left transition hover:border-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
            >
              <div className="mb-2 h-1 rounded bg-[#5BC0EB]" />
              <div className="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                <span className="font-semibold text-[var(--text)]">
                  {formatWorkoutLabel(workout)}
                </span>
                <span>{workout.durationMin.toFixed(0)}m</span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(workout.startedAt)}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {formatOptionalNumber(workout.distanceKm, "km", 2)} •{" "}
                {formatOptionalNumber(workout.hrAvg || workout.avgHeartRate, "bpm", 0)} •{" "}
                Confidence {Math.round((workout.mergeConfidence || 0) * 100)}%
              </p>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

function HealthExplorer({
  todayReadiness,
  todayRecommendation,
  sleepTrend30,
  readinessByDate,
  workouts,
  selectedWorkoutId,
  selectedWorkoutDetail,
  loadingWorkoutDetail,
  onSelectWorkout,
  rawFiles,
}: {
  todayReadiness: DailyReadiness | null;
  todayRecommendation: DailyRecommendation | null;
  sleepTrend30: DailyHealthFact[];
  readinessByDate: Record<string, DailyReadiness>;
  workouts: WorkoutEntry[];
  selectedWorkoutId: string | null;
  selectedWorkoutDetail: WorkoutDetail | null;
  loadingWorkoutDetail: boolean;
  onSelectWorkout: (workoutId: string) => void;
  rawFiles: AppData["healthRawFiles"];
}) {
  const sleepScores30 = sleepTrend30.map((item) => readinessByDate[item.date]?.sleepScore || 0);
  const workouts30 = workouts.slice(0, 30);
  const selectedWorkout =
    workouts.find((workout) => workout.id === selectedWorkoutId) || workouts[0] || null;

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[1.6fr_minmax(0,1fr)]">
      <div className="space-y-4 overflow-auto pr-1">
        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Readiness" value={`${Math.round(todayReadiness?.score || 0)} / 100`} />
          <MetricTile label="Sleep Score" value={`${Math.round(todayReadiness?.sleepScore || 0)}`} />
          <MetricTile label="Sleep Debt" value={`${(todayReadiness?.sleepDebtHours || 0).toFixed(2)}h`} />
          <MetricTile label="Tonight Bedtime" value={todayRecommendation?.bedtimeLabel || "--:--"} />
        </section>

        <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Sleep Raw (30d)
          </p>
          <div className="mt-2">
            <CompactBars
              values={sleepTrend30.map((item) => item.sleepHours)}
              labels={sleepTrend30.map((item) => item.date)}
              max={Math.max(10, ...sleepTrend30.map((item) => item.sleepHours), 8)}
              color="#6bd4ff"
              valueFormatter={(value) => `${value.toFixed(2)}h`}
            />
          </div>
          <div className="mt-3">
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
              Sleep Score (30d)
            </p>
            <CompactBars
              values={sleepScores30}
              labels={sleepTrend30.map((item) => item.date)}
              max={100}
              color="#8af58b"
              valueFormatter={(value) => value.toFixed(1)}
            />
          </div>
          <div className="mt-3 overflow-auto">
            <table className="w-full text-xs">
              <thead className="text-[var(--muted)]">
                <tr>
                  <th className="px-1 py-1 text-left">Date</th>
                  <th className="px-1 py-1 text-right">Sleep h</th>
                  <th className="px-1 py-1 text-right">Core</th>
                  <th className="px-1 py-1 text-right">Deep</th>
                  <th className="px-1 py-1 text-right">REM</th>
                  <th className="px-1 py-1 text-right">Awake</th>
                </tr>
              </thead>
              <tbody>
                {sleepTrend30.slice().reverse().slice(0, 14).map((item) => (
                  <tr key={`sleep-row-${item.date}`} className="border-t border-[var(--panel-border)]">
                    <td className="px-1 py-1">{item.date}</td>
                    <td className="px-1 py-1 text-right">{item.sleepHours.toFixed(2)}</td>
                    <td className="px-1 py-1 text-right">{(item.sleepCoreHours || 0).toFixed(2)}</td>
                    <td className="px-1 py-1 text-right">{(item.sleepDeepHours || 0).toFixed(2)}</td>
                    <td className="px-1 py-1 text-right">{(item.sleepRemHours || 0).toFixed(2)}</td>
                    <td className="px-1 py-1 text-right">{(item.sleepAwakeHours || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
              Workout Timeline
            </p>
            <p className="text-xs text-[var(--muted)]">
              Study target {todayRecommendation?.studyTargetHours?.toFixed(1) || "0.0"}h
            </p>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="text-[var(--muted)]">
                <tr>
                  <th className="px-1 py-1 text-left">Date</th>
                  <th className="px-1 py-1 text-left">Type</th>
                  <th className="px-1 py-1 text-right">Duration</th>
                  <th className="px-1 py-1 text-right">Distance</th>
                  <th className="px-1 py-1 text-right">Avg HR</th>
                  <th className="px-1 py-1 text-right">Energy</th>
                </tr>
              </thead>
              <tbody>
                {workouts30.map((workout) => (
                  <tr
                    key={`timeline-${workout.id}`}
                    className={`cursor-pointer border-t border-[var(--panel-border)] transition hover:bg-black/20 ${
                      selectedWorkout?.id === workout.id ? "bg-black/20" : ""
                    }`}
                    onClick={() => onSelectWorkout(workout.id)}
                  >
                    <td className="px-1 py-1">{formatDateTime(workout.startedAt)}</td>
                    <td className="px-1 py-1">{formatWorkoutLabel(workout)}</td>
                    <td className="px-1 py-1 text-right">{workout.durationMin.toFixed(0)}m</td>
                    <td className="px-1 py-1 text-right">{formatOptionalNumber(workout.distanceKm, "km", 2)}</td>
                    <td className="px-1 py-1 text-right">
                      {formatOptionalNumber(workout.hrAvg || workout.avgHeartRate, "", 0)}
                    </td>
                    <td className="px-1 py-1 text-right">{formatOptionalNumber(workout.activeEnergyKj, "kJ", 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside className="min-h-0 overflow-auto rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
          Workout Drill-Down
        </p>
        {loadingWorkoutDetail ? (
          <p className="mt-2 text-sm text-[var(--muted)]">Loading workout details...</p>
        ) : selectedWorkoutDetail ? (
          <div className="mt-2 space-y-3">
            <div className="rounded border border-[var(--panel-border)] bg-[var(--panel)] p-2 text-xs">
              <p className="font-semibold text-[var(--text)]">{formatWorkoutDetailLabel(selectedWorkoutDetail)}</p>
              <p className="mt-1 text-[var(--muted)]">
                {formatDateTime(selectedWorkoutDetail.startedAt)} to{" "}
                {formatDateTime(selectedWorkoutDetail.endedAt)}
              </p>
              <p className="mt-1 text-[var(--muted)]">
                {selectedWorkoutDetail.durationMin.toFixed(0)}m • Stream count{" "}
                {selectedWorkoutDetail.streamCount} • Confidence{" "}
                {Math.round(selectedWorkoutDetail.mergeConfidence * 100)}%
              </p>
              <p className="mt-1 text-[var(--muted)]">
                {formatOptionalNumber(selectedWorkoutDetail.distanceKm, "km", 2)} •{" "}
                {formatOptionalNumber(selectedWorkoutDetail.hrAvg, "bpm", 0)} •{" "}
                {formatOptionalNumber(selectedWorkoutDetail.activeEnergyKj, "kJ", 0)}
              </p>
            </div>

            <SeriesPanel
              title="Heart Rate Series"
              rows={selectedWorkoutDetail.heartRateSeries || []}
              extractValue={(row) => row.avg ?? row.max ?? row.min}
              color="#ff8f8f"
              unit="bpm"
            />
            <SeriesPanel
              title="Distance Series"
              rows={selectedWorkoutDetail.distanceSeries || []}
              extractValue={(row) => row.value}
              color="#6bd4ff"
              unit="km"
            />
            <SeriesPanel
              title="Step Series"
              rows={selectedWorkoutDetail.stepSeries || []}
              extractValue={(row) => row.value}
              color="#ffe27a"
              unit="steps"
            />
            <SeriesPanel
              title="Active Energy Series"
              rows={selectedWorkoutDetail.activeEnergySeries || []}
              extractValue={(row) => row.value}
              color="#8af58b"
              unit="kJ"
            />

            <div className="rounded border border-[var(--panel-border)] bg-[var(--panel)] p-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Stream Provenance
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Key: {selectedWorkoutDetail.workoutKey}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                {selectedWorkoutDetail.sourceFiles.map((file) => (
                  <li key={`source-${file}`} className="truncate">
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Pick a workout from the timeline to inspect full merged details and raw streams.
          </p>
        )}

        <div className="mt-4 rounded border border-[var(--panel-border)] bg-[var(--panel)] p-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Import Transparency
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Parsed raw files: {rawFiles.length}
          </p>
          <div className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-[var(--muted)]">
            {rawFiles.slice().reverse().slice(0, 16).map((file) => (
              <p key={`raw-file-${file.id}`} className="truncate">
                {file.filename} • {file.fileType} • {file.rowCount} rows
              </p>
            ))}
          </div>
        </div>

        {todayRecommendation ? (
          <p className="mt-3 text-xs text-[var(--muted)]">{todayRecommendation.workoutSuggestion}</p>
        ) : null}
      </aside>
    </div>
  );
}

function SleepScoreScatter({
  points,
  average,
}: {
  points: Array<{ date: string; score: number }>;
  average: number;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return <p className="text-xs text-[var(--muted)]">No sleep-score data yet.</p>;
  }

  const width = 300;
  const height = 110;
  const padLeft = 14;
  const padRight = 10;
  const padTop = 12;
  const padBottom = 20;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const xForIndex = (index: number): number => {
    if (points.length <= 1) {
      return padLeft + plotWidth / 2;
    }

    return padLeft + (index / (points.length - 1)) * plotWidth;
  };

  const yForScore = (score: number): number =>
    padTop + (1 - Math.max(0, Math.min(100, score)) / 100) * plotHeight;

  const polyline = points
    .map((point, index) => `${xForIndex(index)},${yForScore(point.score)}`)
    .join(" ");
  const avgY = yForScore(average);
  const activeIndex = hoveredIndex ?? points.length - 1;
  const activePoint = points[activeIndex];
  const activeX = xForIndex(activeIndex);
  const activeY = yForScore(activePoint.score);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-24 w-full"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <line
          x1={padLeft}
          x2={width - padRight}
          y1={avgY}
          y2={avgY}
          stroke="#8af58b"
          strokeDasharray="4 3"
          strokeWidth="1"
          opacity="0.8"
        />
        <polyline fill="none" stroke="#8af58b" strokeWidth="2" points={polyline} />
        <line
          x1={activeX}
          x2={activeX}
          y1={padTop}
          y2={height - padBottom}
          stroke="#8af58b"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        {points.map((point, index) => (
          <circle
            key={`sleep-score-point-${point.date}`}
            cx={xForIndex(index)}
            cy={yForScore(point.score)}
            r={activeIndex === index ? 4.4 : 3.2}
            fill={activeIndex === index ? "#d9ffd9" : "#8af58b"}
            tabIndex={0}
            onMouseEnter={() => setHoveredIndex(index)}
            onFocus={() => setHoveredIndex(index)}
          >
            <title>{`${point.date}: ${point.score.toFixed(1)}`}</title>
          </circle>
        ))}
        <circle cx={activeX} cy={activeY} r={4.6} fill="#d9ffd9" stroke="#8af58b" strokeWidth="1" />
        <text
          x={width - padRight}
          y={padTop}
          textAnchor="end"
          fontSize="10"
          fill="var(--muted)"
        >
          7-day avg: {average.toFixed(1)}
        </text>
        <text
          x={padLeft}
          y={padTop}
          textAnchor="start"
          fontSize="10"
          fill="var(--muted)"
        >
          {activePoint.date}: {activePoint.score.toFixed(1)}
        </text>
      </svg>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.1em] text-[var(--muted)]">
        <span>{points[0].date.slice(5)}</span>
        <span>{points[points.length - 1].date.slice(5)}</span>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}

function CompactBars({
  values,
  labels,
  max,
  color,
  valueFormatter,
}: {
  values: number[];
  labels?: string[];
  max: number;
  color: string;
  valueFormatter?: (value: number, index: number) => string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (values.length === 0) {
    return <p className="text-xs text-[var(--muted)]">No data yet.</p>;
  }

  const safeMax = max > 0 ? max : 1;
  const activeIndex = hoveredIndex ?? values.length - 1;
  const activeValue = values[activeIndex] || 0;
  const activeLabel = labels?.[activeIndex] || `Point ${activeIndex + 1}`;
  const activeDisplay = valueFormatter
    ? valueFormatter(activeValue, activeIndex)
    : activeValue.toFixed(2);

  return (
    <div>
      <p className="mb-1 text-[10px] text-[var(--muted)]">
        {activeLabel}: {activeDisplay}
      </p>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${Math.max(values.length, 1)}, minmax(0, 1fr))` }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {values.map((value, index) => {
          const display = valueFormatter ? valueFormatter(value, index) : value.toFixed(2);
          const label = labels?.[index] || `Point ${index + 1}`;

          return (
            <div
              key={`bar-${index}`}
              className="h-16 rounded border border-[var(--panel-border)] bg-black/20 p-[2px]"
              title={`${label}: ${display}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onFocus={() => setHoveredIndex(index)}
            >
              <div
                className="h-full w-full rounded"
                style={{
                  transform: `scaleY(${Math.max(0.05, (value || 0) / safeMax)})`,
                  transformOrigin: "bottom",
                  backgroundColor: color,
                  outline: activeIndex === index ? "1px solid rgba(255,255,255,0.6)" : "none",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SeriesPanel({
  title,
  rows,
  extractValue,
  color,
  unit,
}: {
  title: string;
  rows: WorkoutStreamPoint[];
  extractValue: (row: WorkoutStreamPoint) => number | undefined;
  color: string;
  unit: string;
}) {
  const series = rows
    .map((row) => ({
      timestamp: row.timestamp,
      value: extractValue(row),
    }))
    .filter(
      (item): item is { timestamp: string; value: number } =>
        typeof item.value === "number" && Number.isFinite(item.value),
    );
  const values = series.map((item) => item.value);
  const average =
    values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const tail = series.slice(-20);
  const tailValues = tail.map((item) => item.value);
  const tailLabels = tail.map((item) => formatDateTime(item.timestamp));

  return (
    <div className="rounded border border-[var(--panel-border)] bg-[var(--panel)] p-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {values.length} points • avg {average.toFixed(2)} {unit}
      </p>
      <div className="mt-2">
        <CompactBars
          values={tailValues}
          labels={tailLabels}
          max={Math.max(...values, 1)}
          color={color}
          valueFormatter={(value) => `${value.toFixed(2)} ${unit}`}
        />
      </div>
    </div>
  );
}

function formatOptionalNumber(
  value: number | undefined,
  suffix: string,
  digits: number,
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }

  if (suffix) {
    return `${value.toFixed(digits)}${suffix}`;
  }

  return value.toFixed(digits);
}

function formatTimeLabel(dateLike: string): string {
  return new Date(dateLike).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWorkoutLabel(workout: WorkoutEntry): string {
  return (
    workout.workoutDisplayLabel ||
    workout.workoutNameRaw ||
    `${workout.type[0].toUpperCase()}${workout.type.slice(1)}`
  );
}

function formatWorkoutDetailLabel(workout: WorkoutDetail): string {
  return (
    workout.workoutDisplayLabel ||
    workout.workoutNameRaw ||
    `${workout.workoutType[0].toUpperCase()}${workout.workoutType.slice(1)} Workout`
  );
}

function ExamEditor({
  exams,
  onSave,
}: {
  exams: Exam[];
  onSave: (exams: Exam[]) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ExamDraftRow[]>(() => exams.map(toExamDraftRow));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(exams.map(toExamDraftRow));
  }, [exams]);

  const sortedDraft = useMemo(
    () =>
      [...draft].sort(
        (left, right) =>
          new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
      ),
    [draft],
  );

  const updateRow = (id: string, patch: Partial<ExamDraftRow>) => {
    setDraft((current) =>
      current.map((exam) => (exam.id === id ? { ...exam, ...patch } : exam)),
    );
  };

  const addExam = () => {
    const now = new Date();
    now.setHours(now.getHours() + 24);
    const monthDay = `${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
    const timeSlot: ExamTimeSlot = "09:00";
    const startsAt = monthDayToIso(monthDay, timeSlot) ?? now.toISOString();

    setDraft((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        subjectId: SUBJECT_IDS[0],
        title: SUBJECT_BY_ID[SUBJECT_IDS[0]].name,
        paper: "Paper",
        startsAt,
        monthDay,
        timeSlot,
      },
    ]);
  };

  const removeExam = (id: string) => {
    setDraft((current) => current.filter((exam) => exam.id !== id));
  };

  const handleSave = async () => {
    const preparedExams: Exam[] = [];

    for (const exam of sortedDraft) {
      const startsAt = monthDayToIso(exam.monthDay, exam.timeSlot);
      if (!startsAt) {
        setSaveError("Exam dates must use MM-DD format (example: 05-08).");
        return;
      }

      preparedExams.push({
        id: exam.id,
        subjectId: exam.subjectId,
        title: exam.title,
        paper: exam.paper,
        startsAt,
      });
    }

    setSaveError(null);
    setSaving(true);
    try {
      await onSave(preparedExams);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          Edit exam schedule directly here. Calendar and countdown update immediately.
        </p>
        <button
          type="button"
          onClick={addExam}
          className="rounded border border-[var(--panel-border)] px-3 py-1.5 text-xs transition hover:border-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
        >
          Add Exam
        </button>
      </div>

      <div className="space-y-2">
        {sortedDraft.map((exam) => (
          <article
            key={exam.id}
            className="rounded border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3"
          >
            <div className="grid gap-2 md:grid-cols-[1.2fr,1fr,0.9fr,0.5fr,0.45fr,auto] md:items-center">
              <input
                type="text"
                value={exam.title}
                onChange={(event) => updateRow(exam.id, { title: event.target.value })}
                className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1.5 text-sm outline-none transition focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/40"
              />
              <input
                type="text"
                value={exam.paper}
                onChange={(event) => updateRow(exam.id, { paper: event.target.value })}
                className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1.5 text-sm outline-none transition focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/40"
              />
              <select
                value={exam.subjectId}
                onChange={(event) =>
                  updateRow(exam.id, { subjectId: event.target.value as SubjectId })
                }
                className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1.5 text-sm outline-none transition focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/40"
              >
                {SUBJECTS.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={exam.monthDay}
                placeholder="MM-DD"
                onChange={(event) => {
                  const monthDay = event.target.value;
                  const maybeStartsAt = monthDayToIso(monthDay, exam.timeSlot);
                  updateRow(exam.id, {
                    monthDay,
                    startsAt: maybeStartsAt ?? exam.startsAt,
                  });
                }}
                className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1.5 text-sm outline-none transition focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/40"
              />
              <select
                value={exam.timeSlot}
                onChange={(event) => {
                  const timeSlot = event.target.value as ExamTimeSlot;
                  const maybeStartsAt = monthDayToIso(exam.monthDay, timeSlot);
                  updateRow(exam.id, {
                    timeSlot,
                    startsAt: maybeStartsAt ?? exam.startsAt,
                  });
                }}
                className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1.5 text-sm outline-none transition focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/40"
              >
                <option value="09:00">09:00</option>
                <option value="13:00">13:00</option>
              </select>
              <p className="text-xs text-[var(--muted)]">Local</p>
              <button
                type="button"
                onClick={() => removeExam(exam.id)}
                className="rounded border border-[var(--panel-border)] px-2 py-1.5 text-xs text-[var(--muted)] transition hover:border-[#ff8787] hover:text-[#ff8787] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      {saveError ? (
        <p className="text-xs text-[#ff9896]">{saveError}</p>
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Dates are month-day only. Year is inferred automatically. Time is limited to
          09:00 or 13:00.
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded border border-[var(--panel-border)] bg-[var(--panel-soft)] px-3 py-2 text-sm font-semibold transition hover:border-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Exams"}
      </button>
    </div>
  );
}
