"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CalendarDays, CheckSquare, Circle, Clock3, RefreshCcw, XCircle } from "lucide-react";
import { createDashboardRepository } from "@/lib/client/repository";
import { SUBJECT_BY_ID, SUBJECTS } from "@/lib/constants";
import { buildDayAggregates, buildSubjectTotals, formatDuration } from "@/lib/dashboard-utils";
import { toDateKeyInTimezone } from "@/components/study-dashboard/selectors";
import {
  buildTimelineDateWindow,
  getLoggableTimelineEntry,
  getTimelineDayOrShell,
  getTimelinePlannedDayMinutes,
  getTimelinePlannedSubjectMinutes,
  mergeStudySessionsWithTimeline,
  resolveTimelineProgressMinutes,
  TIMELINE_PLAN_RANGE,
} from "@/lib/timeline";
import type {
  DashboardBootstrap,
  SubjectId,
  TimelineBlockProgress,
  TimelineBlockState,
  TimelineDayPlan,
  TimelineEntry,
} from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";

const TIMELINE_TIMEZONE = "Europe/Berlin";
const DAY_WINDOW_BEFORE = 3;
const DAY_WINDOW_AFTER = 5;
const DAY_WINDOW_STEP = 3;
const HOUR_HEIGHT = 56;
const DAY_HEADER_HEIGHT = 52;
const DAY_GRID_HEIGHT = HOUR_HEIGHT * 24;
const DAY_SECTION_HEIGHT = DAY_HEADER_HEIGHT + DAY_GRID_HEIGHT;
const MINUTE_HEIGHT = DAY_GRID_HEIGHT / (24 * 60);

type TimelineEditorState = {
  blockId: string;
  state: TimelineBlockState;
  actualMinutes: string;
  actualSubjectId: string;
  note: string;
};

