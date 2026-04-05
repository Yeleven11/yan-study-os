import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> },
) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { topicId } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return badRequest("Invalid topic patch payload");
  }

  const store = getDashboardStore();
  const data = await store.getData();

  const topics = data.syllabusTopics ?? [];
  const index = topics.findIndex((t) => t.id === topicId);
  if (index === -1) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const topic = topics[index];

  if (body.confidence !== undefined) {
    topic.confidence = body.confidence;
  }
  if (body.notes !== undefined) {
    topic.notes = body.notes;
  }
  if (body.lastStudiedAt !== undefined) {
    topic.lastStudiedAt = body.lastStudiedAt;
  }

  topics[index] = topic;
  data.syllabusTopics = topics;
  await store.saveData(data);

  return NextResponse.json({ ok: true });
}
