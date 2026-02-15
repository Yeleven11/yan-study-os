import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { applyPlannerRun } from "@/lib/planner-engine";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

type PlannerApplyRequest = {
  runId?: string;
};

export async function POST(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = (await request.json().catch(() => ({}))) as PlannerApplyRequest;
  if (!body.runId || typeof body.runId !== "string") {
    return badRequest("runId is required");
  }

  const store = getDashboardStore();
  const data = await store.getData();
  const run = data.plannerRuns.find((item) => item.id === body.runId);
  if (!run) {
    return badRequest("Planner run not found");
  }

  const nextData = run.applied ? data : applyPlannerRun(data, run);
  if (!run.applied) {
    await store.saveData(nextData);
  }

  const appliedRun = nextData.plannerRuns.find((item) => item.id === body.runId) || run;

  return NextResponse.json({
    ok: true,
    data: appliedRun,
    plannedTargets: nextData.plannedTargets.length,
  });
}
