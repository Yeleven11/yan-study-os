import assert from "node:assert/strict";
import test from "node:test";
import {
  applyFlashcardGrade,
  buildFlashcardSessionSnapshot,
  createFlashcard,
  pickNextFlashcard,
} from "./scheduler";
import type { Flashcard } from "../types";

const TZ = "Europe/Berlin";

function ms(value: string): number {
  return new Date(value).getTime();
}

test("new card is immediately schedulable and due now", () => {
  const createdAt = "2026-02-15T20:00:00.000Z";
  const card = createFlashcard("Q1", "A1", createdAt);
  const snapshot = buildFlashcardSessionSnapshot([card], new Date(createdAt), TZ);
  const picked = pickNextFlashcard([card], new Date(createdAt), TZ);

  assert.equal(card.status, "new");
  assert.equal(snapshot.dueNowCount, 1);
  assert.equal(snapshot.criticalTodayCount, 1);
  assert.equal(picked?.card.id, card.id);
  assert.equal(picked?.dueNow, true);
});

test("learning steps: correct advances then graduates to review", () => {
  const t0 = "2026-02-15T20:00:00.000Z";
  const card = createFlashcard("Q1", "A1", t0);

  const first = applyFlashcardGrade(
    [card],
    { cardId: card.id, outcome: "correct", reviewedAt: t0 },
    TZ,
  );
  const firstCard = first.updatedCard as Flashcard;
  assert.equal(firstCard.status, "learning");
  assert.equal(firstCard.learningStepIndex, 1);
  assert.equal(ms(firstCard.dueAt), ms(t0) + 10 * 60_000);

  const second = applyFlashcardGrade(
    first.cards,
    { cardId: card.id, outcome: "correct", reviewedAt: firstCard.dueAt },
    TZ,
  );
  const secondCard = second.updatedCard as Flashcard;
  assert.equal(secondCard.status, "review");
  assert.equal(secondCard.intervalDays, 1);
  assert.equal(ms(secondCard.dueAt), ms(firstCard.dueAt) + 86_400_000);
});

test("repeated review correct answers expand interval to weekly cadence", () => {
  const t0 = "2026-02-15T20:00:00.000Z";
  const card = createFlashcard("Q1", "A1", t0);
  let cards = [card];

  cards = applyFlashcardGrade(cards, { cardId: card.id, outcome: "correct", reviewedAt: t0 }, TZ).cards;
  cards = applyFlashcardGrade(
    cards,
    { cardId: card.id, outcome: "correct", reviewedAt: cards[0].dueAt },
    TZ,
  ).cards;

  for (let index = 0; index < 4; index += 1) {
    const dueAt = cards[0].dueAt;
    cards = applyFlashcardGrade(
      cards,
      { cardId: card.id, outcome: "correct", reviewedAt: dueAt },
      TZ,
    ).cards;
  }

  assert.equal(cards[0].status, "review");
  assert.ok(cards[0].intervalDays >= 7);
});

test("incorrect on review moves to relearning and returns with short interval", () => {
  const t0 = "2026-02-15T20:00:00.000Z";
  const card = createFlashcard("Q1", "A1", t0);
  let cards = [card];

  cards = applyFlashcardGrade(cards, { cardId: card.id, outcome: "correct", reviewedAt: t0 }, TZ).cards;
  cards = applyFlashcardGrade(
    cards,
    { cardId: card.id, outcome: "correct", reviewedAt: cards[0].dueAt },
    TZ,
  ).cards;

  const reviewCard = cards[0];
  const failed = applyFlashcardGrade(
    cards,
    { cardId: card.id, outcome: "incorrect", reviewedAt: reviewCard.dueAt },
    TZ,
  );
  const failedCard = failed.updatedCard as Flashcard;
  assert.equal(failedCard.status, "relearning");
  assert.equal(failedCard.learningStepIndex, 0);
  assert.equal(ms(failedCard.dueAt), ms(reviewCard.dueAt) + 10 * 60_000);

  const relearned = applyFlashcardGrade(
    failed.cards,
    { cardId: card.id, outcome: "correct", reviewedAt: failedCard.dueAt },
    TZ,
  );
  const relearnedCard = relearned.updatedCard as Flashcard;
  assert.equal(relearnedCard.status, "review");
  assert.equal(relearnedCard.intervalDays, 1);
});

test("critical count excludes optional future cards", () => {
  const now = new Date("2026-02-15T20:00:00.000Z");
  const critical = createFlashcard("Critical", "A", now.toISOString());
  const optional = createFlashcard("Optional", "B", now.toISOString());
  optional.dueAt = "2026-02-18T09:00:00.000Z";

  const snapshot = buildFlashcardSessionSnapshot([critical, optional], now, TZ);
  assert.equal(snapshot.criticalTodayCount, 1);
  assert.equal(snapshot.optionalCount, 1);
});

test("no grade means no state mutation", () => {
  const now = new Date("2026-02-15T20:00:00.000Z");
  const card = createFlashcard("Q1", "A1", now.toISOString());
  const before = JSON.stringify(card);

  const snapshot = buildFlashcardSessionSnapshot([card], now, TZ);
  const after = JSON.stringify(card);

  assert.equal(snapshot.totalCards, 1);
  assert.equal(before, after);
});
