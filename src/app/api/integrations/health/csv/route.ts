import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";
import { importSingleHealthCsv } from "@/lib/server/health-csv";

function tokensMatch(expected: string, provided: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

function requireIngestAuth(request: NextRequest): NextResponse | null {
  const token = process.env.HEALTH_EXPORT_BEARER_TOKEN;

  if (!token) {
    return requireSession(request);
  }

  const authorization = request.headers.get("authorization") || "";
  const [scheme, rawValue] = authorization.split(" ");

  if (scheme !== "Bearer" || !rawValue || !tokensMatch(token, rawValue)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireIngestAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  const contentType = request.headers.get("content-type") || "";
  let body: { csv?: string; filename?: string } | null = null;

  let csvText = "";

  if (contentType.includes("application/json")) {
    body = await request.json().catch(() => null);
    csvText = typeof body?.csv === "string" ? body.csv : "";
  } else {
    csvText = await request.text().catch(() => "");
  }

  if (!csvText.trim()) {
    return badRequest("CSV body is required");
  }

  const store = getDashboardStore();
  const data = await store.getData();
  const filename = typeof body?.filename === "string" ? body.filename : "HealthAutoExport.csv";

  const imported = importSingleHealthCsv(data, csvText, filename);
  await store.saveData(imported.nextData);

  return NextResponse.json({
    importedHealthDays: imported.summary.importedHealthDays,
    importedWorkouts: imported.summary.importedWorkouts,
    filesProcessed: imported.summary.filesProcessed,
    filesSkipped: imported.summary.filesSkipped + imported.summary.filesIgnored,
    linkedStreams: imported.summary.linkedStreams,
  });
}
