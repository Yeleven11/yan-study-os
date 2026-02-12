import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;

  if (!id) {
    return badRequest("Todo id is required");
  }

  const store = getDashboardStore();
  await store.restoreTodo(id);

  return NextResponse.json({ ok: true });
}
