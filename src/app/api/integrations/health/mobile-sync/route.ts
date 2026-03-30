import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireHealthIngestAuth } from "@/lib/server/health-ingest-auth";
import { importMobileSyncPayload } from "@/lib/server/health-mobile";
import { normalizeMobileSyncRequest } from "@/lib/server/health-mobile-contract";
import {
  buildIdempotencyRow,
  hasProcessedIdempotencyKey,
  normalizeIdempotencyKey,
  stableRequestHash,
  upsertDeadLetter,
} from "@/lib/server/health-ingest";
import { getDashboardStore } from "@/lib/server/store";
import type { MobileSyncResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  const unauthorized = requireHealthIngestAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  const rawBody = await request.json().catch(() => null);
  const normalized = normalizeMobileSyncRequest(rawBody);
  if (!normalized.payload) {
    return NextResponse.json(
      {
        error: normalized.error || "Invalid mobile sync payload",
      },
      { status: 400 },
    );
  }

  const headerIdempotencyKey = normalizeIdempotencyKey(request.headers.get("idempotency-key"));
  const idempotencyKey =
    headerIdempotencyKey || normalizeIdempotencyKey(normalized.payload.idempotencyKey);

  const store = getDashboardStore();

  try {
    const data = await store.getData();
    if (idempotencyKey && hasProcessedIdempotencyKey(data, "mobile", idempotencyKey)) {
      return NextResponse.json(
        {
          ok: true,
          schemaVersion: normalized.payload.schemaVersion,
          importedHealthDays: 0,
          importedWorkouts: 0,
          updatedWorkouts: 0,
          filesProcessed: 0,
          filesSkipped: 1,
          linkedStreams: 0,
          duplicateBatch: true,
          serverTime: new Date().toISOString(),
          nextSuggestedSyncSeconds: 30 * 60,
        } satisfies MobileSyncResponse,
      );
    }

    const imported = importMobileSyncPayload(data, {
      ...normalized.payload,
      idempotencyKey,
    });

    if (idempotencyKey) {
      imported.nextData.healthRawRows = [
        ...imported.nextData.healthRawRows,
        buildIdempotencyRow("mobile", idempotencyKey, normalized.payload.schemaVersion),
      ];
    }

    await store.saveData(imported.nextData);

    const intervalMinutes = normalized.payload.settings?.syncIntervalMinutes;
    const boundedIntervalMinutes =
      typeof intervalMinutes === "number" ? Math.max(15, Math.min(180, intervalMinutes)) : 30;

    const response: MobileSyncResponse = {
      ok: true,
      schemaVersion: normalized.payload.schemaVersion,
      importedHealthDays: imported.summary.importedHealthDays,
      importedWorkouts: imported.summary.importedWorkouts,
      updatedWorkouts: imported.summary.updatedWorkouts,
      filesProcessed: imported.summary.filesProcessed,
      filesSkipped: imported.summary.filesSkipped,
      linkedStreams: imported.summary.linkedStreams,
      duplicateBatch: imported.summary.duplicateBatch,
      serverTime: new Date().toISOString(),
      nextSuggestedSyncSeconds: boundedIntervalMinutes * 60,
    };

    return NextResponse.json(response);
  } catch (error) {
    const err = error as {
      name?: string;
      message?: string;
      "$metadata"?: { httpStatusCode?: number };
      Code?: string;
    };

    const payloadPreview = JSON.stringify(rawBody || {}).slice(0, 2000);
    const requestHash = stableRequestHash(payloadPreview || "{}");
    const existing = await store.getData();
    const withDeadLetter = upsertDeadLetter(existing, {
      id: createHash("sha256").update(`dead|mobile|${requestHash}`).digest("hex").slice(0, 24),
      channel: "mobile",
      idempotencyKey,
      schemaVersion: normalized.payload.schemaVersion,
      requestHash,
      payloadPreview,
      errorCode: err?.Code || err?.name || "MOBILE_IMPORT_FAILED",
      errorMessage: err?.message || "Unknown server error",
    });
    await store.saveData(withDeadLetter);

    return NextResponse.json(
      {
        error: "Mobile health sync failed",
        failure: {
          name: err?.name || null,
          message: err?.message || "Unknown server error",
          code: err?.Code || null,
          httpStatusCode: err?.$metadata?.httpStatusCode || null,
          dataBackend: process.env.DATA_BACKEND || null,
          awsRegion: process.env.AWS_REGION || null,
          deadLettered: true,
        },
      },
      { status: 500 },
    );
  }
}
