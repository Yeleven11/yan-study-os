import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { buildFlashcardSessionSnapshot, createFlashcard, normalizeFlashcards } from "@/lib/flashcards/scheduler";
import type { Flashcard } from "@/lib/types";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

function isValidFlashcard(input: unknown): input is Flashcard {
  if (!input || typeof input !== "object") {
    return false;
  }

  const candidate = input as Flashcard;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.question === "string" &&
    typeof candidate.answer === "string" &&
    typeof candidate.status === "string" &&
    typeof candidate.dueAt === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    typeof candidate.intervalDays === "number" &&
    typeof candidate.easeFactor === "number"
  );
}

export async function GET(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const store = getDashboardStore();
  const data = await store.getData();
  const timezone = data.settings?.timezone || "Europe/Berlin";
  const cards = normalizeFlashcards(data.flashcards);

  return NextResponse.json({
    data: cards,
    snapshot: buildFlashcardSessionSnapshot(cards, new Date(), timezone),
  });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question : null;
  const answer = typeof body?.answer === "string" ? body.answer : null;

  let nextCard: Flashcard | null = null;
  if (question && answer) {
    nextCard = createFlashcard(question, answer);
  } else if (isValidFlashcard(body)) {
    nextCard = normalizeFlashcards([body])[0] || null;
  }

  if (!nextCard) {
    return badRequest("Invalid flashcard payload");
  }

  if (!nextCard.question.trim() || !nextCard.answer.trim()) {
    return badRequest("Question and answer are required");
  }

  const store = getDashboardStore();
  const data = await store.getData();

  const exists = data.flashcards.some((card) => card.id === nextCard?.id);
  if (!exists) {
    data.flashcards = [...data.flashcards, nextCard];
    await store.saveData(data);
  }

  const timezone = data.settings?.timezone || "Europe/Berlin";
  const cards = normalizeFlashcards(data.flashcards);

  return NextResponse.json({
    ok: true,
    data: nextCard,
    snapshot: buildFlashcardSessionSnapshot(cards, new Date(), timezone),
  });
}
