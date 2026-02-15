import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/server/store";
import { requireSession } from "@/lib/server/route-helpers";

export async function GET(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const limitValue = Number(request.nextUrl.searchParams.get("limit") || "20");
  const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(80, Math.floor(limitValue))) : 20;

  const store = getDashboardStore();
  const data = await store.getData();
  const runs = [...data.plannerRuns]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, limit);

  return NextResponse.json({ data: runs });
}
