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

type ConfiguredTokenInfo = {
  token: string;
  source: string | null;
  rawLength: number;
  hasConfiguredVar: boolean;
};

function getConfiguredTokenInfo(): ConfiguredTokenInfo {
  const candidates: Array<[string, string | undefined]> = [
    ["HEALTH_EXPORT_BEARER_TOKEN", process.env.HEALTH_EXPORT_BEARER_TOKEN],
    ["HEALTH_EXPORT_BEARER_TOKE", process.env.HEALTH_EXPORT_BEARER_TOKE],
    ["HEALTH_EXPORT_TOKEN", process.env.HEALTH_EXPORT_TOKEN],
    ["HEALTH_TOKEN", process.env.HEALTH_TOKEN],
    ["AUTHORIZATION", process.env.AUTHORIZATION],
    ["Authorization", process.env.Authorization],
  ];

  let hasConfiguredVar = false;

  for (const [key, raw] of candidates) {
    if (raw === undefined) {
      continue;
    }

    hasConfiguredVar = true;
    const token = normalizeToken(raw);
    if (token) {
      return {
        token,
        source: key,
        rawLength: raw.length,
        hasConfiguredVar,
      };
    }
  }

  return {
    token: "",
    source: null,
    rawLength: 0,
    hasConfiguredVar,
  };
}

function getBearerTokenFromHeader(authorizationHeader: string): string {
  const match = authorizationHeader.trim().match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]) {
    return "";
  }

  return normalizeToken(match[1]);
}

function unauthorizedResponse(
  status: 401,
  reason:
    | "no_token_or_session"
    | "missing_request_token"
    | "token_mismatch",
  details: {
    hasAuthorizationHeader: boolean;
    hasAltHeader: boolean;
    hasQueryToken: boolean;
    configuredTokenLength: number;
    configuredTokenSource: string | null;
    configuredTokenRawLength: number;
    hasConfiguredTokenVar: boolean;
    dataBackendEnv: string | null;
  },
): NextResponse {
  return NextResponse.json(
    {
      error: "Unauthorized",
      reason,
      diagnostics: details,
    },
    { status },
  );
}

function requireIngestAuth(request: NextRequest): NextResponse | null {
  const tokenInfo = getConfiguredTokenInfo();
  const token = tokenInfo.token;
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = getBearerTokenFromHeader(authorization);
  const altHeaderToken = normalizeToken(
    request.headers.get("x-health-export-token") || request.headers.get("x-health-token") || undefined,
  );
  const queryToken = normalizeToken(
    request.nextUrl.searchParams.get("ingest_token") ||
      request.nextUrl.searchParams.get("token") ||
      undefined,
  );
  const candidates = [bearerToken, altHeaderToken, queryToken].filter(
    (value): value is string => Boolean(value),
  );

  if (!token) {
    const sessionUnauthorized = requireSession(request);
    if (sessionUnauthorized) {
      return unauthorizedResponse(401, "no_token_or_session", {
        hasAuthorizationHeader: Boolean(authorization),
        hasAltHeader: Boolean(altHeaderToken),
        hasQueryToken: Boolean(queryToken),
        configuredTokenLength: 0,
        configuredTokenSource: tokenInfo.source,
        configuredTokenRawLength: tokenInfo.rawLength,
        hasConfiguredTokenVar: tokenInfo.hasConfiguredVar,
        dataBackendEnv: process.env.DATA_BACKEND || null,
      });
    }

    return null;
  }

  if (candidates.length === 0) {
    return unauthorizedResponse(401, "missing_request_token", {
      hasAuthorizationHeader: Boolean(authorization),
      hasAltHeader: Boolean(altHeaderToken),
      hasQueryToken: Boolean(queryToken),
      configuredTokenLength: token.length,
      configuredTokenSource: tokenInfo.source,
      configuredTokenRawLength: tokenInfo.rawLength,
      hasConfiguredTokenVar: tokenInfo.hasConfiguredVar,
      dataBackendEnv: process.env.DATA_BACKEND || null,
    });
  }

  const matched = candidates.some((candidate) => tokensMatch(token, candidate));
  if (!matched) {
    return unauthorizedResponse(401, "token_mismatch", {
      hasAuthorizationHeader: Boolean(authorization),
      hasAltHeader: Boolean(altHeaderToken),
      hasQueryToken: Boolean(queryToken),
      configuredTokenLength: token.length,
      configuredTokenSource: tokenInfo.source,
      configuredTokenRawLength: tokenInfo.rawLength,
      hasConfiguredTokenVar: tokenInfo.hasConfiguredVar,
      dataBackendEnv: process.env.DATA_BACKEND || null,
    });
  }

  return null;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireIngestAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
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
      reconcile: imported.summary.reconcile,
    });
  } catch (error) {
    const err = error as {
      name?: string;
      message?: string;
      "$metadata"?: { httpStatusCode?: number };
      Code?: string;
    };

    return NextResponse.json(
      {
        error: "Health import failed",
        failure: {
          name: err?.name || null,
          message: err?.message || "Unknown server error",
          code: err?.Code || null,
          httpStatusCode: err?.$metadata?.httpStatusCode || null,
          dataBackend: process.env.DATA_BACKEND || null,
          sessionsTable: process.env.YAN_STUDY_SESSIONS_TABLE || null,
          todosTable: process.env.YAN_STUDY_TODOS_TABLE || null,
          settingsTable: process.env.YAN_STUDY_SETTINGS_TABLE || null,
          awsRegion: process.env.AWS_REGION || null,
        },
      },
      { status: 500 },
    );
  }
}
