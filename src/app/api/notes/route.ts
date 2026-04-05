import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { StudyNote } from "@/lib/types";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

export async function GET(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const store = getDashboardStore();
  const data = await store.getData();
  return NextResponse.json({ data: data.studyNotes ?? [] });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.id !== "string") {
    return badRequest("Invalid study note payload");
  }

  const note = body as StudyNote;

  const store = getDashboardStore();
  const data = await store.getData();
  data.studyNotes = [...(data.studyNotes ?? []), note];
  await store.saveData(data);

  return NextResponse.json({ ok: true });
}
