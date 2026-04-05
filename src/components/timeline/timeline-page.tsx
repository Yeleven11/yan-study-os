"use client";

import {
  startTransition,
  type FormEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckSquare,
  Circle,
  Clock3,
  Minus,
  PanelLeftOpen,
  Plus,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { haptic, supportsHaptics } from "ios-haptics";
import { useRouter, useSearchParams } from "next/navigation";
import { toDateKeyInTimezone } from "@/components/study-dashboard/selectors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ScrollArea,
} from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { createDashboardRepository } from "@/lib/client/repository";
import { SUBJECT_BY_ID, SUBJECTS } from "@/lib/constants";
import { buildDayAggregates, buildSubjectTotals, formatDuration } from "@/lib/dashboard-utils";
import {
  buildTimelineInspectorContent,
  buildTimelineDateWindow,
  getTimelineEntry,
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
import { cn } from "@/lib/utils";

const TIMELINE_TIMEZONE = "Europe/Berlin";
const DAY_WINDOW_BEFORE = 3;
const DAY_WINDOW_AFTER = 5;
const DAY_WINDOW_STEP = 3;
const DAY_HEADER_HEIGHT = 44;
const HOUR_LABEL_WIDTH = 72;
const DEFAULT_HOUR_HEIGHT = 60;
const MIN_HOUR_HEIGHT = 40;
const MAX_HOUR_HEIGHT = 96;
const ZOOM_STORAGE_KEY = "yan-study-os:timeline-hour-height:v2";
const PLANNED_SUBJECT_VALUE = "__planned_subject__";

type AuthStatus = "checking" | "signedOut" | "signedIn";
type DashboardSessionMode = "full" | "demo";

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

type ScrollRequest = {
  behavior: ScrollBehavior;
  date: string;
  key: number;
};

type EntryPalette = {
  accent: string;
  border: string;
  meta: string;
  surface: string;
};

type InspectorContent = ReturnType<typeof buildTimelineInspectorContent>;

type SessionResponse = {
  authenticated: boolean;
  expiresAt?: string;
  issuedAt?: string;
  mode?: DashboardSessionMode;
};

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

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatch = () => setMatches(mediaQuery.matches);

    updateMatch();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateMatch);
      return () => mediaQuery.removeEventListener("change", updateMatch);
    }

    mediaQuery.addListener(updateMatch);
    return () => mediaQuery.removeListener(updateMatch);
  }, [query]);

  return matches;
}

function clampHourHeight(value: number): number {
  return Math.max(MIN_HOUR_HEIGHT, Math.min(MAX_HOUR_HEIGHT, Math.round(value)));
}

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

function getTouchDistance(touches: TouchList): number {
  if (touches.length < 2) {
    return 0;
  }

  const first = touches[0];
  const second = touches[1];
  const x = second.clientX - first.clientX;
  const y = second.clientY - first.clientY;
  return Math.hypot(x, y);
}

function isDateKey(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function getTodayDateKey(now = new Date()): string {
  return toDateKeyInTimezone(now, TIMELINE_TIMEZONE, 0);
}

function getCurrentMinuteInTimezone(now = new Date()): number {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: TIMELINE_TIMEZONE,
  });

  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return hour * 60 + minute;
}

function getEntryPalette(entry: TimelineEntry): EntryPalette {
  if (entry.kind === "study" && entry.subjectId) {
    const accent = SUBJECT_BY_ID[entry.subjectId].color;
    return {
      accent,
      border: `${accent}44`,
      meta: `${accent}cc`,
      surface: `${accent}16`,
    };
  }

  if (entry.kind === "exam") {
    return {
      accent: "#fca5a5",
      border: "rgba(252, 165, 165, 0.38)",
      meta: "#fca5a5",
      surface: "rgba(127, 29, 29, 0.42)",
    };
  }

  if (entry.kind === "sleep") {
    return {
      accent: "#64748b",
      border: "rgba(71, 85, 105, 0.4)",
      meta: "#94a3b8",
      surface: "rgba(15, 23, 42, 0.7)",
    };
  }

  if (entry.kind === "outside") {
    return {
      accent: "#34d399",
      border: "rgba(52, 211, 153, 0.3)",
      meta: "#86efac",
      surface: "rgba(6, 78, 59, 0.28)",
    };
  }

  if (entry.kind === "meal") {
    return {
      accent: "#cbd5e1",
      border: "rgba(148, 163, 184, 0.26)",
      meta: "#cbd5e1",
      surface: "rgba(15, 23, 42, 0.36)",
    };
  }

  return {
    accent: "#cbd5e1",
    border: "rgba(148, 163, 184, 0.24)",
    meta: "#cbd5e1",
    surface: "rgba(15, 23, 42, 0.32)",
  };
}

function getEntryLabel(entry: TimelineEntry): string {
  if (entry.subjectId) {
    return SUBJECT_BY_ID[entry.subjectId].shortName;
  }

  if (entry.kind === "sleep") return "Sleep";
  if (entry.kind === "meal") return "Meal";
  if (entry.kind === "outside") return "Outside";
  if (entry.kind === "exam") return "Exam";
  if (entry.kind === "setup") return "Setup";
  if (entry.kind === "winddown") return "Wind down";
  if (entry.kind === "admin") return "Admin";
  return "Block";
}

