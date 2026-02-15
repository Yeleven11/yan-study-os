import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { generatePlannerRun, applyPlannerRun } from "@/lib/planner-engine";
import type { PlannerProfile, PlannerRunSource } from "@/lib/types";
import { getDashboardStore } from "@/lib/server/store";
import { requireSession } from "@/lib/server/route-helpers";

type PlannerGenerateRequest = {
  profile?: PlannerProfile;
  source?: PlannerRunSource;
  persistProfile?: boolean;
  apply?: boolean;
};

function takeTail<T>(items: T[], max: number): T[] {
  if (items.length <= max) {
    return items;
  }
  return items.slice(items.length - max);
}

export async function POST(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = (await request.json().catch(() => ({}))) as PlannerGenerateRequest;
  const store = getDashboardStore();
  const data = await store.getData();

  const profile = body.profile
    ? {
        ...body.profile,
        updatedAt: new Date().toISOString(),
      }
    : data.plannerProfile;
  const run = generatePlannerRun(
    {
      ...data,
      plannerProfile: profile,
    },
    {
      profile,
      source: body.source || "manual",
      now: new Date(),
    },
  );

  let nextData = {
    ...data,
    plannerRuns: takeTail([...data.plannerRuns, run], 80),
  };

  if (body.persistProfile) {
    nextData = {
      ...nextData,
      plannerProfile: profile,
    };
  }

  const shouldApply = Boolean(body.apply) || profile.applyMode === "write_targets";
  if (shouldApply) {
    nextData = applyPlannerRun(nextData, run);
  }

  await store.saveData(nextData);

  return NextResponse.json({
    data: run,
    applied: shouldApply,
    plannedTargets: nextData.plannedTargets.length,
  });
}
