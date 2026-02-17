import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { WorkoutDetail } from "@/lib/types";
import { sanitizeFutureHealthData } from "@/lib/server/health-time-sanity";
import { getDashboardStore } from "@/lib/server/store";
import { requireSession } from "@/lib/server/route-helpers";
import { withWorkoutSeriesFallback } from "@/lib/server/workout-detail";

export async function GET(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const store = getDashboardStore();
  const loadedData = await store.getData();
  const sanitized = sanitizeFutureHealthData(loadedData);
  const data = sanitized.data;
  if (sanitized.summary.changed) {
    await store.saveData(data);
  }
  const workoutById = new Map(data.workouts.map((workout) => [workout.id, workout]));
  const detailByWorkoutId = new Map(
    data.workoutDetails.map((detail) => [detail.workoutId, detail]),
  );
  const workoutDetails: WorkoutDetail[] = [];

  for (const workout of data.workouts) {
    const enriched = withWorkoutSeriesFallback(
      detailByWorkoutId.get(workout.id) || null,
      workout,
    );
    if (enriched) {
      workoutDetails.push(enriched);
    }
  }

  for (const detail of data.workoutDetails) {
    if (workoutById.has(detail.workoutId)) {
      continue;
    }
    const enriched = withWorkoutSeriesFallback(detail, null);
    if (enriched) {
      workoutDetails.push(enriched);
    }
  }

  return NextResponse.json({
    data: {
      ...data,
      workoutDetails,
      generatedAt: new Date().toISOString(),
    },
  });
}
