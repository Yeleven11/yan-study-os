import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { applyFlashcardGrade } from "@/lib/flashcards/scheduler";
import type { FlashcardGradeInput, FlashcardOutcome } from "@/lib/types";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

function isValidOutcome(value: unknown): value is FlashcardOutcome {
  return value === "correct" || value === "incorrect";
}

function isValidGradeInput(input: unknown): input is FlashcardGradeInput {
  if (!input || typeof input !== "object") {
    return false;
  }

  const candidate = input as FlashcardGradeInput;
  return (
    typeof candidate.cardId === "string" &&
    candidate.cardId.length > 0 &&
    isValidOutcome(candidate.outcome) &&
    typeof candidate.reviewedAt === "string" &&
    candidate.reviewedAt.length > 0
  );
}

export async function POST(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);
  if (!isValidGradeInput(body)) {
    return badRequest("Invalid flashcard review payload");
  }

  const store = getDashboardStore();
  const data = await store.getData();
  const timezone = data.settings?.timezone || "Europe/Berlin";
  const result = applyFlashcardGrade(data.flashcards, body, timezone);

  if (!result.updatedCard) {
    return badRequest("Flashcard not found");
  }

  data.flashcards = result.cards;
  await store.saveData(data);

  return NextResponse.json({
    ok: true,
    data: result.updatedCard,
    snapshot: result.snapshot,
  });
}
