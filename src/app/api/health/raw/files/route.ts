import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/server/store";
import { requireSession } from "@/lib/server/route-helpers";

export async function GET(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const store = getDashboardStore();
  const data = await store.getData();

  const files = [...data.healthRawFiles].sort(
    (left, right) => new Date(right.importedAt).getTime() - new Date(left.importedAt).getTime(),
  );

  return NextResponse.json({ data: files });
}
