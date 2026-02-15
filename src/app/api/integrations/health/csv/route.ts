import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";
import { importHealthFiles } from "@/lib/server/health-csv";
import { normalizeHealthIngestRequest } from "@/lib/server/health-ingest-request";

const INVALID_BODY_MESSAGE =
  "Expected JSON { csv } or { files }, raw CSV text body, or multipart/form-data with CSV files.";

function tokensMatch(expected: string, provided: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

function normalizeToken(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/^Bearer\s+/i, "")
    .trim();
}

function getConfiguredToken(): string {
  return normalizeToken(
    process.env.HEALTH_EXPORT_BEARER_TOKEN || process.env.HEALTH_EXPORT_BEARER_TOKE,
  );
}

function getBearerTokenFromHeader(authorizationHeader: string): string {
  const match = authorizationHeader.trim().match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]) {
    return "";
  }

  return normalizeToken(match[1]);
}

function requireIngestAuth(request: NextRequest): NextResponse | null {
  const token = getConfiguredToken();

  if (!token) {
    return requireSession(request);
  }

  const authorization = request.headers.get("authorization") || "";
  const rawValue = getBearerTokenFromHeader(authorization);

  if (!rawValue || !tokensMatch(token, rawValue)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireIngestAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  const files = await normalizeHealthIngestRequest(request, {
    allowRawText: true,
    acceptJsonSingleCsv: true,
    acceptJsonFiles: true,
    defaultFilename: "HealthAutoExport.csv",
  });

  if (files.length === 0) {
    return badRequest(INVALID_BODY_MESSAGE);
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
