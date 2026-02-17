import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { WorkoutEntry } from "@/lib/types";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";
import { withWorkoutSeriesFallback } from "@/lib/server/workout-detail";

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
  const workout = data.workouts.find((item) => item.id === id) || null;
  const detail = data.workoutDetails.find((item) => item.workoutId === id) || null;
  const enriched = withWorkoutSeriesFallback(detail, workout);

  return NextResponse.json({ data: enriched });
}

export async function DELETE(
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
  const initialWorkoutCount = data.workouts.length;
  const initialDetailCount = data.workoutDetails.length;

  data.workouts = data.workouts.filter((workout) => workout.id !== id);
  data.workoutDetails = data.workoutDetails.filter((detail) => detail.workoutId !== id);

  const removedWorkouts = initialWorkoutCount - data.workouts.length;
  const removedDetails = initialDetailCount - data.workoutDetails.length;
  const removed = removedWorkouts > 0 || removedDetails > 0;

  if (removed) {
    await store.saveData(data);
  }

  return NextResponse.json({
    ok: true,
    removed,
    removedWorkouts,
    removedDetails,
  });
}

function isValidDifficultyUser(value: unknown): value is number | null {
  if (value === null) {
    return true;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return false;
  }

  return value >= 1 && value <= 10;
}

export async function PATCH(
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

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return badRequest("Invalid workout patch payload");
  }

  const { difficultyUser } = body as { difficultyUser?: unknown };
  if (!isValidDifficultyUser(difficultyUser)) {
    return badRequest("difficultyUser must be between 1 and 10, or null");
  }

  const store = getDashboardStore();
  const data = await store.getData();
  const workout = data.workouts.find((item) => item.id === id);
  if (!workout) {
    return badRequest("Workout not found");
  }

  const roundedDifficulty =
    typeof difficultyUser === "number" ? Math.round(difficultyUser) : undefined;

  const updatedWorkout: WorkoutEntry = {
    ...workout,
    difficultyUser: roundedDifficulty,
  };

  data.workouts = data.workouts.map((item) => (item.id === id ? updatedWorkout : item));
  await store.saveData(data);

  return NextResponse.json({ ok: true, data: updatedWorkout });
}
