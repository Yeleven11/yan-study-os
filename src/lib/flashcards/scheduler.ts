import type {
  Flashcard,
  FlashcardGradeInput,
  FlashcardSessionSnapshot,
  FlashcardStatus,
} from "@/lib/types";

const LEARN_STEPS_MINUTES = [1, 10] as const;
const RELEARN_STEPS_MINUTES = [10] as const;
const GRADUATING_INTERVAL_GOOD_DAYS = 1;
const INITIAL_EASE_FACTOR = 2.5;
const MINIMUM_EASE_FACTOR = 1.3;
const MAXIMUM_REVIEW_INTERVAL_DAYS = 36_500;
const LAPSE_MULTIPLIER = 0;
const DAY_MS = 86_400_000;

const STATUS_PRIORITY: Record<FlashcardStatus, number> = {
  relearning: 0,
  learning: 1,
  review: 2,
  new: 3,
};

const FUZZ_RANGES = [
  { start: 2.5, end: 7.0, factor: 0.15 },
  { start: 7.0, end: 20.0, factor: 0.1 },
  { start: 20.0, end: Number.POSITIVE_INFINITY, factor: 0.05 },
] as const;

type PickedFlashcard = {
  card: Flashcard;
  dueNow: boolean;
  critical: boolean;
};

type ApplyGradeResult = {
  cards: Flashcard[];
  updatedCard: Flashcard | null;
  snapshot: FlashcardSessionSnapshot;
};

function parseDateMs(value: string | undefined): number {
  if (!value) {
    return NaN;
  }

  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : NaN;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function toDateKeyInTimezone(dateLike: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(dateLike);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fallback below.
  }

  return dateLike.toISOString().slice(0, 10);
}

function hashToUnit(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return ((hash >>> 0) % 10_000) / 10_000;
}

function fuzzDelta(intervalDays: number): number {
  if (intervalDays < 2.5) {
    return 0;
  }

  return FUZZ_RANGES.reduce((delta, range) => {
    const overlap = Math.max(0, Math.min(intervalDays, range.end) - range.start);
    return delta + overlap * range.factor;
  }, 1);
}

function constrainedFuzzBounds(
  intervalDays: number,
  minimum: number,
  maximum: number,
): [number, number] {
  const safeMinimum = Math.min(minimum, maximum);
  const clampedInterval = clamp(intervalDays, safeMinimum, maximum);
  const delta = fuzzDelta(clampedInterval);

  let lower = Math.round(clampedInterval - delta);
  let upper = Math.round(clampedInterval + delta);

  lower = clamp(lower, safeMinimum, maximum);
  upper = clamp(upper, safeMinimum, maximum);

  if (upper === lower && upper > 2 && upper < maximum) {
    upper = lower + 1;
  }

  return [lower, upper];
}

function withReviewFuzz(
  intervalDays: number,
  minimum: number,
  maximum: number,
  fuzzSeed: string,
): number {
  const [lower, upper] = constrainedFuzzBounds(intervalDays, minimum, maximum);
  if (upper <= lower) {
    return lower;
  }

  const fuzzFactor = hashToUnit(fuzzSeed);
  return Math.floor(lower + fuzzFactor * (1 + upper - lower));
}

function delayMinutesToMs(minutes: number): number {
  return Math.max(1, Math.round(minutes * 60_000));
}

function sanitizeStatus(value: string | undefined): FlashcardStatus {
  if (value === "new" || value === "learning" || value === "review" || value === "relearning") {
    return value;
  }

  return "new";
}

function nextLearningStep(
  status: FlashcardStatus,
  currentIndex: number | undefined,
): { steps: readonly number[]; index: number } {
  const steps = status === "relearning" ? RELEARN_STEPS_MINUTES : LEARN_STEPS_MINUTES;
  const safeIndex =
    typeof currentIndex === "number" && Number.isFinite(currentIndex) && currentIndex >= 0
      ? Math.floor(currentIndex)
      : 0;

  return {
    steps,
    index: safeIndex,
  };
}

function normalizeCard(card: Flashcard): Flashcard {
  const nowIso = new Date().toISOString();
  const createdAt = Number.isFinite(parseDateMs(card.createdAt)) ? card.createdAt : nowIso;
  const dueAt = Number.isFinite(parseDateMs(card.dueAt)) ? card.dueAt : createdAt;
  const updatedAt = Number.isFinite(parseDateMs(card.updatedAt)) ? card.updatedAt : createdAt;
  const status = sanitizeStatus(card.status);
  const intervalDays =
    typeof card.intervalDays === "number" && Number.isFinite(card.intervalDays)
      ? Math.max(0, Math.round(card.intervalDays))
      : 0;
  const easeFactor =
    typeof card.easeFactor === "number" && Number.isFinite(card.easeFactor)
      ? clamp(card.easeFactor, MINIMUM_EASE_FACTOR, 4)
      : INITIAL_EASE_FACTOR;

  const learningStepIndex =
    typeof card.learningStepIndex === "number" && Number.isFinite(card.learningStepIndex)
      ? Math.max(0, Math.floor(card.learningStepIndex))
      : undefined;

  return {
    ...card,
    question: `${card.question || ""}`.trim(),
    answer: `${card.answer || ""}`.trim(),
    createdAt,
    dueAt,
    updatedAt,
    status,
    intervalDays,
    easeFactor,
    learningStepIndex,
    reviewCount:
      typeof card.reviewCount === "number" && Number.isFinite(card.reviewCount)
        ? Math.max(0, Math.floor(card.reviewCount))
        : 0,
    lapseCount:
      typeof card.lapseCount === "number" && Number.isFinite(card.lapseCount)
        ? Math.max(0, Math.floor(card.lapseCount))
        : 0,
    consecutiveCorrect:
      typeof card.consecutiveCorrect === "number" && Number.isFinite(card.consecutiveCorrect)
        ? Math.max(0, Math.floor(card.consecutiveCorrect))
        : 0,
  };
}

