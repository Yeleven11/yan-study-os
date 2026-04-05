import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/server/store";
import { requireSession } from "@/lib/server/route-helpers";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;

  const store = getDashboardStore();
  const data = await store.getData();
  data.studyNotes = (data.studyNotes ?? []).filter((n) => n.id !== id);
  await store.saveData(data);

  return NextResponse.json({ ok: true });
}
