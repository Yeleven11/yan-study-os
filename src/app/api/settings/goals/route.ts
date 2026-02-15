import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createDefaultPerformanceGoals } from "@/lib/constants";
import type { PerformanceGoals } from "@/lib/types";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function isValidGoals(input: unknown): input is PerformanceGoals {
  if (!input || typeof input !== "object") {
    return false;
  }

  const candidate = input as PerformanceGoals;

  return (
    typeof candidate.sleepHoursTarget === "number" &&
    Number.isFinite(candidate.sleepHoursTarget) &&
    candidate.sleepHoursTarget >= 5 &&
    candidate.sleepHoursTarget <= 12 &&
    typeof candidate.baselineStudyHours === "number" &&
    Number.isFinite(candidate.baselineStudyHours) &&
    candidate.baselineStudyHours >= 1 &&
    candidate.baselineStudyHours <= 12 &&
    typeof candidate.weeklyWorkoutTarget === "number" &&
    Number.isFinite(candidate.weeklyWorkoutTarget) &&
    candidate.weeklyWorkoutTarget >= 1 &&
    candidate.weeklyWorkoutTarget <= 14 &&
    typeof candidate.weekdayWakeTime === "string" &&
    isValidTime(candidate.weekdayWakeTime) &&
    typeof candidate.weekendWakeTime === "string" &&
    isValidTime(candidate.weekendWakeTime) &&
    typeof candidate.ageYears === "number" &&
    Number.isFinite(candidate.ageYears) &&
    candidate.ageYears >= 12 &&
    candidate.ageYears <= 90
  );
}

export async function GET(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const store = getDashboardStore();
  const data = await store.getData();

  return NextResponse.json({
    data: data.goals || createDefaultPerformanceGoals(),
  });
}

export async function PUT(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);

  if (!isValidGoals(body?.goals)) {
    return badRequest("Invalid goals payload");
  }

  const store = getDashboardStore();
  const data = await store.getData();
  data.goals = body.goals;
  await store.saveData(data);

  return NextResponse.json({ ok: true });
}