function compareByQueueOrder(left: Flashcard, right: Flashcard): number {
  const leftDueMs = parseDateMs(left.dueAt);
  const rightDueMs = parseDateMs(right.dueAt);

  if (leftDueMs !== rightDueMs) {
    return leftDueMs - rightDueMs;
  }

  const leftPriority = STATUS_PRIORITY[left.status];
  const rightPriority = STATUS_PRIORITY[right.status];
  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const leftCreated = parseDateMs(left.createdAt);
  const rightCreated = parseDateMs(right.createdAt);
  return leftCreated - rightCreated;
}

function isCritical(card: Flashcard, now: Date, timezone: string): boolean {
  const todayKey = toDateKeyInTimezone(now, timezone);
  const dueKey = toDateKeyInTimezone(new Date(card.dueAt), timezone);
  return dueKey <= todayKey;
}

function pickNextInternal(cards: Flashcard[], now = new Date(), timezone: string): PickedFlashcard | null {
  if (cards.length === 0) {
    return null;
  }

  const nowMs = now.getTime();
  const dueNow = cards.filter((card) => parseDateMs(card.dueAt) <= nowMs).sort(compareByQueueOrder);

  if (dueNow.length > 0) {
    const card = dueNow[0];
    return {
      card,
      dueNow: true,
      critical: isCritical(card, now, timezone),
    };
  }

  const nextCard = cards.slice().sort(compareByQueueOrder)[0];
  return {
    card: nextCard,
    dueNow: false,
    critical: isCritical(nextCard, now, timezone),
  };
}

function graduateToReview(card: Flashcard, reviewedAtMs: number, intervalDays: number): Flashcard {
  const nextInterval = clamp(intervalDays, 1, MAXIMUM_REVIEW_INTERVAL_DAYS);
  return {
    ...card,
    status: "review",
    learningStepIndex: undefined,
    intervalDays: nextInterval,
    dueAt: new Date(reviewedAtMs + nextInterval * DAY_MS).toISOString(),
  };
}

function applyIncorrect(card: Flashcard, reviewedAtMs: number): Flashcard {
  if (card.status === "review") {
    const lapseInterval = clamp(
      Math.round(Math.max(1, card.intervalDays || 1) * LAPSE_MULTIPLIER),
      1,
      MAXIMUM_REVIEW_INTERVAL_DAYS,
    );

    if (RELEARN_STEPS_MINUTES.length > 0) {
      return {
        ...card,
        status: "relearning",
        learningStepIndex: 0,
        intervalDays: lapseInterval,
        easeFactor: clamp(card.easeFactor - 0.2, MINIMUM_EASE_FACTOR, 4),
        lapseCount: card.lapseCount + 1,
        dueAt: new Date(reviewedAtMs + delayMinutesToMs(RELEARN_STEPS_MINUTES[0])).toISOString(),
      };
    }

    return graduateToReview(
      {
        ...card,
        lapseCount: card.lapseCount + 1,
        easeFactor: clamp(card.easeFactor - 0.2, MINIMUM_EASE_FACTOR, 4),
      },
      reviewedAtMs,
      lapseInterval,
    );
  }

  const learnStatus = card.status === "relearning" ? "relearning" : "learning";
  const { steps } = nextLearningStep(learnStatus, 0);
  const resetDelay = steps[0] ?? LEARN_STEPS_MINUTES[0];

  return {
    ...card,
    status: learnStatus,
    learningStepIndex: 0,
    dueAt: new Date(reviewedAtMs + delayMinutesToMs(resetDelay)).toISOString(),
  };
}

