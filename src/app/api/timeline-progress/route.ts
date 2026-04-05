import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { TimelineBlockProgress } from "@/lib/types";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

export async function GET(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const store = getDashboardStore();
  const data = await store.getData();
  return NextResponse.json({ data: data.timelineProgress ?? [] });
}

export async function PUT(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    typeof body.blockId !== "string" ||
    typeof body.state !== "string" ||
    typeof body.updatedAt !== "string"
  ) {
    return badRequest("Invalid timeline progress payload");
  }

  const progress = body as TimelineBlockProgress;

  const store = getDashboardStore();
  const data = await store.getData();
  const existing = (data.timelineProgress ?? []).filter((item) => item.blockId !== progress.blockId);
  existing.push(progress);
  existing.sort(
    (left, right) => new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime(),
  );
  data.timelineProgress = existing;
  await store.saveData(data);

  return NextResponse.json({ ok: true });
}
