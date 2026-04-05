import { STARTER_EXAMS } from "@/lib/constants";
import type {
  Exam,
  StudySession,
  SubjectId,
  TimelineBlockProgress,
  TimelineDayPlan,
  TimelineEntry,
  TimelineEntryKind,
} from "@/lib/types";
import { RAW_TIMELINE_DAYS, type TimelineRawDay, type TimelineRawItem } from "./timeline-raw-plan";

const DAY_MINUTES = 24 * 60;
const DEFAULT_SLEEP_MINUTES = 9 * 60;
const DEFAULT_WAKE_MINUTE = 8 * 60;
const EARLIEST_WAKE_MINUTE = 6 * 60 + 45;
const BREAKFAST_DURATION = 30;
const LUNCH_DURATION = 45;
const OUTSIDE_DURATION = 30;
const DINNER_DURATION = 30;
const WINDDOWN_START_MINUTE = 21 * 60 + 30;
const SLOT_STEP_MINUTE = 15;
const SLOT_BUFFER_MINUTE = 10;

type RawMinuteRange = {
  startMinute: number;
  endMinute: number;
};

type TimelineDayMeta = {
  wakeMinute: number;
  sleepStartMinute: number;
};

const SUBJECT_PREFIXES: Array<[string, SubjectId]> = [
  ["Physics", "physics_hl"],
  ["Math", "math_aa_hl"],
  ["Business", "business_sl"],
  ["German", "german_lang_lit_sl"],
  ["English", "english_lang_lit_sl"],
  ["Computer Science", "computer_science_hl"],
];

const EXAM_DURATION_BY_ID: Record<string, number> = {
  "exam-german-sl-p1": 75,
  "exam-german-sl-p2": 105,
  "exam-physics-hl-p1": 120,
  "exam-physics-hl-p2": 150,
  "exam-business-sl-p1": 90,
  "exam-business-sl-p2": 90,
  "exam-cs-hl-p1": 130,
  "exam-cs-hl-p23": 140,
  "exam-english-sl-p1": 75,
  "exam-english-sl-p2": 105,
  "exam-math-aa-hl-p1": 120,
  "exam-math-aa-hl-p2": 120,
  "exam-math-aa-hl-p3": 75,
};

const PLANNED_SUBJECT_MINUTES: Record<SubjectId, number> = {
  german_lang_lit_sl: 18 * 60,
  physics_hl: 52.25 * 60,
  business_sl: 16.5 * 60,
  computer_science_hl: 12.25 * 60,
  english_lang_lit_sl: 15.5 * 60,
  math_aa_hl: 69.5 * 60,
};

function parseHourString(value: string): number {
  const match = value.match(/([\d.]+)\s*h/i);
  if (!match) {
    return 0;
  }

  return Math.round(Number.parseFloat(match[1]) * 60);
}

function parseClock(value: string): number {
  const [hoursString, minutesString] = value.split(":");
  const hours = Number(hoursString);
  const minutes = Number(minutesString);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
}

function toIsoMinute(dateKey: string, minute: number): string {
  const base = new Date(`${dateKey}T00:00:00+02:00`);
  base.setMinutes(base.getMinutes() + minute);
  return base.toISOString();
}

