import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { WorkoutEntry } from "@/lib/types";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

function isValidWorkout(input: unknown): input is WorkoutEntry {
  if (!input || typeof input !== "object") {
    return false;
  }

  const candidate = input as WorkoutEntry;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.startedAt === "string" &&
    typeof candidate.endedAt === "string" &&
    typeof candidate.durationMin === "number" &&
    Number.isFinite(candidate.durationMin) &&
    typeof candidate.source === "string" &&
    typeof candidate.createdAt === "string"
  );
}

export async function GET(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  const fromMs = from ? new Date(`${from}T00:00:00`).getTime() : null;
  const toMs = to ? new Date(`${to}T23:59:59.999`).getTime() : null;

  const store = getDashboardStore();
  const data = await store.getData();

  const workouts = data.workouts.filter((workout) => {
    const startedMs = new Date(workout.startedAt).getTime();
    if (Number.isNaN(startedMs)) {
      return false;
    }

    if (typeof fromMs === "number" && startedMs < fromMs) {
      return false;
    }

    if (typeof toMs === "number" && startedMs > toMs) {
      return false;
    }

    return true;
  });

  workouts.sort(
    (left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
  );

  return NextResponse.json({ data: workouts });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);
  if (!isValidWorkout(body)) {
    return badRequest("Invalid workout payload");
  }

  const store = getDashboardStore();
  const data = await store.getData();
  const exists = data.workouts.some((workout) => workout.id === body.id);

  if (!exists) {
    data.workouts = [...data.workouts, body].sort(
      (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
    );
    await store.saveData(data);
  }

  return NextResponse.json({ ok: true });
}
