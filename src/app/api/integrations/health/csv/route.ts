import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest } from "@/lib/server/route-helpers";
import { importHealthFiles } from "@/lib/server/health-csv";
import { requireHealthIngestAuth } from "@/lib/server/health-ingest-auth";
import { normalizeHealthIngestRequest } from "@/lib/server/health-ingest-request";
import {
  buildIdempotencyRow,
  CSV_SUPPORTED_SCHEMA_VERSIONS,
  hasProcessedIdempotencyKey,
  normalizeIdempotencyKey,
  stableRequestHash,
  upsertDeadLetter,
} from "@/lib/server/health-ingest";

const INVALID_BODY_MESSAGE =
  "Expected JSON { csv } or { files }, raw CSV text body, or multipart/form-data with CSV files.";

export async function POST(request: NextRequest) {
  const unauthorized = requireHealthIngestAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  const schemaHeader = Number(request.headers.get("x-health-schema-version") || "1");
  if (!CSV_SUPPORTED_SCHEMA_VERSIONS.includes(schemaHeader as 1)) {
    return NextResponse.json(
      { error: `Unsupported csv schema version: ${schemaHeader}` },
      { status: 400 },
    );
  }

  const idempotencyKey = normalizeIdempotencyKey(request.headers.get("idempotency-key"));
  const store = getDashboardStore();

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

    const data = await store.getData();
    if (idempotencyKey && hasProcessedIdempotencyKey(data, "csv", idempotencyKey)) {
      return NextResponse.json({
        importedHealthDays: 0,
        importedWorkouts: 0,
        filesProcessed: 0,
        filesSkipped: files.length,
        linkedStreams: 0,
        duplicateRequest: true,
      });
    }

    const imported = importHealthFiles(data, files);
    if (idempotencyKey) {
      imported.nextData.healthRawRows = [
        ...imported.nextData.healthRawRows,
        buildIdempotencyRow("csv", idempotencyKey, schemaHeader),
      ];
    }
    await store.saveData(imported.nextData);

    return NextResponse.json({
      importedHealthDays: imported.summary.importedHealthDays,
      importedWorkouts: imported.summary.importedWorkouts,
      filesProcessed: imported.summary.filesProcessed,
      filesSkipped: imported.summary.filesSkipped + imported.summary.filesIgnored,
      linkedStreams: imported.summary.linkedStreams,
      duplicateRequest: false,
    });
  } catch (error) {
    const err = error as {
      name?: string;
      message?: string;
      "$metadata"?: { httpStatusCode?: number };
      Code?: string;
    };

    const existing = await store.getData();
    const payloadPreview = `schema=${schemaHeader}; key=${idempotencyKey || ""}`;
    const requestHash = stableRequestHash(payloadPreview);
    const withDeadLetter = upsertDeadLetter(existing, {
      id: createHash("sha256").update(`dead|csv|${requestHash}`).digest("hex").slice(0, 24),
      channel: "csv",
      idempotencyKey,
      schemaVersion: schemaHeader,
      requestHash,
      payloadPreview,
      errorCode: err?.Code || err?.name || "CSV_IMPORT_FAILED",
      errorMessage: err?.message || "Unknown server error",
    });
    await store.saveData(withDeadLetter);

    return NextResponse.json(
      {
        error: "Health import failed",
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
