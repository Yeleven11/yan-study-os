import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createDefaultPlannerProfile } from "@/lib/constants";
import type { PlannerProfile, PlannerTimeWindow } from "@/lib/types";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

function isValidClock(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function isValidWindow(value: PlannerTimeWindow): boolean {
  return (
    value &&
    typeof value.start === "string" &&
    typeof value.end === "string" &&
    isValidClock(value.start) &&
    isValidClock(value.end)
  );
}

function isValidPlannerProfile(input: unknown): input is PlannerProfile {
  if (!input || typeof input !== "object") {
    return false;
  }

  const candidate = input as PlannerProfile;

  if (
    typeof candidate.horizonDays !== "number" ||
    !Number.isFinite(candidate.horizonDays) ||
    candidate.horizonDays < 3 ||
    candidate.horizonDays > 14
  ) {
    return false;
  }

  if (!Array.isArray(candidate.weeklyTemplate) || candidate.weeklyTemplate.length !== 7) {
    return false;
  }

  for (const template of candidate.weeklyTemplate) {
    if (!template || typeof template.dayOfWeek !== "number") {
      return false;
    }
    if (!Array.isArray(template.studyWindows) || !Array.isArray(template.blockedWindows)) {
      return false;
    }
    if (!template.studyWindows.every(isValidWindow)) {
      return false;
    }
    if (!template.blockedWindows.every(isValidWindow)) {
      return false;
    }
  }

  return true;
}

export async function GET(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const store = getDashboardStore();
  const data = await store.getData();

  return NextResponse.json({
    data: data.plannerProfile || createDefaultPlannerProfile(data.settings.timezone),
  });
}

export async function PUT(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);

  if (!isValidPlannerProfile(body?.profile)) {
    return badRequest("Invalid planner profile payload");
  }

  const store = getDashboardStore();
  const data = await store.getData();
  data.plannerProfile = {
    ...body.profile,
    updatedAt: new Date().toISOString(),
  };
  await store.saveData(data);

  return NextResponse.json({ ok: true, data: data.plannerProfile });
}
