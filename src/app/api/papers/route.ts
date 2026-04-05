import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { PastPaperAttempt } from "@/lib/types";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

export async function GET(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const store = getDashboardStore();
  const data = await store.getData();
  return NextResponse.json({ data: data.pastPapers ?? [] });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.id !== "string") {
    return badRequest("Invalid past paper payload");
  }

  const attempt = body as PastPaperAttempt;

  const store = getDashboardStore();
  const data = await store.getData();
  data.pastPapers = [...(data.pastPapers ?? []), attempt];
  await store.saveData(data);

  return NextResponse.json({ ok: true });
}
