import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest } from "@/lib/server/route-helpers";
import { importHealthFiles } from "@/lib/server/health-csv";
import { requireHealthIngestAuth } from "@/lib/server/health-ingest-auth";
import { normalizeHealthIngestRequest } from "@/lib/server/health-ingest-request";

const INVALID_BODY_MESSAGE =
  "Expected JSON { csv } or { files }, raw CSV text body, or multipart/form-data with CSV files.";

export async function POST(request: NextRequest) {
  const unauthorized = requireHealthIngestAuth(request);
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