function getStatusColor(state: TimelineBlockState | undefined): string {
  if (state === "completed") {
    return "var(--success)";
  }

  if (state === "incomplete") {
    return "var(--danger)";
  }

  return "var(--muted)";
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

function buildDefaultEditorState(
  entry: TimelineEntry,
  progress?: TimelineBlockProgress,
): TimelineEditorState {
  const actualMinutes =
    typeof progress?.actualMinutes === "number" && Number.isFinite(progress.actualMinutes)
      ? String(progress.actualMinutes)
      : "";

  return {
    actualMinutes,
    actualSubjectId: progress?.actualSubjectId || "",
    blockId: entry.id,
    note: progress?.note || "",
    state: progress?.state || "pending",
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
    actualMinutes,
    actualSubjectId,
    blockId: editorState.blockId,
    note: note.length > 0 ? note : undefined,
    state: editorState.state,
    updatedAt: new Date().toISOString(),
  };
}

function buildProgressMap(progressList: TimelineBlockProgress[] | undefined): Map<string, TimelineBlockProgress> {
  return new Map((progressList ?? []).map((item) => [item.blockId, item]));
}

function TimelineOverviewSheet({
  focusActualMinutes,
  focusDayPlan,
  focusPlannedMinutes,
  plannedSubjectMinutes,
  subjectTotals,
}: {
  focusActualMinutes: number;
  focusDayPlan: TimelineDayPlan;
  focusPlannedMinutes: number;
  plannedSubjectMinutes: Record<SubjectId, number>;
  subjectTotals: Record<SubjectId, number>;
}) {
  const completionRatio =
    focusPlannedMinutes > 0 ? Math.min(1, focusActualMinutes / focusPlannedMinutes) : 0;

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <PanelLeftOpen data-icon="inline-start" />
        Overview
      </SheetTrigger>
      <SheetContent
        side="left"
        className="gap-0 border-[var(--panel-border)] bg-[var(--panel)] p-0 text-[var(--text)] data-[side=left]:w-[360px] data-[side=left]:sm:max-w-[360px]"
      >
        <SheetHeader className="border-b border-[var(--panel-border)]">
          <SheetTitle>Study overview</SheetTitle>
          <SheetDescription>
            Planned and logged hours for {focusDayPlan.dayLabel.toLowerCase()}.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-5 p-4">
            <section className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-[var(--text)]">{focusDayPlan.dayLabel}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    Plan window {TIMELINE_PLAN_RANGE.start} to {TIMELINE_PLAN_RANGE.end}
                  </div>
                </div>
                <div className="text-right text-xs text-[var(--muted)]">
                  {Math.round(completionRatio * 100)}% of planned
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2">
                  <div className="text-[11px] text-[var(--muted)]">Planned</div>
                  <div className="mt-1 text-base font-medium text-[var(--text)]">
                    {formatHoursFromMinutes(focusPlannedMinutes)}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2">
                  <div className="text-[11px] text-[var(--muted)]">Logged</div>
                  <div className="mt-1 text-base font-medium text-[var(--text)]">
                    {formatHoursFromMinutes(focusActualMinutes)}
                  </div>
                </div>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--panel-border)]">
                <div
                  className="h-full rounded-full bg-[var(--focus)]"
                  style={{ width: `${Math.round(completionRatio * 100)}%` }}
                />
              </div>
            </section>

            <Separator />

            <section className="flex flex-col gap-3">
              <div className="text-sm font-medium text-[var(--text)]">Daily notes</div>
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-3">
                  <div className="text-[11px] text-[var(--muted)]">Understanding</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text)]">
                    {focusDayPlan.checknotes.understanding ||
                      "No hardcoded understanding target for this day."}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-3">
                  <div className="text-[11px] text-[var(--muted)]">Done looks like</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text)]">
                    {focusDayPlan.checknotes.doneLooksLike ||
                      "No hardcoded completion note for this day."}
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-[var(--text)]">Subject totals</div>
                <div className="text-[11px] text-[var(--muted)]">Planned vs logged</div>
              </div>
              <div className="overflow-hidden rounded-lg border border-[var(--panel-border)] bg-[var(--bg)]">
                {SUBJECTS.map((subject) => (
                  <div
                    key={subject.id}
                    className="grid grid-cols-[minmax(0,1fr)_72px_72px] items-center gap-3 border-b border-[var(--panel-border)] px-3 py-2 last:border-b-0"
                  >
                    <div className="truncate text-sm text-[var(--text)]">{subject.name}</div>
                    <div className="text-right text-xs text-[var(--muted)]">
                      {formatHoursFromMinutes(plannedSubjectMinutes[subject.id])}
                    </div>
                    <div className="text-right text-xs text-[var(--muted)]">
                      {formatHoursFromMinutes(Math.round(subjectTotals[subject.id] / 60))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function TimelineInspector({
  className,
  editorState,
  inspectorContent,
  onChangeMinutes,
  onChangeNote,
  onChangeState,
  onChangeSubject,
  onCommitMinutes,
  onCommitNote,
  progress,
  saving,
  selectedEntry,
}: {
  className?: string;
  editorState: TimelineEditorState | null;
  inspectorContent: InspectorContent | null;
  onChangeMinutes: (value: string) => void;
  onChangeNote: (value: string) => void;
  onChangeState: (state: TimelineBlockState) => void;
  onChangeSubject: (value: string) => void;
  onCommitMinutes: () => void;
  onCommitNote: () => void;
  progress: TimelineBlockProgress | undefined;
  saving: boolean;
  selectedEntry: TimelineEntry | null;
}) {
  if (!selectedEntry) {
    return (
      <aside className={cn("flex h-full flex-col", className)}>
        <div className="border-b border-[var(--panel-border)] px-4 py-4">
          <div className="text-sm font-medium text-[var(--text)]">Block details</div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Select any block in the schedule to inspect the plan details for that time window.
          </p>
        </div>
      </aside>
    );
  }

  const actualMinutes = resolveTimelineProgressMinutes(selectedEntry, progress);
  const subjectOptions = selectedEntry.loggable
    ? [
        { label: "Use planned subject", value: PLANNED_SUBJECT_VALUE },
        ...SUBJECTS.map((subject) => ({ label: subject.name, value: subject.id })),
      ]
    : [];

  return (
    <aside className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="border-b border-[var(--panel-border)] px-4 py-4">
        <div className="text-sm font-medium text-[var(--text)]">Block details</div>
        <div className="mt-2 text-base font-medium text-[var(--text)]">{selectedEntry.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <span>{selectedEntry.date}</span>
          <span>{formatMinuteLabel(selectedEntry.startMinute)} - {formatMinuteLabel(selectedEntry.endMinute)}</span>
          <span>Planned {formatDuration(selectedEntry.plannedMinutes * 60)}</span>
          <span>{selectedEntry.loggable ? "Loggable" : "Informational"}</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-4 p-4">
          {inspectorContent ? (
            <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--bg)] px-4 py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Plan focus
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--text)]">
                {inspectorContent.summary}
              </p>
            </div>
          ) : null}

          {inspectorContent?.checklist.length ? (
            <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--bg)] px-4 py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Mini checklist
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {inspectorContent.checklist.map((item, index) => (
                  <div key={`${selectedEntry.id}-check-${index}`} className="flex items-start gap-2 text-sm text-[var(--text)]">
                    <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--focus)]" />
                    <span className="leading-6">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {inspectorContent?.successCriteria.length ? (
            <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--bg)] px-4 py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Done looks like
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {inspectorContent.successCriteria.map((item, index) => (
                  <div
                    key={`${selectedEntry.id}-success-${index}`}
                    className="flex items-start gap-2 text-sm text-[var(--text)]"
                  >
                    <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--success)]" />
                    <span className="leading-6">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {inspectorContent?.whyThisMatters ? (
            <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--bg)] px-4 py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Why this matters
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--text)]">
                {inspectorContent.whyThisMatters}
              </p>
            </div>
          ) : null}

          {inspectorContent?.prompt ? (
            <div className="rounded-xl border border-[var(--focus)]/25 bg-[var(--focus)]/10 px-4 py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                {inspectorContent.prompt.label}
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--text)]">
                {inspectorContent.prompt.value}
              </p>
            </div>
          ) : null}

          {inspectorContent?.rewardPrompt ? (
            <div className="rounded-xl border border-[var(--success)]/20 bg-[var(--success)]/10 px-4 py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Completion line
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--text)]">
                {inspectorContent.rewardPrompt}
              </p>
            </div>
          ) : null}

          {inspectorContent?.context.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {inspectorContent.context.map((item) => (
                <div
                  key={`${selectedEntry.id}-${item.label}`}
                  className="rounded-xl border border-[var(--panel-border)] bg-[var(--bg)] px-4 py-4"
                >
                  <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                    {item.label}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--text)]">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {inspectorContent?.originalPlan ? (
            <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--bg)] px-4 py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Original plan wording
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {inspectorContent.originalPlan}
              </p>
            </div>
          ) : null}

          {!selectedEntry.loggable ? (
            <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--bg)] px-4 py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Logging
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {inspectorContent?.readOnlyMessage ||
                  "This block is informational only and does not take manual progress updates."}
              </p>
            </div>
          ) : null}

          {selectedEntry.loggable && editorState ? (
            <>
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-medium text-[var(--muted)]">Status</div>
                <ToggleGroup
                  className="w-full"
                  onValueChange={(value) => {
                    const nextState = value[0] as TimelineBlockState | undefined;
                    if (nextState) {
                      onChangeState(nextState);
                    }
                  }}
                  value={[editorState.state]}
                  variant="outline"
                >
                  <ToggleGroupItem
                    aria-label="Pending"
                    className="flex-1 justify-center"
                    value="pending"
                  >
                    <Circle data-icon="inline-start" />
                    Pending
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    aria-label="Completed"
                    className="flex-1 justify-center"
                    value="completed"
                  >
                    <CheckSquare data-icon="inline-start" />
                    Done
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    aria-label="Incomplete"
                    className="flex-1 justify-center"
                    value="incomplete"
                  >
                    <XCircle data-icon="inline-start" />
                    Missed
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-medium text-[var(--muted)]">Actual minutes studied</div>
                <Input
                  inputMode="numeric"
                  onBlur={onCommitMinutes}
                  onChange={(event) => onChangeMinutes(event.target.value)}
                  placeholder={String(selectedEntry.plannedMinutes)}
                  type="number"
                  value={editorState.actualMinutes}
                />
                <div className="text-xs text-[var(--muted)]">
                  Saved total: {formatDuration(actualMinutes * 60)}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-medium text-[var(--muted)]">Subject</div>
                <Select
                  items={subjectOptions}
                  onValueChange={(value) =>
                    onChangeSubject(
                      value && value !== PLANNED_SUBJECT_VALUE ? String(value) : "",
                    )
                  }
                  value={editorState.actualSubjectId || PLANNED_SUBJECT_VALUE}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Use planned subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {subjectOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-medium text-[var(--muted)]">Note / reflection</div>
                <Textarea
                  className="min-h-28"
                  onBlur={onCommitNote}
                  onChange={(event) => onChangeNote(event.target.value)}
                  placeholder={inspectorContent?.prompt?.value || "What happened in this block?"}
                  value={editorState.note}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <Clock3 className="h-3.5 w-3.5" />
                {saving ? "Saving progress..." : "Changes save to your account-backed timeline progress."}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function DayTimelineSection({
  compact,
  currentMinute,
  dayActualMinutes,
  dayPlan,
  hourHeight,
  hourLabelWidth,
  isToday,
  onSelectBlock,
  progressByBlockId,
  selectedBlockId,
}: {
  compact: boolean;
  currentMinute: number;
  dayActualMinutes: number;
  dayPlan: TimelineDayPlan;
  hourHeight: number;
  hourLabelWidth: number;
  isToday: boolean;
  onSelectBlock: (blockId: string) => void;
  progressByBlockId: Map<string, TimelineBlockProgress>;
  selectedBlockId: string | null;
}) {
  const minuteHeight = hourHeight / 60;
  const dayGridHeight = hourHeight * 24;
  const showEmptyState = dayPlan.entries.length === 0;

  return (
    <section
      className="relative border-b border-[var(--panel-border)] bg-[var(--panel)]"
      data-day={dayPlan.date}
      style={{ height: DAY_HEADER_HEIGHT + dayGridHeight }}
    >
      <header className="sticky top-0 z-20 flex h-[44px] items-center justify-between border-b border-[var(--panel-border)] bg-[var(--panel)] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="truncate text-sm font-medium text-[var(--text)]">{dayPlan.dayLabel}</div>
          {isToday ? (
            <span className="rounded-md border border-[var(--warning)]/35 px-1.5 py-0.5 text-[10px] font-medium text-[var(--warning)]">
              Today
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3 text-xs text-[var(--muted)]">
          <span>Planned {formatHoursFromMinutes(dayPlan.focusedMinutes)}</span>
          <span>Logged {formatHoursFromMinutes(dayActualMinutes)}</span>
        </div>
      </header>

      <div className="flex" style={{ height: dayGridHeight }}>
        <div
          className="shrink-0 border-r border-[var(--panel-border)] bg-[var(--panel)]"
          style={{ width: hourLabelWidth }}
        >
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={`${dayPlan.date}-hour-${hour}`}
              className="border-b border-[var(--panel-border)] px-3 pt-1 text-[11px] text-[var(--muted)]"
              style={{ height: hourHeight }}
            >
              {formatHourLabel(hour)}
            </div>
          ))}
        </div>

        <div className="relative flex-1 bg-[var(--bg)]">
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={`${dayPlan.date}-major-${hour}`}
              className="absolute inset-x-0 border-b border-[var(--panel-border)]"
              style={{ top: hour * hourHeight }}
            />
          ))}

          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={`${dayPlan.date}-minor-${hour}`}
              className="absolute inset-x-0 border-b border-dashed border-white/[0.04]"
              style={{ top: hour * hourHeight + hourHeight / 2 }}
            />
          ))}

          {showEmptyState ? (
            <div className="absolute inset-x-6 top-14 rounded-lg border border-dashed border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--muted)]">
              No hardcoded plan for this day. The timeline stays scrollable so you can jump across dates without hitting a hard stop.
            </div>
          ) : null}

          {dayPlan.entries.map((entry) => {
            const top = entry.startMinute * minuteHeight;
            const height = Math.max(28, entry.plannedMinutes * minuteHeight);
            const mode = height < 44 ? "compact" : height < 84 ? "balanced" : "detailed";
            const palette = getEntryPalette(entry);
            const progress = progressByBlockId.get(entry.id);
            const loggedMinutes = resolveTimelineProgressMinutes(entry, progress);
            const durationLabel =
              entry.loggable && progress && (progress.state !== "pending" || loggedMinutes > 0)
                ? `${formatDuration(loggedMinutes * 60)} logged`
                : formatDuration(entry.plannedMinutes * 60);
            const StatusIcon = getStatusIcon(progress?.state);
            const active = selectedBlockId === entry.id;
            const content = (
              <div className="flex h-full flex-col gap-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] leading-4">
                      <span
                        className="font-medium uppercase tracking-[0.08em]"
                        style={{ color: palette.meta }}
                      >
                        {getEntryLabel(entry)}
                      </span>
                      <span className="text-[var(--muted)]">
                        {formatMinuteLabel(entry.startMinute)} - {formatMinuteLabel(entry.endMinute)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "truncate font-medium text-[var(--text)]",
                        mode === "compact" ? "text-[12px]" : "text-sm",
                      )}
                    >
                      {entry.title}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {entry.loggable ? (
                      <StatusIcon
                        className="h-4 w-4 shrink-0"
                        style={{ color: getStatusColor(progress?.state) }}
                      />
                    ) : null}
                    <span className="text-[10px] text-[var(--muted)]">{durationLabel}</span>
                  </div>
                </div>

                {mode !== "compact" && entry.detail ? (
                  <p
                    className={cn(
                      "text-[11px] leading-4 text-[var(--muted)]",
                      mode === "balanced" ? "line-clamp-1" : "line-clamp-2",
                    )}
                  >
                    {entry.detail}
                  </p>
                ) : null}
              </div>
            );

            const commonProps = {
              className: cn(
                "absolute overflow-hidden rounded-lg border px-3 py-2 text-left transition-[transform,border-color,background-color] duration-100 active:scale-[0.985]",
                compact ? "left-2 right-2" : "left-3 right-4",
                "cursor-pointer hover:border-white/20",
                active && "ring-2 ring-[var(--focus)]/70",
              ),
              style: {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                boxShadow: `inset 3px 0 0 ${palette.accent}`,
                height,
                top,
              },
            };

            return (
              <button
                key={entry.id}
                type="button"
                {...commonProps}
                onClick={() => onSelectBlock(entry.id)}
              >
                {content}
              </button>
            );
          })}

          {isToday ? (
            <div
              className="pointer-events-none absolute inset-x-0 z-10 border-t border-[var(--warning)]"
              style={{ top: currentMinute * minuteHeight }}
            >
              <span className="absolute left-2 top-[-10px] rounded bg-[var(--warning)] px-1.5 py-0.5 text-[10px] font-medium text-[#111827]">
                Now {formatMinuteLabel(currentMinute)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function TimelinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedDateParam = searchParams.get("date");
  const requestedDate = isDateKey(requestedDateParam) ? requestedDateParam : null;
  const [sessionMode, setSessionMode] = useState<DashboardSessionMode>("full");
  const repository = useMemo(
    () => createDashboardRepository({ sessionMode }),
    [sessionMode],
  );
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardBootstrap | null>(null);
  const [hourHeight, setHourHeight] = useState(DEFAULT_HOUR_HEIGHT);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<TimelineEditorState | null>(null);
  const [savingBlockId, setSavingBlockId] = useState<string | null>(null);
  const [windowState, setWindowState] = useState<DateWindowState>({
    after: DAY_WINDOW_AFTER,
    before: DAY_WINDOW_BEFORE,
  });
  const [narrowInspectorOpen, setNarrowInspectorOpen] = useState(false);
  const [scrollRequest, setScrollRequest] = useState<ScrollRequest>({
    behavior: "auto",
    date: getTodayDateKey(),
    key: 0,
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const hourHeightRef = useRef(hourHeight);
  const prependAdjustmentRef = useRef(0);
  const handledScrollRequestRef = useRef(-1);
  const initialAnchorScrollRef = useRef<string | null>(null);
  const jumpToTodayPendingRef = useRef(false);
  const pinchStateRef = useRef<{ initialDistance: number; initialHourHeight: number } | null>(null);
  const isPhoneViewport = useMediaQuery("(max-width: 767px)");
  const usesSheetInspector = useMediaQuery("(max-width: 1023px)");

  const todayDate = useMemo(() => getTodayDateKey(new Date(nowMs)), [nowMs]);
  const currentMinute = useMemo(() => getCurrentMinuteInTimezone(new Date(nowMs)), [nowMs]);
  const anchorDate = requestedDate || todayDate;
  const hourLabelWidth = isPhoneViewport ? 56 : HOUR_LABEL_WIDTH;

  const minuteHeight = hourHeight / 60;
  const daySectionHeight = DAY_HEADER_HEIGHT + hourHeight * 24;

  const playTapHaptic = useCallback(() => {
    if (!supportsHaptics) {
      return;
    }

    haptic();
  }, []);

  const playConfirmHaptic = useCallback(() => {
    if (!supportsHaptics) {
      return;
    }

    haptic.confirm();
  }, []);

  const queueScrollToDate = useCallback((date: string, behavior: ScrollBehavior) => {
    setScrollRequest((previous) => ({
      behavior,
      date,
      key: previous.key + 1,
    }));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    hourHeightRef.current = hourHeight;
  }, [hourHeight]);

  useEffect(() => {
    let isMounted = true;

    request<SessionResponse>("/api/auth/session")
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setAuthStatus(payload.authenticated ? "signedIn" : "signedOut");
        setSessionMode(payload.authenticated && payload.mode === "demo" ? "demo" : "full");
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
    if (authStatus !== "signedIn") {
      setLoading(false);
      if (authStatus === "signedOut") {
        setData(null);
      }
      return;
    }

    let cancelled = false;
    setLoading(true);

    repository.getBootstrap()
      .then((bootstrap) => {
        if (cancelled) {
          return;
        }

        setData(bootstrap);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setLoading(false);
        setData(null);

        if (error instanceof Error && /unauthorized/i.test(error.message)) {
          setAuthStatus("signedOut");
          setAuthError(null);
          return;
        }

        setAuthError(error instanceof Error ? error.message : "Unable to load timeline.");
      });

    return () => {
      cancelled = true;
    };
  }, [authStatus, repository]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ZOOM_STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = Number.parseInt(stored, 10);
      if (Number.isFinite(parsed)) {
        setHourHeight(clampHourHeight(parsed));
      }
    } catch {
      // Ignore local storage availability issues.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(ZOOM_STORAGE_KEY, String(hourHeight));
    } catch {
      // Ignore local storage availability issues.
    }
  }, [hourHeight]);

  useEffect(() => {
    setWindowState({
      after: DAY_WINDOW_AFTER,
      before: DAY_WINDOW_BEFORE,
    });
    setSelectedBlockId(null);
    queueScrollToDate(
      anchorDate,
      jumpToTodayPendingRef.current && anchorDate === todayDate ? "smooth" : "auto",
    );
    if (anchorDate === todayDate) {
      jumpToTodayPendingRef.current = false;
    }
    initialAnchorScrollRef.current = null;
  }, [anchorDate, queueScrollToDate, todayDate]);

  useEffect(() => {
    if (loading || !data || initialAnchorScrollRef.current === anchorDate) {
      return;
    }

    initialAnchorScrollRef.current = anchorDate;
    queueScrollToDate(anchorDate, "auto");
  }, [anchorDate, data, loading, queueScrollToDate]);

  useEffect(() => {
    if (!usesSheetInspector) {
      setNarrowInspectorOpen(false);
    }
  }, [usesSheetInspector]);

  useEffect(() => {
    if (!isPhoneViewport || !scrollRef.current) {
      return;
    }

    const element = scrollRef.current;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) {
        return;
      }

      pinchStateRef.current = {
        initialDistance: getTouchDistance(event.touches),
        initialHourHeight: hourHeightRef.current,
      };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!pinchStateRef.current || event.touches.length !== 2) {
        return;
      }

      const distance = getTouchDistance(event.touches);
      if (distance <= 0 || pinchStateRef.current.initialDistance <= 0) {
        return;
      }

      event.preventDefault();

      const scale = distance / pinchStateRef.current.initialDistance;
      const nextHourHeight = clampHourHeight(
        pinchStateRef.current.initialHourHeight * scale,
      );

      if (nextHourHeight !== hourHeightRef.current) {
        setHourHeight(nextHourHeight);
      }
    };

    const handleTouchEnd = () => {
      pinchStateRef.current = null;
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd);
    element.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isPhoneViewport]);

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

  const selectedEntry = selectedBlockId ? getTimelineEntry(selectedBlockId) || null : null;
  const selectedProgress =
    selectedEntry?.loggable && selectedBlockId ? progressByBlockId.get(selectedBlockId) : undefined;
  const selectedDayPlan = useMemo(
    () => (selectedEntry ? getTimelineDayOrShell(selectedEntry.date) : null),
    [selectedEntry],
  );
  const inspectorContent = useMemo(
    () => (selectedEntry && selectedDayPlan ? buildTimelineInspectorContent(selectedEntry, selectedDayPlan) : null),
    [selectedDayPlan, selectedEntry],
  );

  useEffect(() => {
    if (selectedEntry) {
      return;
    }

    const firstLoggable =
      focusDayPlan.entries.find((entry) => entry.loggable) ||
      visibleDayPlans.flatMap((dayPlan) => dayPlan.entries).find((entry) => entry.loggable) ||
      null;

    setSelectedBlockId(firstLoggable?.id || null);
  }, [focusDayPlan.entries, selectedEntry, visibleDayPlans]);

  useEffect(() => {
    if (!selectedEntry || !selectedEntry.loggable) {
      setEditorState(null);
      return;
    }

    setEditorState(buildDefaultEditorState(selectedEntry, selectedProgress));
  }, [selectedEntry, selectedProgress]);

  useLayoutEffect(() => {
    if (!scrollRef.current || prependAdjustmentRef.current === 0) {
      return;
    }

    scrollRef.current.scrollTop += prependAdjustmentRef.current;
    prependAdjustmentRef.current = 0;
  }, [daySectionHeight, visibleDates.length]);

  useLayoutEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    if (handledScrollRequestRef.current === scrollRequest.key) {
      return;
    }

    const dayIndex = visibleDates.indexOf(scrollRequest.date);
    if (dayIndex === -1) {
      return;
    }

    const targetDayPlan = visibleDayPlans[dayIndex];
    const targetMinute =
      scrollRequest.date === todayDate
        ? currentMinute
        : targetDayPlan.entries[0]?.startMinute ?? 8 * 60;
    const topOffset =
      dayIndex * daySectionHeight + DAY_HEADER_HEIGHT + targetMinute * minuteHeight - 160;

    scrollRef.current.scrollTo({
      behavior: scrollRequest.behavior,
      top: Math.max(0, topOffset),
    });
    handledScrollRequestRef.current = scrollRequest.key;
  }, [
    currentMinute,
    daySectionHeight,
    minuteHeight,
    scrollRequest,
    todayDate,
    visibleDates,
    visibleDayPlans,
  ]);

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
            (left, right) =>
              new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime(),
          );

          return {
            ...previous,
            timelineProgress: nextTimelineProgress,
          };
        });
      });

      try {
        await repository.upsertTimelineProgress(nextProgress);
      } finally {
        setSavingBlockId((current) => (current === nextProgress.blockId ? null : current));
      }
    },
    [repository],
  );

  const handleStateChange = useCallback(
    (nextState: TimelineBlockState) => {
      if (!selectedEntry || !editorState) {
        return;
      }

      const nextEditorState: TimelineEditorState = {
        ...editorState,
        actualMinutes:
          nextState === "completed" && editorState.actualMinutes.trim().length === 0
            ? String(selectedEntry.plannedMinutes)
            : editorState.actualMinutes,
        state: nextState,
      };

      setEditorState(nextEditorState);
      if (nextState === "completed") {
        playConfirmHaptic();
      } else {
        playTapHaptic();
      }
      void commitProgress(serializeEditorState(selectedEntry, nextEditorState));
    },
    [commitProgress, editorState, playConfirmHaptic, playTapHaptic, selectedEntry],
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

      if (currentTarget.scrollTop < daySectionHeight * 1.5) {
        prependAdjustmentRef.current += DAY_WINDOW_STEP * daySectionHeight;
        setWindowState((previous) => ({
          after: previous.after,
          before: previous.before + DAY_WINDOW_STEP,
        }));
      }

      if (remainingBottom < daySectionHeight * 1.5) {
        setWindowState((previous) => ({
          after: previous.after + DAY_WINDOW_STEP,
          before: previous.before,
        }));
      }
    },
    [daySectionHeight],
  );

  const handleJumpToToday = useCallback(() => {
    playTapHaptic();
    setSelectedBlockId(null);
    setWindowState({
      after: DAY_WINDOW_AFTER,
      before: DAY_WINDOW_BEFORE,
    });
    queueScrollToDate(todayDate, "smooth");

    if (requestedDate) {
      jumpToTodayPendingRef.current = true;
      router.replace("/timeline", { scroll: false });
      return;
    }
  }, [playTapHaptic, queueScrollToDate, requestedDate, router, todayDate]);

  const handleZoomChange = useCallback((nextValue: number | readonly number[]) => {
    const next = Array.isArray(nextValue) ? nextValue[0] : nextValue;
    if (!Number.isFinite(next)) {
      return;
    }

    setHourHeight(clampHourHeight(next));
  }, []);

  const applySessionResponse = useCallback((payload: SessionResponse) => {
    setAuthStatus(payload.authenticated ? "signedIn" : "signedOut");
    setSessionMode(payload.authenticated && payload.mode === "demo" ? "demo" : "full");
    if (payload.authenticated) {
      setAuthError(null);
    }
  }, []);

  const handleLogin = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setAuthError(null);

      try {
        await request<{ ok: true }>("/api/auth/login", {
          body: JSON.stringify({ passcode }),
          method: "POST",
        });
        const sessionPayload = await request<SessionResponse>("/api/auth/session");
        applySessionResponse(sessionPayload);
        setPasscode("");
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : "Unable to verify passcode.");
      }
    },
    [applySessionResponse, passcode],
  );

  const handleDemoLogin = useCallback(async () => {
    setAuthError(null);

    try {
      await request<{ ok: true; mode: "demo" }>("/api/auth/demo", {
        method: "POST",
      });
      const sessionPayload = await request<SessionResponse>("/api/auth/session");
      applySessionResponse(sessionPayload);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to open demo mode.");
    }
  }, [applySessionResponse]);

  const handleSelectBlock = useCallback(
    (blockId: string) => {
      playTapHaptic();
      setSelectedBlockId(blockId);
      if (usesSheetInspector) {
        setNarrowInspectorOpen(true);
      }
    },
    [playTapHaptic, usesSheetInspector],
  );

  if (authStatus === "checking") {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[var(--bg)]">
        <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] px-5 py-4 text-sm text-[var(--muted)]">
          Initializing timeline...
        </div>
      </div>
    );
  }

  if (authStatus === "signedOut") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg)] px-4 py-6 text-[var(--text)]">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 sm:p-6"
        >
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--focus)]">
            Yan Study OS
          </div>
          <h1 className="mt-3 text-xl font-semibold text-[var(--text)]">Secure entry</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Unlock the timeline with your passcode. On mobile this is now the default view.
          </p>
          <label className="mt-5 block text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Passcode
          </label>
          <Input
            autoComplete="current-password"
            className="mt-2 h-11 bg-[var(--bg)]"
            onChange={(event) => setPasscode(event.target.value)}
            type="password"
            value={passcode}
          />
          {authError ? (
            <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
              {authError}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col gap-2">
            <Button className="h-11 justify-center" type="submit">
              Unlock timeline
            </Button>
            <Button
              className="h-11 justify-center"
              onClick={handleDemoLogin}
              type="button"
              variant="outline"
            >
              Enter demo
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[var(--bg)]">
        <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] px-5 py-4 text-sm text-[var(--muted)]">
          {authError || "Loading timeline..."}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="flex min-h-0 flex-col">
          <header className="border-b border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-[var(--text)]">Timeline</div>
                  <div className="text-sm text-[var(--muted)]">{focusDayPlan.dayLabel}</div>
                </div>

                <Separator className="hidden h-8 md:block" orientation="vertical" />

                <div className="text-sm text-[var(--muted)]">
                  {focusPlannedMinutes > 0
                    ? `Planned ${formatHoursFromMinutes(focusPlannedMinutes)} · Logged ${formatHoursFromMinutes(focusActualMinutes)}`
                    : "Outside the hardcoded plan range"}
                </div>

                <div className="ml-auto hidden items-center gap-2 lg:flex">
                  <TimelineOverviewSheet
                    focusActualMinutes={focusActualMinutes}
                    focusDayPlan={focusDayPlan}
                    focusPlannedMinutes={focusPlannedMinutes}
                    plannedSubjectMinutes={plannedSubjectMinutes}
                    subjectTotals={subjectTotals}
                  />

                  <Separator className="hidden h-8 lg:block" orientation="vertical" />

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted)]">Zoom</span>
                    <Button
                      onClick={() => {
                        playTapHaptic();
                        setHourHeight((current) => clampHourHeight(current - 8));
                      }}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Minus />
                      <span className="sr-only">Zoom out</span>
                    </Button>
                    <div className="w-32">
                      <Slider
                        max={MAX_HOUR_HEIGHT}
                        min={MIN_HOUR_HEIGHT}
                        onValueChange={handleZoomChange}
                        step={4}
                        value={[hourHeight]}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        playTapHaptic();
                        setHourHeight((current) => clampHourHeight(current + 8));
                      }}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Plus />
                      <span className="sr-only">Zoom in</span>
                    </Button>
                  </div>

                  <Button onClick={handleJumpToToday} size="sm" type="button" variant="outline">
                    <RefreshCcw data-icon="inline-start" />
                    Jump to Today
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:hidden">
                <TimelineOverviewSheet
                  focusActualMinutes={focusActualMinutes}
                  focusDayPlan={focusDayPlan}
                  focusPlannedMinutes={focusPlannedMinutes}
                  plannedSubjectMinutes={plannedSubjectMinutes}
                  subjectTotals={subjectTotals}
                />

                <Button
                  disabled={!selectedEntry}
                  onClick={() => {
                    playTapHaptic();
                    setNarrowInspectorOpen(true);
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {selectedEntry ? "Block details" : "Select a block"}
                </Button>

                <Button onClick={handleJumpToToday} size="sm" type="button" variant="outline">
                  <RefreshCcw data-icon="inline-start" />
                  Today
                </Button>

                <div className="ml-auto flex items-center gap-1 rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] p-1">
                  <Button
                    onClick={() => {
                      playTapHaptic();
                      setHourHeight((current) => clampHourHeight(current - 8));
                    }}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Minus />
                    <span className="sr-only">Zoom out</span>
                  </Button>
                  <div className="px-2 text-xs text-[var(--muted)]">{hourHeight}px</div>
                  <Button
                    onClick={() => {
                      playTapHaptic();
                      setHourHeight((current) => clampHourHeight(current + 8));
                    }}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Plus />
                    <span className="sr-only">Zoom in</span>
                  </Button>
                </div>

                <div className="text-[11px] text-[var(--muted)]">Pinch to zoom</div>
              </div>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto"
            onScroll={handleTimelineScroll}
            style={{ touchAction: isPhoneViewport ? "pan-y" : undefined }}
          >
            {visibleDayPlans.map((dayPlan) => (
              <DayTimelineSection
                compact={isPhoneViewport}
                key={dayPlan.date}
                currentMinute={currentMinute}
                dayActualMinutes={Math.round((dayAggregates[dayPlan.date]?.totalSec ?? 0) / 60)}
                dayPlan={dayPlan}
                hourHeight={hourHeight}
                hourLabelWidth={hourLabelWidth}
                isToday={dayPlan.date === todayDate}
                onSelectBlock={handleSelectBlock}
                progressByBlockId={progressByBlockId}
                selectedBlockId={selectedBlockId}
              />
            ))}
          </div>
        </div>

        <div className="hidden min-h-0 flex-col border-l border-[var(--panel-border)] bg-[var(--panel)] lg:flex">
          <TimelineInspector
            editorState={editorState}
            inspectorContent={inspectorContent}
            onChangeMinutes={(value) =>
              setEditorState((current) => (current ? { ...current, actualMinutes: value } : current))
            }
            onChangeNote={(value) =>
              setEditorState((current) => (current ? { ...current, note: value } : current))
            }
            onChangeState={handleStateChange}
            onChangeSubject={handleSubjectCommit}
            onCommitMinutes={handleMinutesCommit}
            onCommitNote={handleNoteCommit}
            progress={selectedProgress}
            saving={savingBlockId === selectedEntry?.id}
            selectedEntry={selectedEntry}
          />
        </div>
      </div>

      {usesSheetInspector ? (
        <Sheet open={narrowInspectorOpen} onOpenChange={setNarrowInspectorOpen}>
          <SheetContent
            side="bottom"
            className="flex h-[82dvh] max-h-[82dvh] flex-col gap-0 overflow-hidden border-[var(--panel-border)] bg-[var(--panel)] p-0 text-[var(--text)] data-[side=bottom]:h-[82dvh] data-[side=bottom]:max-h-[82dvh]"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Block details</SheetTitle>
              <SheetDescription>Inspect or log the selected timeline block.</SheetDescription>
            </SheetHeader>
            <TimelineInspector
              className="min-h-0 flex-1"
              editorState={editorState}
              inspectorContent={inspectorContent}
              onChangeMinutes={(value) =>
                setEditorState((current) => (current ? { ...current, actualMinutes: value } : current))
              }
              onChangeNote={(value) =>
                setEditorState((current) => (current ? { ...current, note: value } : current))
              }
              onChangeState={handleStateChange}
              onChangeSubject={handleSubjectCommit}
              onCommitMinutes={handleMinutesCommit}
              onCommitNote={handleNoteCommit}
              progress={selectedProgress}
              saving={savingBlockId === selectedEntry?.id}
              selectedEntry={selectedEntry}
            />
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
