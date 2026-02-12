import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Exam } from "@/lib/types";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

function isValidExamList(input: unknown): input is Exam[] {
  if (!Array.isArray(input)) {
    return false;
  }

  return input.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      typeof item.subjectId === "string" &&
      typeof item.title === "string" &&
      typeof item.paper === "string" &&
      typeof item.startsAt === "string",
  );
}

export async function GET(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const store = getDashboardStore();
  const data = await store.getData();
  return NextResponse.json({ data: data.exams });
}

export async function PUT(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);

  if (!isValidExamList(body?.exams)) {
    return badRequest("Invalid exam payload");
  }

  const store = getDashboardStore();
  await store.updateExams(body.exams);

  return NextResponse.json({ ok: true });
}
