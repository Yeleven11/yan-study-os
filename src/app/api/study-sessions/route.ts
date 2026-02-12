import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { StudySession } from "@/lib/types";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

function isValidSession(input: unknown): input is StudySession {
  if (!input || typeof input !== "object") {
    return false;
  }

  const candidate = input as StudySession;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.subjectId === "string" &&
    typeof candidate.startedAt === "string" &&
    typeof candidate.endedAt === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.durationSec === "number"
  );
}

export async function GET(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const store = getDashboardStore();
  const data = await store.getData();
  return NextResponse.json({ data: data.studySessions });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);
  if (!isValidSession(body)) {
    return badRequest("Invalid study session payload");
  }

  const store = getDashboardStore();
  await store.appendStudySession(body);

  return NextResponse.json({ ok: true });
}
