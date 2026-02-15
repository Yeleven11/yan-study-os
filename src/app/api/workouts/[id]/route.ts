import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;
  if (!id) {
    return badRequest("Workout id is required");
  }

  const store = getDashboardStore();
  const data = await store.getData();
  const detail = data.workoutDetails.find((item) => item.workoutId === id) || null;

  return NextResponse.json({ data: detail });
}