function addDays(dateKey: string, offset: number): string {
  const base = new Date(`${dateKey}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + offset);
  return base.toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function overlaps(
  startMinute: number,
  endMinute: number,
  entries: Array<{ startMinute: number; endMinute: number }>,
  bufferMinute = SLOT_BUFFER_MINUTE,
): boolean {
  return entries.some(
    (entry) =>
      startMinute < entry.endMinute + bufferMinute && endMinute > entry.startMinute - bufferMinute,
  );
}

function findNextAvailableSlot(
  entries: Array<{ startMinute: number; endMinute: number }>,
  preferredStartMinute: number,
  durationMinute: number,
  dayEndMinute = DAY_MINUTES,
): RawMinuteRange | null {
  for (
    let cursor = Math.max(0, preferredStartMinute);
    cursor + durationMinute <= dayEndMinute;
    cursor += SLOT_STEP_MINUTE
  ) {
    const candidateEnd = cursor + durationMinute;
    if (!overlaps(cursor, candidateEnd, entries)) {
      return { startMinute: cursor, endMinute: candidateEnd };
    }
  }

  return null;
}

function getFirstExplicitMinute(day: TimelineRawDay): number {
  let first = DEFAULT_WAKE_MINUTE + 90;

  for (const item of day.items) {
    const match = item.time.match(/(\d{2}:\d{2})/);
    if (!match) {
      continue;
    }
    first = Math.min(first, parseClock(match[1]));
  }

  return first;
}

function buildDayMeta(day: TimelineRawDay): TimelineDayMeta {
  const firstMinute = getFirstExplicitMinute(day);
  const wakeMinute = clamp(firstMinute - 65, EARLIEST_WAKE_MINUTE, DEFAULT_WAKE_MINUTE);
  const sleepStartMinute = clamp(wakeMinute + (DAY_MINUTES - DEFAULT_SLEEP_MINUTES), 21 * 60, 23 * 60);

  return {
    wakeMinute,
    sleepStartMinute,
  };
}

function getExamMatch(date: string, text: string): Exam | undefined {
  return STARTER_EXAMS.find((exam) => {
    if (!exam.startsAt.startsWith(date)) {
      return false;
    }

    if (text.includes(exam.paper)) {
      return true;
    }

    if (text.includes(exam.title)) {
      return true;
    }

    if (exam.id === "exam-cs-hl-p23" && text.includes("Paper 2 + Paper 3")) {
      return true;
    }

    return false;
  });
}

function getSubjectId(text: string): SubjectId | undefined {
  for (const [prefix, subjectId] of SUBJECT_PREFIXES) {
    if (text.startsWith(`${prefix}:`) || text.includes(prefix)) {
      return subjectId;
    }
  }

  return undefined;
}

function getKind(text: string): TimelineEntryKind {
  const lower = text.toLowerCase();

  if (lower.includes("(exam)")) {
    return "exam";
  }
  if (lower.includes("run") || lower.includes("walk") || lower.includes("outside")) {
    return "outside";
  }
  if (lower.includes("evening off") || lower.includes("fully off") || lower.includes("recovery")) {
    return "winddown";
  }
  if (lower.includes("setup") || lower.includes("admin")) {
    return "admin";
  }
  return "study";
}

function buildTitle(text: string, kind: TimelineEntryKind): string {
  if (kind === "exam") {
    return text.replace(/\s*\(exam\)\.?$/i, "").trim();
  }

  const [prefix, rest] = text.split(": ", 2);
  if (rest) {
    const [headline] = rest.split(". ");
    return headline.trim() || prefix.trim();
  }

  const [headline] = text.split(". ");
  return headline.trim();
}

function buildDetail(text: string, title: string): string | undefined {
  if (text === title) {
    return undefined;
  }

  if (text.startsWith(`${title}. `)) {
    return text.slice(title.length + 2).trim();
  }

  const colonIndex = text.indexOf(": ");
  if (colonIndex >= 0) {
    const rest = text.slice(colonIndex + 2).trim();
    if (rest.startsWith(`${title}. `)) {
      return rest.slice(title.length + 2).trim();
    }
    if (rest !== title) {
      return rest;
    }
  }

  return undefined;
}

function resolveRawRange(
  rawDay: TimelineRawDay,
  rawItem: TimelineRawItem,
  meta: TimelineDayMeta,
): RawMinuteRange {
  const rangeMatch = rawItem.time.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
  if (rangeMatch) {
    return {
      startMinute: parseClock(rangeMatch[1]),
      endMinute: parseClock(rangeMatch[2]),
    };
  }

  const singleMatch = rawItem.time.match(/^(\d{2}:\d{2})$/);
  if (singleMatch) {
    const startMinute = parseClock(singleMatch[1]);
    const exam = getExamMatch(rawDay.date, rawItem.text);
    const duration =
      (exam && EXAM_DURATION_BY_ID[exam.id]) ||
      (rawItem.text.toLowerCase().includes("(exam)") ? 120 : 30);
    return {
      startMinute,
      endMinute: Math.min(DAY_MINUTES, startMinute + duration),
    };
  }

  const onwardsMatch = rawItem.time.match(/^(\d{2}:\d{2}) onwards$/);
  if (onwardsMatch) {
    const startMinute = parseClock(onwardsMatch[1]);
    const explicitEndMatch = rawItem.text.match(/after (\d{2}:\d{2})/i);
    if (explicitEndMatch) {
      return {
        startMinute,
        endMinute: Math.min(DAY_MINUTES, parseClock(explicitEndMatch[1])),
      };
    }

    const kind = getKind(rawItem.text);
    if (kind === "winddown") {
      return {
        startMinute,
        endMinute: meta.sleepStartMinute,
      };
    }

    return {
      startMinute,
      endMinute: Math.min(DAY_MINUTES, startMinute + 120),
    };
  }

  return {
    startMinute: DEFAULT_WAKE_MINUTE,
    endMinute: DEFAULT_WAKE_MINUTE + 30,
  };
}

function createTimelineEntry(
  date: string,
  kind: TimelineEntryKind,
  title: string,
  detail: string | undefined,
  startMinute: number,
  endMinute: number,
  subjectId?: SubjectId,
  sourceText?: string,
): TimelineEntry {
  return {
    id: `${date}:${String(startMinute).padStart(4, "0")}:${kind}:${slugify(title)}`,
    date,
    kind,
    title,
    detail,
    subjectId,
    startMinute,
    endMinute,
    plannedMinutes: Math.max(0, endMinute - startMinute),
    loggable: kind === "study",
    sourceText,
  };
}

function buildExplicitEntries(rawDay: TimelineRawDay, meta: TimelineDayMeta): TimelineEntry[] {
  return rawDay.items.map((item) => {
    const kind = getKind(item.text);
    const range = resolveRawRange(rawDay, item, meta);
    const title = buildTitle(item.text, kind);
    const detail = buildDetail(item.text, title);
    return createTimelineEntry(
      rawDay.date,
      kind,
      title,
      detail,
      range.startMinute,
      range.endMinute,
      kind === "study" ? getSubjectId(item.text) : undefined,
      item.text,
    );
  });
}

function buildSupportEntries(
  rawDay: TimelineRawDay,
  meta: TimelineDayMeta,
  explicitEntries: TimelineEntry[],
): TimelineEntry[] {
  const supportEntries: TimelineEntry[] = [];
  const occupied = explicitEntries.map((entry) => ({
    startMinute: entry.startMinute,
    endMinute: entry.endMinute,
  }));

  supportEntries.push(
    createTimelineEntry(rawDay.date, "sleep", "Sleep", undefined, 0, meta.wakeMinute),
  );

  if (meta.sleepStartMinute < DAY_MINUTES) {
    supportEntries.push(
      createTimelineEntry(
        rawDay.date,
        "sleep",
        "Sleep",
        undefined,
        meta.sleepStartMinute,
        DAY_MINUTES,
      ),
    );
  }

  const breakfastSlot = findNextAvailableSlot(
    occupied,
    meta.wakeMinute + 15,
    BREAKFAST_DURATION,
    Math.min(DAY_MINUTES, getFirstExplicitMinute(rawDay)),
  );
  if (breakfastSlot) {
    const breakfast = createTimelineEntry(
      rawDay.date,
      "meal",
      "Breakfast",
      undefined,
      breakfastSlot.startMinute,
      breakfastSlot.endMinute,
    );
    supportEntries.push(breakfast);
    occupied.push(breakfastSlot);
  }

  const lunchSlot = findNextAvailableSlot(occupied, 12 * 60 + 15, LUNCH_DURATION);
  if (lunchSlot) {
    const lunch = createTimelineEntry(
      rawDay.date,
      "meal",
      "Lunch",
      undefined,
      lunchSlot.startMinute,
      lunchSlot.endMinute,
    );
    supportEntries.push(lunch);
    occupied.push(lunchSlot);

    const outsideSlot = findNextAvailableSlot(
      occupied,
      lunchSlot.endMinute,
      OUTSIDE_DURATION,
      Math.min(meta.sleepStartMinute, 18 * 60),
    );
    if (outsideSlot) {
      const outside = createTimelineEntry(
        rawDay.date,
        "outside",
        "Outside / daylight",
        undefined,
        outsideSlot.startMinute,
        outsideSlot.endMinute,
      );
      supportEntries.push(outside);
      occupied.push(outsideSlot);
    }
  }

  const dinnerSlot = findNextAvailableSlot(
    occupied,
    18 * 60 + 15,
    DINNER_DURATION,
    meta.sleepStartMinute,
  );
  if (dinnerSlot) {
    const dinner = createTimelineEntry(
      rawDay.date,
      "meal",
      "Dinner",
      undefined,
      dinnerSlot.startMinute,
      dinnerSlot.endMinute,
    );
    supportEntries.push(dinner);
    occupied.push(dinnerSlot);
  }

  if (meta.sleepStartMinute > WINDDOWN_START_MINUTE) {
    const winddown = createTimelineEntry(
      rawDay.date,
      "winddown",
      "Wind down",
      undefined,
      WINDDOWN_START_MINUTE,
      meta.sleepStartMinute,
    );

    if (!overlaps(winddown.startMinute, winddown.endMinute, occupied, 0)) {
      supportEntries.push(winddown);
    }
  }

  return supportEntries;
}

function buildPlanFromRaw(rawDay: TimelineRawDay): TimelineDayPlan {
  const meta = buildDayMeta(rawDay);
  const explicitEntries = buildExplicitEntries(rawDay, meta);
  const supportEntries = buildSupportEntries(rawDay, meta, explicitEntries);
  const entries = [...explicitEntries, ...supportEntries].sort(
    (left, right) => left.startMinute - right.startMinute || left.title.localeCompare(right.title),
  );

  return {
    date: rawDay.date,
    dayLabel: rawDay.dayLabel,
    focusedMinutes: parseHourString(rawDay.focusedHours),
    entries,
    checknotes: {
      understanding: rawDay.understanding,
      doneLooksLike: rawDay.doneLooksLike,
    },
  };
}

export const TIMELINE_PLAN_RANGE = {
  start: RAW_TIMELINE_DAYS[0]?.date ?? "2026-04-06",
  end: RAW_TIMELINE_DAYS[RAW_TIMELINE_DAYS.length - 1]?.date ?? "2026-05-20",
} as const;

export const TIMELINE_DAY_PLANS: TimelineDayPlan[] = RAW_TIMELINE_DAYS.map(buildPlanFromRaw);

const TIMELINE_DAY_PLAN_BY_DATE = new Map(
  TIMELINE_DAY_PLANS.map((dayPlan) => [dayPlan.date, dayPlan]),
);

const LOGGABLE_ENTRY_BY_ID = new Map<string, TimelineEntry>();
for (const dayPlan of TIMELINE_DAY_PLANS) {
  for (const entry of dayPlan.entries) {
    if (entry.loggable) {
      LOGGABLE_ENTRY_BY_ID.set(entry.id, entry);
    }
  }
}

export function getTimelineDayPlan(date: string): TimelineDayPlan | null {
  return TIMELINE_DAY_PLAN_BY_DATE.get(date) || null;
}

export function isTimelinePlanDate(date: string): boolean {
  return date >= TIMELINE_PLAN_RANGE.start && date <= TIMELINE_PLAN_RANGE.end;
}

export function createTimelineDayShell(date: string): TimelineDayPlan {
  return {
    date,
    dayLabel: new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Europe/Berlin",
    }).format(new Date(`${date}T00:00:00+02:00`)),
    focusedMinutes: 0,
    entries: [],
    checknotes: {},
  };
}

export function getTimelineDayOrShell(date: string): TimelineDayPlan {
  return getTimelineDayPlan(date) || createTimelineDayShell(date);
}

export function buildTimelineDateWindow(anchorDate: string, before: number, after: number): string[] {
  const dates: string[] = [];
  for (let index = before * -1; index <= after; index += 1) {
    dates.push(addDays(anchorDate, index));
  }
  return dates;
}

export function getLoggableTimelineEntry(blockId: string): TimelineEntry | undefined {
  return LOGGABLE_ENTRY_BY_ID.get(blockId);
}

export function resolveTimelineProgressMinutes(
  entry: TimelineEntry,
  progress: TimelineBlockProgress | undefined,
): number {
  if (!progress) {
    return 0;
  }

  if (typeof progress.actualMinutes === "number" && Number.isFinite(progress.actualMinutes)) {
    return Math.max(0, progress.actualMinutes);
  }

  if (progress.state === "completed") {
    return entry.plannedMinutes;
  }

  return 0;
}

export function buildTimelineSyntheticStudySessions(
  timelineProgress: TimelineBlockProgress[] | undefined,
): StudySession[] {
  if (!Array.isArray(timelineProgress) || timelineProgress.length === 0) {
    return [];
  }

  const synthetic: StudySession[] = [];

  for (const progress of timelineProgress) {
    const entry = LOGGABLE_ENTRY_BY_ID.get(progress.blockId);
    if (!entry || !entry.subjectId) {
      continue;
    }

    const minutes = resolveTimelineProgressMinutes(entry, progress);
    if (minutes <= 0) {
      continue;
    }

    const subjectId = progress.actualSubjectId || entry.subjectId;
    const startedAt = toIsoMinute(entry.date, entry.startMinute);
    const endedAt = new Date(new Date(startedAt).getTime() + minutes * 60_000).toISOString();

    synthetic.push({
      id: `timeline:${progress.blockId}`,
      subjectId,
      startedAt,
      endedAt,
      durationSec: minutes * 60,
      createdAt: progress.updatedAt,
    });
  }

  return synthetic;
}

export function mergeStudySessionsWithTimeline(
  studySessions: StudySession[],
  timelineProgress: TimelineBlockProgress[] | undefined,
): StudySession[] {
  return [...studySessions, ...buildTimelineSyntheticStudySessions(timelineProgress)].sort(
    (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
  );
}

export function getTimelinePlannedSubjectMinutes(): Record<SubjectId, number> {
  return { ...PLANNED_SUBJECT_MINUTES };
}

export function getTimelinePlannedDayMinutes(): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const dayPlan of TIMELINE_DAY_PLANS) {
    totals[dayPlan.date] = dayPlan.focusedMinutes;
  }

  return totals;
}
