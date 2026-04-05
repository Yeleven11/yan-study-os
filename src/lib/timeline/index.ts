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
import {
  TIMELINE_ENRICHMENT_ENTRIES,
  type TimelineEnrichmentEntry,
} from "./timeline-enrichment";
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

type TimelineInspectorCard = {
  label: string;
  value: string;
};

type TimelineInspectorPrompt = {
  label: string;
  value: string;
};

type TimelineInspectorContent = {
  checklist: string[];
  context: TimelineInspectorCard[];
  originalPlan?: string;
  prompt?: TimelineInspectorPrompt;
  readOnlyMessage: string;
  rewardPrompt?: string;
  successCriteria: string[];
  summary: string;
  whyThisMatters?: string;
};

type TimelineEnrichmentLookupEntry = TimelineEnrichmentEntry & {
  absoluteEndMinute: number;
  absoluteStartMinute: number;
  normalizedKind: TimelineEntryKind;
  normalizedTitle: string;
  startMinute: number;
  endMinute: number;
  subjectId?: SubjectId;
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

function toAbsoluteMinuteNumber(dateKey: string, minute: number): number {
  const base = new Date(`${dateKey}T00:00:00Z`);
  return Math.floor(base.getTime() / 60_000) + minute;
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

function ensureSentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function stripSubjectPrefix(text: string): string {
  const prefixMatch = SUBJECT_PREFIXES.find(([prefix]) => text.startsWith(`${prefix}: `));
  if (!prefixMatch) {
    return text.trim();
  }

  return text.slice(prefixMatch[0].length + 2).trim();
}

function splitListItems(value: string): string[] {
  const cleaned = value
    .replace(/\s+/g, " ")
    .replace(/\band\b/gi, ",")
    .replace(/,\s*,/g, ",")
    .trim();

  const parts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1 || parts.length > 5) {
    return [value.trim()];
  }

  return parts;
}

function expandChecklistSentence(sentence: string): string[] {
  const trimmed = sentence.replace(/\.$/, "").trim();
  if (!trimmed) {
    return [];
  }

  const verbPatterns = ["focus on", "rebuild", "review", "learn", "keep open", "work on"];

  for (const pattern of verbPatterns) {
    if (trimmed.toLowerCase().startsWith(`${pattern} `)) {
      const rest = trimmed.slice(pattern.length).trim();
      const items = splitListItems(rest);
      if (items.length > 1) {
        const capitalizedPattern = pattern.charAt(0).toUpperCase() + pattern.slice(1);
        return items.map((item) => ensureSentence(`${capitalizedPattern} ${item}`));
      }
    }
  }

  return [ensureSentence(trimmed.charAt(0).toUpperCase() + trimmed.slice(1))];
}

function uniqueSentences(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const normalized = item.trim();
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function buildStudyChecklist(entry: TimelineEntry): string[] {
  const items: string[] = [];

  items.push(ensureSentence(`Work through ${entry.title}`));

  if (entry.detail) {
    const normalized = entry.detail
      .replace(/\bthen\b/gi, ". Then ")
      .replace(/;/g, ". ")
      .replace(/\bAdmin block only\b\.?/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    const sentences = normalized
      .split(/\.\s+/)
      .map((part) => part.replace(/^Then\s+/i, "").trim())
      .filter(Boolean);

    for (const sentence of sentences) {
      items.push(...expandChecklistSentence(sentence));
    }
  }

  return uniqueSentences(items).slice(0, 6);
}

function buildSupportChecklist(entry: TimelineEntry): string[] {
  if (entry.sourceText) {
    return uniqueSentences(
      stripSubjectPrefix(entry.sourceText)
        .replace(/\bthen\b/gi, ". Then ")
        .replace(/;/g, ". ")
        .split(/\.\s+/)
        .map((part) => part.replace(/^Then\s+/i, "").trim())
        .filter(Boolean)
        .map((part) => ensureSentence(part)),
    ).slice(0, 4);
  }

  switch (entry.kind) {
    case "sleep":
      return [
        "Treat this as protected recovery time.",
        "No study logging is needed for this block.",
      ];
    case "meal":
      return [
        "Step away from the desk and eat before the next block.",
        "No study logging is needed for this block.",
      ];
    case "outside":
      return [
        "Get outside and reset away from the study desk.",
        "No study logging is needed for this block.",
      ];
    case "winddown":
      return [
        "Keep this block low-pressure so the next day starts clean.",
        "No study logging is needed for this block.",
      ];
    case "exam":
      return [
        "This is a fixed exam slot in the hardcoded plan.",
        "No study logging is needed for this block.",
      ];
    case "setup":
    case "admin":
      return [
        "Use this time to prepare materials or reset the system.",
        "No study logging is needed for this block.",
      ];
    default:
      return ["No study logging is needed for this block."];
  }
}

function buildSupportSummary(entry: TimelineEntry): string {
  if (entry.sourceText) {
    return ensureSentence(stripSubjectPrefix(entry.sourceText));
  }

  switch (entry.kind) {
    case "sleep":
      return "Protected sleep block to keep recovery and energy stable for the study plan.";
    case "meal":
      return "Planned meal break so the day keeps its rhythm instead of bleeding into the next study block.";
    case "outside":
      return "Planned outside block to reset your head and get away from the desk.";
    case "winddown":
      return "Planned wind-down block so the evening actually stays off and recovery remains protected.";
    case "exam":
      return "Fixed exam slot from the hardcoded plan.";
    case "setup":
    case "admin":
      return "Short admin/setup block to get the system ready for the rest of the day.";
    default:
      return "Informational timeline block from the hardcoded plan.";
  }
}

function normalizeTitleForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getEnrichmentSubjectId(subject: string): SubjectId | undefined {
  const normalized = subject.toLowerCase().trim();

  if (!normalized || normalized === "none") {
    return undefined;
  }

  if (normalized.includes("physics")) {
    return "physics_hl";
  }
  if (normalized.includes("business")) {
    return "business_sl";
  }
  if (normalized.includes("computer")) {
    return "computer_science_hl";
  }
  if (normalized.includes("english")) {
    return "english_lang_lit_sl";
  }
  if (normalized.includes("german")) {
    return "german_lang_lit_sl";
  }
  if (normalized.includes("math")) {
    return "math_aa_hl";
  }

  return undefined;
}

function normalizeEnrichmentKind(kind: TimelineEnrichmentEntry["kind"]): TimelineEntryKind {
  if (kind === "recovery") {
    return "winddown";
  }

  return kind;
}

function isCompatibleEnrichmentKind(
  entryKind: TimelineEntryKind,
  candidateKind: TimelineEntryKind,
): boolean {
  if (entryKind === candidateKind) {
    return true;
  }

  if (
    (entryKind === "outside" || entryKind === "winddown") &&
    (candidateKind === "outside" || candidateKind === "winddown")
  ) {
    return true;
  }

  if (
    (entryKind === "setup" || entryKind === "admin") &&
    (candidateKind === "setup" || candidateKind === "admin")
  ) {
    return true;
  }

  return false;
}

function getOverlapMinutes(
  leftStartMinute: number,
  leftEndMinute: number,
  rightStartMinute: number,
  rightEndMinute: number,
): number {
  return Math.max(0, Math.min(leftEndMinute, rightEndMinute) - Math.max(leftStartMinute, rightStartMinute));
}

const TIMELINE_ENRICHMENT_LOOKUP: TimelineEnrichmentLookupEntry[] = TIMELINE_ENRICHMENT_ENTRIES.map(
  (entry) => {
    const startMinute = parseClock(entry.startTime);
    const rawEndMinute = parseClock(entry.endTime);
    const endMinute = rawEndMinute <= startMinute ? rawEndMinute + DAY_MINUTES : rawEndMinute;

    return {
      ...entry,
      absoluteEndMinute: toAbsoluteMinuteNumber(entry.date, endMinute),
      absoluteStartMinute: toAbsoluteMinuteNumber(entry.date, startMinute),
      endMinute,
      normalizedKind: normalizeEnrichmentKind(entry.kind),
      normalizedTitle: normalizeTitleForMatch(entry.title),
      startMinute,
      subjectId: getEnrichmentSubjectId(entry.subject),
    };
  },
);

function findTimelineEnrichmentEntry(entry: TimelineEntry): TimelineEnrichmentLookupEntry | undefined {
  const entryAbsoluteStartMinute = toAbsoluteMinuteNumber(entry.date, entry.startMinute);
  const entryAbsoluteEndMinute = toAbsoluteMinuteNumber(entry.date, entry.endMinute);
  const normalizedEntryTitle = normalizeTitleForMatch(entry.title);

  let bestMatch: TimelineEnrichmentLookupEntry | undefined;
  let bestScore = -1;

  for (const candidate of TIMELINE_ENRICHMENT_LOOKUP) {
    if (!isCompatibleEnrichmentKind(entry.kind, candidate.normalizedKind)) {
      continue;
    }

    const overlapMinute = getOverlapMinutes(
      entryAbsoluteStartMinute,
      entryAbsoluteEndMinute,
      candidate.absoluteStartMinute,
      candidate.absoluteEndMinute,
    );
    const titleMatches = candidate.normalizedTitle === normalizedEntryTitle;
    const subjectMatches = !entry.subjectId || !candidate.subjectId || candidate.subjectId === entry.subjectId;
    const exactStartMatch =
      candidate.date === entry.date && candidate.startMinute === entry.startMinute;
    const exactEndMatch =
      candidate.date === entry.date && candidate.endMinute % DAY_MINUTES === entry.endMinute;
    const fullyCoversEntry =
      candidate.absoluteStartMinute <= entryAbsoluteStartMinute &&
      candidate.absoluteEndMinute >= entryAbsoluteEndMinute;

    if (overlapMinute <= 0 && !fullyCoversEntry) {
      continue;
    }

    let score = overlapMinute;

    if (candidate.normalizedKind === entry.kind) {
      score += 24;
    }
    if (candidate.date === entry.date) {
      score += 20;
    }
    if (titleMatches) {
      score += 48;
    }
    if (subjectMatches) {
      score += 12;
    }
    if (exactStartMatch) {
      score += 28;
    }
    if (exactEndMatch) {
      score += 18;
    }
    if (fullyCoversEntry) {
      score += 20;
    }

    if (score > bestScore) {
      bestMatch = candidate;
      bestScore = score;
    }
  }

  return bestMatch;
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

const ENTRY_BY_ID = new Map<string, TimelineEntry>();
const LOGGABLE_ENTRY_BY_ID = new Map<string, TimelineEntry>();
for (const dayPlan of TIMELINE_DAY_PLANS) {
  for (const entry of dayPlan.entries) {
    ENTRY_BY_ID.set(entry.id, entry);
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

export function getTimelineEntry(blockId: string): TimelineEntry | undefined {
  return ENTRY_BY_ID.get(blockId);
}

export function buildTimelineInspectorContent(
  entry: TimelineEntry,
  dayPlan: TimelineDayPlan,
): TimelineInspectorContent {
  const enrichment = findTimelineEnrichmentEntry(entry);
  const originalPlan = entry.sourceText ? stripSubjectPrefix(entry.sourceText) : undefined;
  const successCriteria =
    enrichment?.successCriteria.length
      ? enrichment.successCriteria
      : entry.loggable && dayPlan.checknotes.doneLooksLike
        ? [ensureSentence(dayPlan.checknotes.doneLooksLike)]
        : [];
  const prompt = enrichment?.loggingPrompt
    ? {
        label: entry.loggable ? "Logging prompt" : "Check-in prompt",
        value: enrichment.loggingPrompt,
      }
    : enrichment?.recoveryPrompt
      ? {
          label: "Recovery prompt",
          value: enrichment.recoveryPrompt,
        }
      : undefined;

  if (entry.loggable) {
    return {
      checklist: enrichment?.checklist.length ? enrichment.checklist : buildStudyChecklist(entry),
      context: [
        dayPlan.checknotes.understanding
          ? {
              label: "Understanding target",
              value: ensureSentence(dayPlan.checknotes.understanding),
            }
          : null,
        dayPlan.checknotes.doneLooksLike
          ? {
              label: "Done looks like",
              value: ensureSentence(dayPlan.checknotes.doneLooksLike),
            }
          : null,
      ].filter((item): item is { label: string; value: string } => Boolean(item)),
      originalPlan,
      prompt,
      readOnlyMessage: "Log what you actually did here once the block is over.",
      rewardPrompt: enrichment?.rewardPrompt,
      successCriteria,
      summary:
        enrichment?.summary ||
        originalPlan ||
        entry.detail ||
        ensureSentence(`Work through ${entry.title} in the exact scope of the plan`),
      whyThisMatters: enrichment?.whyThisMatters,
    };
  }

  return {
    checklist: enrichment?.checklist.length ? enrichment.checklist : buildSupportChecklist(entry),
    context: [],
    originalPlan,
    prompt,
    readOnlyMessage: "This is a fixed support block in the hardcoded plan, so there is nothing to log here.",
    rewardPrompt: enrichment?.rewardPrompt,
    successCriteria,
    summary: enrichment?.summary || buildSupportSummary(entry),
    whyThisMatters: enrichment?.whyThisMatters,
  };
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