function applyCorrect(card: Flashcard, reviewedAtMs: number): Flashcard {
  if (card.status === "review") {
    const dueMs = parseDateMs(card.dueAt);
    const daysLate = Number.isFinite(dueMs)
      ? Math.max(0, Math.floor((reviewedAtMs - dueMs) / DAY_MS))
      : 0;

    const currentInterval = Math.max(1, card.intervalDays || GRADUATING_INTERVAL_GOOD_DAYS);
    const rawInterval = (currentInterval + daysLate / 2) * Math.max(card.easeFactor, MINIMUM_EASE_FACTOR);
    const nextInterval = withReviewFuzz(
      rawInterval,
      currentInterval + 1,
      MAXIMUM_REVIEW_INTERVAL_DAYS,
      `${card.id}:${card.reviewCount + 1}:${reviewedAtMs}`,
    );

    return graduateToReview(card, reviewedAtMs, nextInterval);
  }

  const status = card.status === "relearning" ? "relearning" : "learning";
  const { steps, index } = nextLearningStep(status, card.learningStepIndex);
  const nextIndex = index + 1;

  if (nextIndex < steps.length) {
    return {
      ...card,
      status,
      learningStepIndex: nextIndex,
      dueAt: new Date(reviewedAtMs + delayMinutesToMs(steps[nextIndex])).toISOString(),
    };
  }

  if (status === "relearning") {
    const relearnInterval = Math.max(1, card.intervalDays || 1);
    return graduateToReview(card, reviewedAtMs, relearnInterval);
  }

  return graduateToReview(card, reviewedAtMs, GRADUATING_INTERVAL_GOOD_DAYS);
}

export function createFlashcard(question: string, answer: string, nowIso = new Date().toISOString()): Flashcard {
  const nowMs = parseDateMs(nowIso);
  const createdAt = Number.isFinite(nowMs) ? new Date(nowMs).toISOString() : new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    question: question.trim(),
    answer: answer.trim(),
    status: "new",
    dueAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    intervalDays: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    reviewCount: 0,
    lapseCount: 0,
    consecutiveCorrect: 0,
  };
}

export function pickNextFlashcard(
  cards: Flashcard[],
  now = new Date(),
  timezone = "Europe/Berlin",
): PickedFlashcard | null {
  const normalized = cards.map(normalizeCard);
  return pickNextInternal(normalized, now, timezone);
}

export function buildFlashcardSessionSnapshot(
  cards: Flashcard[],
  now = new Date(),
  timezone = "Europe/Berlin",
): FlashcardSessionSnapshot {
  const normalized = cards.map(normalizeCard);
  const nowMs = now.getTime();
  const dueNowCount = normalized.filter((card) => parseDateMs(card.dueAt) <= nowMs).length;
  const criticalTodayCount = normalized.filter((card) => isCritical(card, now, timezone)).length;
  const optionalCount = Math.max(0, normalized.length - criticalTodayCount);
  const nextDueAt =
    normalized.length > 0
      ? normalized
          .slice()
          .sort(compareByQueueOrder)[0]
          ?.dueAt
      : undefined;
  const picked = pickNextInternal(normalized, now, timezone);

  return {
    generatedAt: now.toISOString(),
    timezone,
    totalCards: normalized.length,
    dueNowCount,
    criticalTodayCount,
    optionalCount,
    nextDueAt,
    currentCardId: picked?.card.id,
    currentCardDueNow: Boolean(picked?.dueNow),
    currentCardCritical: Boolean(picked?.critical),
  };
}

export function applyFlashcardGrade(
  cards: Flashcard[],
  input: FlashcardGradeInput,
  timezone = "Europe/Berlin",
): ApplyGradeResult {
  const normalized = cards.map(normalizeCard);
  const cardIndex = normalized.findIndex((card) => card.id === input.cardId);
  const reviewedAtMs = parseDateMs(input.reviewedAt);
  const safeReviewedAtMs = Number.isFinite(reviewedAtMs) ? reviewedAtMs : Date.now();
  const reviewedAtIso = new Date(safeReviewedAtMs).toISOString();

  if (cardIndex < 0) {
    return {
      cards: normalized,
      updatedCard: null,
      snapshot: buildFlashcardSessionSnapshot(normalized, new Date(safeReviewedAtMs), timezone),
    };
  }

  const sourceCard = normalized[cardIndex];
  const withMetadata: Flashcard = {
    ...sourceCard,
    updatedAt: reviewedAtIso,
    lastReviewedAt: reviewedAtIso,
    lastOutcome: input.outcome,
    reviewCount: sourceCard.reviewCount + 1,
    consecutiveCorrect:
      input.outcome === "correct" ? sourceCard.consecutiveCorrect + 1 : 0,
  };

  const updatedCard =
    input.outcome === "incorrect"
      ? applyIncorrect(withMetadata, safeReviewedAtMs)
      : applyCorrect(withMetadata, safeReviewedAtMs);

  const nextCards = normalized.map((card, index) => (index === cardIndex ? updatedCard : card));

  return {
    cards: nextCards,
    updatedCard,
    snapshot: buildFlashcardSessionSnapshot(nextCards, new Date(safeReviewedAtMs), timezone),
  };
}

export function normalizeFlashcards(cards: Flashcard[] | undefined): Flashcard[] {
  if (!Array.isArray(cards)) {
    return [];
  }

  return cards
    .filter(
      (card) =>
        card &&
        typeof card.id === "string" &&
        typeof card.question === "string" &&
        typeof card.answer === "string",
    )
    .map(normalizeCard);
}

export type { PickedFlashcard, ApplyGradeResult };
