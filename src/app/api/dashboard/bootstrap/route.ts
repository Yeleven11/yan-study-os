import type { NextRequest } from "next/server";
import type { WorkoutDetail } from "@/lib/types";
import { getSessionFromRequest } from "@/lib/server/auth";
import { sanitizeFutureHealthData } from "@/lib/server/health-time-sanity";
import { getDashboardStore } from "@/lib/server/store";
import { beginRouteRequest, classifyError, routeJson } from "@/lib/server/route-helpers";
import { withWorkoutSeriesFallback } from "@/lib/server/workout-detail";

export async function GET(request: NextRequest) {
  const route = beginRouteRequest(request, "/api/dashboard/bootstrap");
  const session = getSessionFromRequest(request);
  if (!session || session.mode === "demo") {
    return routeJson(route, { error: "Unauthorized" }, {
      status: 401,
      result: "unauthorized",
      errorClass: "AuthorizationError",
    });
  }

  try {
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

    return routeJson(route, {
      data: {
        ...data,
        workoutDetails,
        generatedAt: new Date().toISOString(),
      },
    }, {
      result: "success",
      userContext: { workoutCount: data.workouts.length },
    });
  } catch (error) {
    return routeJson(route, { error: "Dashboard bootstrap failed" }, {
      status: 500,
      result: "server_error",
      errorClass: classifyError(error),
    });
  }
}
