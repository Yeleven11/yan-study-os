import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { importHealthFiles } from "@/lib/server/health-csv";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

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

  const body = await request.json().catch(() => null);
  const files = Array.isArray(body?.files)
    ? body.files.filter(
        (file: unknown): file is { filename: string; csv: string } =>
          Boolean(file) &&
          typeof file === "object" &&
          typeof (file as { filename?: unknown }).filename === "string" &&
          typeof (file as { csv?: unknown }).csv === "string",
      )
    : [];

  if (files.length === 0) {
    return badRequest("Body must include files: [{ filename, csv }]");
  }

  const store = getDashboardStore();
  const data = await store.getData();
  const imported = importHealthFiles(data, files);
  await store.saveData(imported.nextData);

  return NextResponse.json({
    importedHealthDays: imported.summary.importedHealthDays,
    importedWorkouts: imported.summary.importedWorkouts,
    filesProcessed: imported.summary.filesProcessed,
    filesSkipped: imported.summary.filesSkipped + imported.summary.filesIgnored,
    linkedStreams: imported.summary.linkedStreams,
  });
}
