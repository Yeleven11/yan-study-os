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
import type {
  ActiveTimerState,
  AppData,
  Exam,
  OfflineAction,
  StudySession,
  SubjectId,
  TodoItem,
} from "@/lib/types";

type AuthStatus = "checking" | "signedOut" | "signedIn";
type ExpandedCard = "exams" | "calendar" | "timer" | "totals" | "log" | null;

const TIMER_STORAGE_KEY = "yan-study-os:active-timer:v1";
const OFFLINE_QUEUE_KEY = "yan-study-os:offline-queue:v1";
const INITIAL_NOW_MS = Date.now();

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

function getExamInputValue(isoDate: string): string {
  const date = new Date(isoDate);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - timezoneOffset);
  return local.toISOString().slice(0, 16);
}

function datetimeLocalToIso(input: string): string {
  const date = new Date(input);
  return date.toISOString();
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

function formatDayLabel(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
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
  const [isExamHoverOpen, setIsExamHoverOpen] = useState(false);

  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(() =>
    readStoredTimer(),
  );
  const [timerSubjectId, setTimerSubjectId] = useState<SubjectId>(() => {
    const storedTimer = readStoredTimer();
    return storedTimer?.subjectId ?? SUBJECT_IDS[0];
  });
  const [clockNowMs, setClockNowMs] = useState(INITIAL_NOW_MS);
  const [timePulse, setTimePulse] = useState(INITIAL_NOW_MS);

  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>(() =>
    readStoredQueue(),
  );

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

        let nextData: AppData = {
          exams: bootstrap.exams,
          studySessions: bootstrap.studySessions,
          todos: bootstrap.todos,
          settings: {
            timezone: bootstrap.settings?.timezone || timezone,
            examHighlightColor: bootstrap.settings?.examHighlightColor || "#00F0FF",
          },
        };

        if (offlineQueue.length > 0) {
          nextData = offlineQueue.reduce(applyOfflineAction, nextData);
        }

        if (isMounted) {
          setData(nextData);
          setStatusMessage(null);
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setData(createDefaultAppData(timezone));
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

  const calendarDays = useMemo(
    () => buildForwardDates(new Date(INITIAL_NOW_MS), CALENDAR_DAYS_AHEAD),
    [],
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

  const sortedSessions = useMemo(() => {
    if (!data) {
      return [];
    }

    return [...data.studySessions].sort(
      (left, right) =>
        new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
    );
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

    setStatusMessage("Exam schedule updated.");
  };

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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto w-full max-w-[1780px] px-4 py-4 md:px-6 md:py-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Yan Study OS</p>
            <h1 className="text-sm font-semibold">80-Day Command Center</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span className="rounded border border-[var(--panel-border)] px-2 py-1">
              Mode: {repository.mode.toUpperCase()}
            </span>
            <span className="rounded border border-[var(--panel-border)] px-2 py-1">
              Pending sync: {offlineQueue.length}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded border border-[var(--panel-border)] px-2 py-1 transition hover:border-[var(--text)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
            >
              Logout
            </button>
          </div>
        </header>

        {statusMessage ? (
          <div className="mb-4 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-xs text-[var(--muted)]">
            {statusMessage}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[300px,minmax(0,1fr),300px] 2xl:grid-cols-[320px,minmax(0,1fr),320px]">
          <TodoRail
            activeTodos={activeTodos}
            archivedTodos={archivedTodos}
            onAddTodo={handleAddTodo}
            onArchive={handleArchiveTodo}
            onRestore={handleRestoreTodo}
          />

          <main className="grid auto-rows-min gap-4">
            <section
              className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4"
              onMouseEnter={() => setIsExamHoverOpen(true)}
              onMouseLeave={() => setIsExamHoverOpen(false)}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Closest Exams</p>
                  <h2 className="text-sm font-semibold">Countdown Monitor</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedCard("exams")}
                  className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                >
                  Expand
                </button>
              </div>

              <div className="grid gap-2 lg:grid-cols-3">
                {nearestExams.map((exam) => {
                  const countdown = getCountdown(exam, new Date(timePulse));
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
            </section>

            <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
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

              <div className="grid grid-cols-[repeat(12,minmax(0,1fr))] gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))] md:grid-cols-[repeat(20,minmax(0,1fr))] xl:grid-cols-[repeat(24,minmax(0,1fr))]">
                {calendarDays.map((dateKey) => {
                  const aggregate = dayAggregates[dateKey];
                  const exams = examsByDate[dateKey] || [];

                  const dominantColor = aggregate?.dominantSubjectId
                    ? SUBJECT_BY_ID[aggregate.dominantSubjectId].color
                    : "rgba(255,255,255,0.04)";

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      className="group relative aspect-square rounded-[4px] border border-white/5 transition hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                      style={{ backgroundColor: dominantColor }}
                      aria-label={dateKey}
                    >
                      <span className="pointer-events-none absolute left-1/2 top-0 z-10 hidden -translate-x-1/2 -translate-y-[110%] whitespace-nowrap rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1 text-[10px] text-[var(--text)] shadow-lg group-hover:block">
                        {formatDayLabel(dateKey)} •{" "}
                        {aggregate?.totalSec ? formatDuration(aggregate.totalSec) : "No study"}
                      </span>
                      {exams.length > 0 ? (
                        <span
                          className="pointer-events-none absolute inset-[-2px] rounded-[6px] border"
                          style={{
                            borderColor: data.settings.examHighlightColor,
                            boxShadow: `0 0 10px ${data.settings.examHighlightColor}`,
                          }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">
                120-day forward study calendar. Color = most studied subject for the day.
              </p>
            </section>

            <div className="grid gap-4 2xl:grid-cols-2">
              <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
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

                <p className="mt-3 text-xs text-[var(--muted)]">
                  Sessions shorter than 5 minutes are ignored.
                </p>
              </section>

              <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Cumulative Time</p>
                    <h2 className="text-sm font-semibold">Per Subject Totals</h2>
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
              </section>
            </div>

          </main>

          <StudyLogRail
            sortedSessions={sortedSessions}
            onExpand={() => setExpandedCard("log")}
          />
        </div>
      </div>

      {isExamHoverOpen ? (
        <>
          <div className="pointer-events-none fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity duration-200" />
          <div className="pointer-events-none fixed inset-x-4 top-20 z-40 mx-auto w-full max-w-[780px] rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)]/95 p-4 shadow-2xl">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Upcoming Exam Countdown
            </p>
            <div className="mt-3 max-h-[68vh] space-y-2 overflow-auto pr-1">
              {allUpcomingExams.map((exam) => {
                const countdown = getCountdown(exam, new Date(timePulse));
                return (
                  <article
                    key={`hover-${exam.id}`}
                    className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-[var(--muted)]">
                        {SUBJECT_BY_ID[exam.subjectId].name} • {exam.paper}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{formatDateTime(exam.startsAt)}</p>
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
          </div>
        </>
      ) : null}

      <FocusModal
        open={expandedCard !== null}
        onClose={() => setExpandedCard(null)}
        title={
          expandedCard === "exams"
            ? "Exam Countdown"
            : expandedCard === "calendar"
            ? "120-Day Study Calendar"
            : expandedCard === "timer"
            ? "Study Timer"
            : expandedCard === "totals"
            ? "Cumulative Totals"
            : "Study Log"
        }
      >
        {expandedCard === "exams" ? (
          <ExamEditor exams={data.exams} onSave={handleUpdateExams} />
        ) : null}

        {expandedCard === "calendar" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-[repeat(10,minmax(0,1fr))] gap-1 md:grid-cols-[repeat(15,minmax(0,1fr))] xl:grid-cols-[repeat(20,minmax(0,1fr))]">
              {calendarDays.map((dateKey) => {
                const aggregate = dayAggregates[dateKey];
                const examList = examsByDate[dateKey] || [];
                const dominantColor = aggregate?.dominantSubjectId
                  ? SUBJECT_BY_ID[aggregate.dominantSubjectId].color
                  : "rgba(255,255,255,0.04)";

                return (
                  <div key={dateKey} className="space-y-1">
                    <div
                      className="relative aspect-square rounded border border-white/10"
                      style={{ backgroundColor: dominantColor }}
                      title={dateKey}
                    >
                      {examList.length > 0 ? (
                        <span
                          className="pointer-events-none absolute inset-[-2px] rounded border"
                          style={{
                            borderColor: data.settings.examHighlightColor,
                            boxShadow: `0 0 10px ${data.settings.examHighlightColor}`,
                          }}
                        />
                      ) : null}
                    </div>
                    <p className="truncate text-[10px] text-[var(--muted)]">{dateKey.slice(5)}</p>
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
            <p>Only sessions of 5 minutes or more are committed to study history.</p>
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

        {expandedCard === "log" ? (
          <div className="space-y-2">
            {sortedSessions.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No study sessions yet.</p>
            ) : (
              sortedSessions.map((session) => (
                <article
                  key={session.id}
                  className="rounded border border-[var(--panel-border)] bg-[var(--panel-soft)] px-3 py-2"
                >
                  <div className="mb-2 h-1 rounded" style={{ backgroundColor: SUBJECT_BY_ID[session.subjectId].color }} />
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{SUBJECT_BY_ID[session.subjectId].name}</p>
                    <p className="text-sm">{formatDuration(session.durationSec)}</p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDateTime(session.startedAt)} to {formatDateTime(session.endedAt)}
                  </p>
                </article>
              ))
            )}
          </div>
        ) : null}
      </FocusModal>
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
    <aside className="h-full min-h-[660px] rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 xl:sticky xl:top-6 xl:min-h-[calc(100vh-170px)]">
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

      <div className="max-h-[420px] space-y-2 overflow-auto pr-1 xl:max-h-[calc(100vh-360px)]">
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

function StudyLogRail({
  sortedSessions,
  onExpand,
}: {
  sortedSessions: StudySession[];
  onExpand: () => void;
}) {
  return (
    <aside className="h-full min-h-[660px] rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 xl:sticky xl:top-6 xl:min-h-[calc(100vh-170px)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Study Log</p>
          <h2 className="text-sm font-semibold">Recent Sessions</h2>
        </div>
        <button
          type="button"
          onClick={onExpand}
          className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
        >
          Expand
        </button>
      </div>

      <div className="max-h-[520px] space-y-2 overflow-auto pr-1 xl:max-h-[calc(100vh-280px)]">
        {sortedSessions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No study sessions logged yet.</p>
        ) : (
          sortedSessions.map((session) => (
            <article
              key={session.id}
              className="rounded-md border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2"
            >
              <div
                className="mb-2 h-1 rounded"
                style={{ backgroundColor: SUBJECT_BY_ID[session.subjectId].color }}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
                <span className="font-semibold text-[var(--text)]">
                  {SUBJECT_BY_ID[session.subjectId].name}
                </span>
                <span>{formatDuration(session.durationSec)}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {formatDateTime(session.startedAt)}
              </p>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}

function ExamEditor({
  exams,
  onSave,
}: {
  exams: Exam[];
  onSave: (exams: Exam[]) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Exam[]>([...exams]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft([...exams]);
  }, [exams]);

  const sortedDraft = useMemo(
    () =>
      [...draft].sort(
        (left, right) =>
          new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
      ),
    [draft],
  );

  const updateRow = (id: string, patch: Partial<Exam>) => {
    setDraft((current) =>
      current.map((exam) => (exam.id === id ? { ...exam, ...patch } : exam)),
    );
  };

  const addExam = () => {
    const now = new Date();
    now.setHours(now.getHours() + 24);

    setDraft((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        subjectId: SUBJECT_IDS[0],
        title: SUBJECT_BY_ID[SUBJECT_IDS[0]].name,
        paper: "Paper",
        startsAt: now.toISOString(),
      },
    ]);
  };

  const removeExam = (id: string) => {
    setDraft((current) => current.filter((exam) => exam.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(sortedDraft);
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
            <div className="grid gap-2 md:grid-cols-[1.2fr,1fr,0.8fr,0.6fr,auto] md:items-center">
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
                type="datetime-local"
                value={getExamInputValue(exam.startsAt)}
                onChange={(event) =>
                  updateRow(exam.id, {
                    startsAt: datetimeLocalToIso(event.target.value),
                  })
                }
                className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1.5 text-sm outline-none transition focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/40"
              />
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
