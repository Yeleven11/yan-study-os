import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { SyllabusTopic } from "@/lib/types";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

export async function PUT(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body?.topics)) {
    return badRequest("Invalid syllabus payload");
  }

  const topics = body.topics as SyllabusTopic[];

  const store = getDashboardStore();
  const data = await store.getData();
  data.syllabusTopics = topics;
  await store.saveData(data);

  return NextResponse.json({ ok: true });
}