type DateWindowState = {
  before: number;
  after: number;
};

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function formatMinuteLabel(minute: number): string {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatHoursFromMinutes(totalMinutes: number): string {
  return `${(totalMinutes / 60).toFixed(1)}h`;
}

function isDateKey(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function getTodayDateKey(now = new Date()): string {
  return toDateKeyInTimezone(now, TIMELINE_TIMEZONE, 0);
}

function buildDefaultEditorState(
  entry: TimelineEntry,
  progress?: TimelineBlockProgress,
): TimelineEditorState {
  const actualMinutes =
    typeof progress?.actualMinutes === "number" && Number.isFinite(progress.actualMinutes)
      ? String(progress.actualMinutes)
      : "";

  return {
    blockId: entry.id,
    state: progress?.state || "pending",
    actualMinutes,
    actualSubjectId: progress?.actualSubjectId || "",
    note: progress?.note || "",
  };
}

function serializeEditorState(
  entry: TimelineEntry,
  editorState: TimelineEditorState,
): TimelineBlockProgress {
  const parsedMinutes = Number.parseInt(editorState.actualMinutes, 10);
  const actualMinutes =
    Number.isFinite(parsedMinutes) && parsedMinutes >= 0 ? parsedMinutes : undefined;
  const actualSubjectId =
    editorState.actualSubjectId && editorState.actualSubjectId !== entry.subjectId
      ? (editorState.actualSubjectId as SubjectId)
      : undefined;
  const note = editorState.note.trim();

  return {
    blockId: editorState.blockId,
    state: editorState.state,
    actualMinutes,
    actualSubjectId,
    note: note.length > 0 ? note : undefined,
    updatedAt: new Date().toISOString(),
  };
}

function buildProgressMap(progressList: TimelineBlockProgress[] | undefined): Map<string, TimelineBlockProgress> {
  return new Map((progressList ?? []).map((item) => [item.blockId, item]));
}

function getEntryPalette(entry: TimelineEntry): { background: string; border: string; color: string } {
  if (entry.kind === "study" && entry.subjectId) {
    const color = SUBJECT_BY_ID[entry.subjectId].color;
    return {
      background: `${color}22`,
      border: `${color}66`,
      color,
    };
  }

  if (entry.kind === "exam") {
    return {
      background: "rgba(248, 113, 113, 0.16)",
      border: "rgba(248, 113, 113, 0.45)",
      color: "#fecaca",
    };
  }

  if (entry.kind === "meal") {
    return {
      background: "rgba(148, 163, 184, 0.12)",
      border: "rgba(148, 163, 184, 0.28)",
      color: "#dbe3ef",
    };
  }

  if (entry.kind === "sleep") {
    return {
      background: "rgba(17, 24, 39, 0.9)",
      border: "rgba(71, 85, 105, 0.42)",
      color: "#94a3b8",
    };
  }

  if (entry.kind === "outside") {
    return {
      background: "rgba(52, 211, 153, 0.12)",
      border: "rgba(52, 211, 153, 0.32)",
      color: "#a7f3d0",
    };
  }

  return {
    background: "rgba(123, 139, 163, 0.12)",
    border: "rgba(123, 139, 163, 0.28)",
    color: "#dbe3ef",
  };
}

function getStatusIcon(state: TimelineBlockState | undefined) {
  if (state === "completed") {
    return CheckSquare;
  }
  if (state === "incomplete") {
    return XCircle;
  }
  return Circle;
}

function DayTimelineSection({
  dayPlan,
  isToday,
  currentMinute,
  progressByBlockId,
  selectedBlockId,
  onSelectBlock,
}: {
  dayPlan: TimelineDayPlan;
  isToday: boolean;
  currentMinute: number;
  progressByBlockId: Map<string, TimelineBlockProgress>;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
}) {
  const showEmptyState = dayPlan.entries.length === 0;

  return (
    <section
      className="relative border-b border-[var(--panel-border)] bg-[var(--panel)]"
      style={{ height: DAY_SECTION_HEIGHT }}
      data-day={dayPlan.date}
    >
      <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-[var(--panel-border)] bg-[var(--panel)] px-4">
        <div className="flex items-center gap-3">
          <span className="font-medium text-[var(--text)]">{dayPlan.dayLabel}</span>
          {dayPlan.focusedMinutes > 0 ? (
            <span className="text-sm text-[var(--muted)]">
              Planned {formatHoursFromMinutes(dayPlan.focusedMinutes)}
            </span>
          ) : (
            <span className="text-sm text-[var(--muted)]">No hardcoded plan</span>
          )}
        </div>
        {dayPlan.checknotes.understanding ? (
          <span className="max-w-[46ch] truncate text-sm text-[var(--muted)]">
            {dayPlan.checknotes.understanding}
          </span>
        ) : null}
      </header>

      <div className="flex" style={{ height: DAY_GRID_HEIGHT }}>
        <div className="w-16 shrink-0 border-r border-[var(--panel-border)] bg-[var(--panel)]">
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={`${dayPlan.date}-hour-${hour}`}
              className="border-b border-[var(--panel-border)] px-2 pt-1 text-[11px] text-[var(--muted)]"
              style={{ height: HOUR_HEIGHT }}
            >
              {formatHourLabel(hour)}
            </div>
          ))}
        </div>

        <div className="relative flex-1 bg-[var(--bg)]">
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={`${dayPlan.date}-line-${hour}`}
              className="absolute inset-x-0 border-b border-[var(--panel-border)]"
              style={{ top: hour * HOUR_HEIGHT }}
            />
          ))}

          {showEmptyState ? (
            <div className="absolute inset-x-6 top-20 rounded-lg border border-dashed border-[var(--panel-border)] bg-[var(--panel)]/80 p-4 text-sm text-[var(--muted)]">
              No hardcoded plan for this day. The timeline still stays scrollable so you can jump around the calendar without hitting a hard stop.
            </div>
          ) : null}

          {dayPlan.entries.map((entry) => {
            const palette = getEntryPalette(entry);
            const top = entry.startMinute * MINUTE_HEIGHT;
            const height = Math.max(18, entry.plannedMinutes * MINUTE_HEIGHT);
            const progress = progressByBlockId.get(entry.id);
            const StatusIcon = getStatusIcon(progress?.state);
            const active = selectedBlockId === entry.id;

            return (
              <button
                key={entry.id}
                type="button"
                className={`absolute left-3 right-3 overflow-hidden rounded-md border px-3 py-2 text-left transition ${
                  active ? "ring-2 ring-[var(--focus)]" : ""
                } ${entry.loggable ? "hover:border-white/40" : "cursor-default"}`}
                style={{
                  top,
                  height,
                  backgroundColor: palette.background,
                  borderColor: palette.border,
                  color: palette.color,
                }}
                onClick={() => {
                  if (entry.loggable) {
                    onSelectBlock(entry.id);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{entry.title}</div>
                    <div className="text-[11px] text-[var(--muted)]">
                      {formatMinuteLabel(entry.startMinute)} - {formatMinuteLabel(entry.endMinute)}
                    </div>
                  </div>
                  {entry.loggable ? (
                    <StatusIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text)]" />
                  ) : null}
                </div>
                {height >= 44 && entry.detail ? (
                  <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[var(--muted)]">
                    {entry.detail}
                  </p>
                ) : null}
              </button>
            );
          })}

          {isToday ? (
            <div
              className="pointer-events-none absolute inset-x-0 z-10 border-t border-[#fbbf24]"
              style={{ top: currentMinute * MINUTE_HEIGHT }}
            >
              <span className="absolute left-2 top-[-10px] rounded bg-[#fbbf24] px-1.5 py-0.5 text-[10px] font-medium text-[#111827]">
                Now
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function TimelineInspector({
  selectedEntry,
  progress,
  editorState,
  saving,
  onChangeState,
  onChangeMinutes,
  onCommitMinutes,
  onChangeSubject,
  onChangeNote,
  onCommitNote,
}: {
  selectedEntry: TimelineEntry | null;
  progress: TimelineBlockProgress | undefined;
  editorState: TimelineEditorState | null;
  saving: boolean;
  onChangeState: (state: TimelineBlockState) => void;
  onChangeMinutes: (value: string) => void;
  onCommitMinutes: () => void;
  onChangeSubject: (value: string) => void;
  onChangeNote: (value: string) => void;
  onCommitNote: () => void;
}) {
  if (!selectedEntry || !editorState) {
    return (
      <aside className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 text-sm text-[var(--muted)]">
        Select a study block in the timeline to mark it complete, log actual minutes, or leave yourself a note.
      </aside>
    );
  }

  const actualMinutes = resolveTimelineProgressMinutes(selectedEntry, progress);

  return (
    <aside className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">{selectedEntry.title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {selectedEntry.date} · {formatMinuteLabel(selectedEntry.startMinute)} -{" "}
            {formatMinuteLabel(selectedEntry.endMinute)}
          </p>
        </div>
        <span className="rounded-md border border-[var(--panel-border)] px-2 py-1 text-xs text-[var(--muted)]">
          Planned {formatDuration(selectedEntry.plannedMinutes * 60)}
        </span>
      </div>

      {selectedEntry.detail ? (
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{selectedEntry.detail}</p>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--muted)]">Status</p>
          <div className="grid grid-cols-3 gap-2">
            {(["pending", "completed", "incomplete"] as const).map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => onChangeState(state)}
                className={`rounded-md border px-3 py-2 text-sm ${
                  editorState.state === state
                    ? "border-[var(--focus)] bg-[var(--panel-soft)] text-[var(--text)]"
                    : "border-[var(--panel-border)] text-[var(--muted)]"
                }`}
              >
                {state === "pending"
                  ? "Pending"
                  : state === "completed"
                  ? "Completed"
                  : "Incomplete"}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-medium text-[var(--muted)]">
            Actual minutes studied
          </span>
          <input
            value={editorState.actualMinutes}
            onChange={(event) => onChangeMinutes(event.target.value)}
            onBlur={onCommitMinutes}
            inputMode="numeric"
            className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--focus)]"
            placeholder={String(selectedEntry.plannedMinutes)}
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Saved total: {formatDuration(actualMinutes * 60)}
          </p>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium text-[var(--muted)]">Subject</span>
          <select
            value={editorState.actualSubjectId}
            onChange={(event) => onChangeSubject(event.target.value)}
            className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--focus)]"
          >
            <option value="">Use planned subject</option>
            {SUBJECTS.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium text-[var(--muted)]">Note</span>
          <textarea
            value={editorState.note}
            onChange={(event) => onChangeNote(event.target.value)}
            onBlur={onCommitNote}
            className="min-h-28 w-full rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--focus)]"
            placeholder="What happened in this block?"
          />
        </label>

        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <Clock3 className="h-3.5 w-3.5" />
          {saving ? "Saving progress..." : "Changes save to your account-backed timeline progress."}
        </div>
      </div>
    </aside>
  );
}

export default function TimelinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedDateParam = searchParams.get("date");
  const requestedDate = isDateKey(requestedDateParam) ? requestedDateParam : null;
  const [data, setData] = useState<DashboardBootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [windowState, setWindowState] = useState<DateWindowState>({
    before: DAY_WINDOW_BEFORE,
    after: DAY_WINDOW_AFTER,
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<TimelineEditorState | null>(null);
  const [savingBlockId, setSavingBlockId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prependAdjustmentRef = useRef(0);
  const shouldScrollToAnchorRef = useRef(true);
  const repositoryRef = useRef(createDashboardRepository());
  const todayDate = useMemo(() => getTodayDateKey(new Date(nowMs)), [nowMs]);
  const anchorDate = requestedDate || todayDate;

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    repositoryRef.current.getBootstrap().then((bootstrap) => {
      if (cancelled) {
        return;
      }
      setData(bootstrap);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setWindowState({
      before: DAY_WINDOW_BEFORE,
      after: DAY_WINDOW_AFTER,
    });
    shouldScrollToAnchorRef.current = true;
  }, [anchorDate]);

  const visibleDates = useMemo(
    () => buildTimelineDateWindow(anchorDate, windowState.before, windowState.after),
    [anchorDate, windowState.after, windowState.before],
  );

  const visibleDayPlans = useMemo(
    () => visibleDates.map((date) => getTimelineDayOrShell(date)),
    [visibleDates],
  );

  const progressByBlockId = useMemo(
    () => buildProgressMap(data?.timelineProgress),
    [data?.timelineProgress],
  );

  const combinedStudySessions = useMemo(
    () => mergeStudySessionsWithTimeline(data?.studySessions ?? [], data?.timelineProgress),
    [data?.studySessions, data?.timelineProgress],
  );

  const dayAggregates = useMemo(
    () => buildDayAggregates(combinedStudySessions),
    [combinedStudySessions],
  );

  const subjectTotals = useMemo(
    () => buildSubjectTotals(combinedStudySessions),
    [combinedStudySessions],
  );

  const plannedDayMinutes = useMemo(() => getTimelinePlannedDayMinutes(), []);
  const plannedSubjectMinutes = useMemo(() => getTimelinePlannedSubjectMinutes(), []);

  const focusDayPlan = useMemo(() => getTimelineDayOrShell(anchorDate), [anchorDate]);
  const focusActualMinutes = dayAggregates[anchorDate]?.totalSec
    ? Math.round(dayAggregates[anchorDate].totalSec / 60)
    : 0;
  const focusPlannedMinutes = plannedDayMinutes[anchorDate] || 0;
  const focusCompletionRatio =
    focusPlannedMinutes > 0 ? Math.min(1, focusActualMinutes / focusPlannedMinutes) : 0;

  const selectedEntry = selectedBlockId ? getLoggableTimelineEntry(selectedBlockId) || null : null;
  const selectedProgress = selectedBlockId ? progressByBlockId.get(selectedBlockId) : undefined;

  useEffect(() => {
    if (!selectedEntry) {
      const firstLoggable =
        focusDayPlan.entries.find((entry) => entry.loggable) ||
        visibleDayPlans.flatMap((dayPlan) => dayPlan.entries).find((entry) => entry.loggable) ||
        null;
      setSelectedBlockId(firstLoggable?.id || null);
      return;
    }

    setEditorState(buildDefaultEditorState(selectedEntry, selectedProgress));
  }, [focusDayPlan.entries, selectedEntry, selectedProgress, visibleDayPlans]);

  useLayoutEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    if (prependAdjustmentRef.current > 0) {
      scrollRef.current.scrollTop += prependAdjustmentRef.current;
      prependAdjustmentRef.current = 0;
    }

    if (!shouldScrollToAnchorRef.current) {
      return;
    }

    const dayIndex = visibleDates.indexOf(anchorDate);
    if (dayIndex === -1) {
      return;
    }

    const now = new Date(nowMs);
    const scrollMinute =
      anchorDate === todayDate
        ? now.getHours() * 60 + now.getMinutes()
        : focusDayPlan.entries[0]?.startMinute ?? 8 * 60;

    const topOffset =
      dayIndex * DAY_SECTION_HEIGHT + DAY_HEADER_HEIGHT + scrollMinute * MINUTE_HEIGHT - 180;
    scrollRef.current.scrollTop = Math.max(0, topOffset);
    shouldScrollToAnchorRef.current = false;
  }, [anchorDate, focusDayPlan.entries, nowMs, todayDate, visibleDates]);

  const commitProgress = useCallback(
    async (nextProgress: TimelineBlockProgress) => {
      setSavingBlockId(nextProgress.blockId);
      startTransition(() => {
        setData((previous) => {
          if (!previous) {
            return previous;
          }

          const nextTimelineProgress = (previous.timelineProgress ?? []).filter(
            (item) => item.blockId !== nextProgress.blockId,
          );
          nextTimelineProgress.push(nextProgress);
          nextTimelineProgress.sort(
            (left, right) => new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime(),
          );

          return {
            ...previous,
            timelineProgress: nextTimelineProgress,
          };
        });
      });

      try {
        await repositoryRef.current.upsertTimelineProgress(nextProgress);
      } finally {
        setSavingBlockId((current) => (current === nextProgress.blockId ? null : current));
      }
    },
    [],
  );

  const handleStateChange = useCallback(
    (nextState: TimelineBlockState) => {
      if (!selectedEntry || !editorState) {
        return;
      }

      const nextEditorState: TimelineEditorState = {
        ...editorState,
        state: nextState,
        actualMinutes:
          nextState === "completed" && editorState.actualMinutes.trim().length === 0
            ? String(selectedEntry.plannedMinutes)
            : editorState.actualMinutes,
      };
      setEditorState(nextEditorState);
      void commitProgress(serializeEditorState(selectedEntry, nextEditorState));
    },
    [commitProgress, editorState, selectedEntry],
  );

  const handleMinutesCommit = useCallback(() => {
    if (!selectedEntry || !editorState) {
      return;
    }
    void commitProgress(serializeEditorState(selectedEntry, editorState));
  }, [commitProgress, editorState, selectedEntry]);

  const handleSubjectCommit = useCallback(
    (value: string) => {
      if (!selectedEntry || !editorState) {
        return;
      }

      const nextEditorState = {
        ...editorState,
        actualSubjectId: value,
      };
      setEditorState(nextEditorState);
      void commitProgress(serializeEditorState(selectedEntry, nextEditorState));
    },
    [commitProgress, editorState, selectedEntry],
  );

  const handleNoteCommit = useCallback(() => {
    if (!selectedEntry || !editorState) {
      return;
    }
    void commitProgress(serializeEditorState(selectedEntry, editorState));
  }, [commitProgress, editorState, selectedEntry]);

  const handleTimelineScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const currentTarget = event.currentTarget;
      const remainingBottom =
        currentTarget.scrollHeight - currentTarget.scrollTop - currentTarget.clientHeight;

      if (currentTarget.scrollTop < DAY_SECTION_HEIGHT * 1.5) {
        prependAdjustmentRef.current += DAY_WINDOW_STEP * DAY_SECTION_HEIGHT;
        setWindowState((previous) => ({
          before: previous.before + DAY_WINDOW_STEP,
          after: previous.after,
        }));
      }

      if (remainingBottom < DAY_SECTION_HEIGHT * 1.5) {
        setWindowState((previous) => ({
          before: previous.before,
          after: previous.after + DAY_WINDOW_STEP,
        }));
      }
    },
    [],
  );

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-[var(--muted)]">Loading timeline...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg)]">
      <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-h-0 flex-col border-r border-[var(--panel-border)]">
          <header className="border-b border-[var(--panel-border)] bg-[var(--panel)] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-[var(--text)]">Timeline</h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Full-day study view from midnight to midnight, anchored to today by default and ready for manual logging.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    shouldScrollToAnchorRef.current = true;
                    router.push("/timeline");
                  }}
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--panel-border)] px-3 py-2 text-sm text-[var(--text)]"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Jump to Today
                </button>
                <span className="inline-flex items-center gap-2 rounded-md border border-[var(--panel-border)] px-3 py-2 text-sm text-[var(--muted)]">
                  <CalendarDays className="h-4 w-4" />
                  {TIMELINE_PLAN_RANGE.start} to {TIMELINE_PLAN_RANGE.end}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))]">
              <div className="rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-4 py-3">
                <div className="text-xs text-[var(--muted)]">Focus Day</div>
                <div className="mt-1 text-lg font-semibold text-[var(--text)]">{focusDayPlan.dayLabel}</div>
                <div className="mt-2 text-sm text-[var(--muted)]">
                  Planned {formatHoursFromMinutes(focusPlannedMinutes)} · Actual {formatHoursFromMinutes(focusActualMinutes)}
                </div>
                <div className="mt-3 h-2 rounded-full bg-[var(--panel-border)]">
                  <div
                    className="h-full rounded-full bg-[var(--focus)]"
                    style={{ width: `${Math.round(focusCompletionRatio * 100)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-4 py-3">
                <div className="text-xs text-[var(--muted)]">Understanding</div>
                <div className="mt-2 text-sm leading-6 text-[var(--text)]">
                  {focusDayPlan.checknotes.understanding || "No hardcoded understanding target for this day."}
                </div>
              </div>

              <div className="rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-4 py-3">
                <div className="text-xs text-[var(--muted)]">Done Looks Like</div>
                <div className="mt-2 text-sm leading-6 text-[var(--text)]">
                  {focusDayPlan.checknotes.doneLooksLike || "No hardcoded completion note for this day."}
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[var(--muted)]">
                    <th className="border-b border-[var(--panel-border)] px-3 py-2 font-medium">Subject</th>
                    <th className="border-b border-[var(--panel-border)] px-3 py-2 font-medium">Planned</th>
                    <th className="border-b border-[var(--panel-border)] px-3 py-2 font-medium">Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {SUBJECTS.map((subject) => (
                    <tr key={subject.id}>
                      <td className="border-b border-[var(--panel-border)] px-3 py-2 text-[var(--text)]">
                        {subject.name}
                      </td>
                      <td className="border-b border-[var(--panel-border)] px-3 py-2 text-[var(--muted)]">
                        {formatHoursFromMinutes(plannedSubjectMinutes[subject.id])}
                      </td>
                      <td className="border-b border-[var(--panel-border)] px-3 py-2 text-[var(--muted)]">
                        {formatHoursFromMinutes(Math.round(subjectTotals[subject.id] / 60))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </header>

          <div ref={scrollRef} onScroll={handleTimelineScroll} className="min-h-0 flex-1 overflow-y-auto">
            {visibleDayPlans.map((dayPlan) => (
              <DayTimelineSection
                key={dayPlan.date}
                dayPlan={dayPlan}
                isToday={dayPlan.date === todayDate}
                currentMinute={new Date(nowMs).getHours() * 60 + new Date(nowMs).getMinutes()}
                progressByBlockId={progressByBlockId}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
              />
            ))}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto bg-[var(--panel)] p-4">
          <TimelineInspector
            selectedEntry={selectedEntry}
            progress={selectedProgress}
            editorState={editorState}
            saving={savingBlockId === selectedEntry?.id}
            onChangeState={handleStateChange}
            onChangeMinutes={(value) =>
              setEditorState((current) => (current ? { ...current, actualMinutes: value } : current))
            }
            onCommitMinutes={handleMinutesCommit}
            onChangeSubject={handleSubjectCommit}
            onChangeNote={(value) =>
              setEditorState((current) => (current ? { ...current, note: value } : current))
            }
            onCommitNote={handleNoteCommit}
          />
        </div>
      </div>
    </div>
  );
}
