export type HealthIngestFile = {
  filename: string;
  csv: string;
};

export type ParseHealthIngestRequestOptions = {
  defaultFilename?: string;
  allowRawText?: boolean;
  acceptJsonSingleCsv?: boolean;
  acceptJsonFiles?: boolean;
};

const CSV_CONTENT_TYPES = new Set([
  "text/csv",
  "application/csv",
  "text/comma-separated-values",
  "application/vnd.ms-excel",
]);

function normalizeFilename(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value.split(/[\\/]/).pop()?.trim() || "";
}

function ensureCsvExtension(value: string): string {
  if (/\.csv$/i.test(value)) {
    return value;
  }

  return `${value}.csv`;
}

function csvLikeFile(file: File): boolean {
  const filename = normalizeFilename(file.name).toLowerCase();
  if (filename.endsWith(".csv")) {
    return true;
  }

  const contentType = file.type.toLowerCase();
  return CSV_CONTENT_TYPES.has(contentType);
}

function fallbackFilename(formKey: string, index: number): string {
  const normalizedKey = formKey
    .trim()
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  if (normalizedKey.length > 0) {
    return ensureCsvExtension(normalizedKey);
  }

  return `upload-${index + 1}.csv`;
}

function toIngestFile(filename: string, csv: string): HealthIngestFile | null {
  if (!csv.trim()) {
    return null;
  }

  const normalized = normalizeFilename(filename);
  const safeFilename =
    normalized.length > 0 ? ensureCsvExtension(normalized) : "HealthAutoExport.csv";

  return {
    filename: safeFilename,
    csv,
  };
}

async function parseMultipartCsvFiles(request: Request): Promise<HealthIngestFile[]> {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return [];
  }

  const files: HealthIngestFile[] = [];
  const entries = Array.from(form.entries());

  for (let index = 0; index < entries.length; index += 1) {
    const [key, value] = entries[index];
    if (typeof value === "string") {
      continue;
    }

    if (!csvLikeFile(value)) {
      continue;
    }

    const csv = await value.text();
    const rawFilename = normalizeFilename(value.name);
    const filename =
      rawFilename && rawFilename.toLowerCase() !== "blob"
        ? rawFilename
        : fallbackFilename(key, index);
    const resolved = toIngestFile(filename, csv);

    if (resolved) {
      files.push(resolved);
    }
  }

  return files;
}

function parseJsonCsvFiles(
  body: unknown,
  options: Required<Pick<ParseHealthIngestRequestOptions, "acceptJsonFiles" | "acceptJsonSingleCsv" | "defaultFilename">>,
): HealthIngestFile[] {
  if (!body || typeof body !== "object") {
    return [];
  }

  const files: HealthIngestFile[] = [];
  const record = body as {
    csv?: unknown;
    filename?: unknown;
    files?: unknown;
  };

  if (options.acceptJsonFiles && Array.isArray(record.files)) {
    for (const entry of record.files) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const file = entry as { filename?: unknown; csv?: unknown };
      if (typeof file.filename !== "string" || typeof file.csv !== "string") {
        continue;
      }

      const normalized = toIngestFile(file.filename, file.csv);
      if (normalized) {
        files.push(normalized);
      }
    }
  }

  if (options.acceptJsonSingleCsv && typeof record.csv === "string") {
    const rawFilename =
      typeof record.filename === "string" && record.filename.trim().length > 0
        ? record.filename
        : options.defaultFilename;
    const normalized = toIngestFile(rawFilename, record.csv);
    if (normalized) {
      files.push(normalized);
    }
  }

  return files;
}

export async function normalizeHealthIngestRequest(
  request: Request,
  options: ParseHealthIngestRequestOptions = {},
): Promise<HealthIngestFile[]> {
  const config = {
    defaultFilename: options.defaultFilename || "HealthAutoExport.csv",
    allowRawText: options.allowRawText ?? false,
    acceptJsonSingleCsv: options.acceptJsonSingleCsv ?? true,
    acceptJsonFiles: options.acceptJsonFiles ?? true,
  };

  const contentType = (request.headers.get("content-type") || "").toLowerCase();

  if (contentType.includes("multipart/form-data")) {
    return parseMultipartCsvFiles(request);
  }

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    return parseJsonCsvFiles(body, config);
  }

  if (!config.allowRawText) {
    return [];
  }

  const raw = await request.text().catch(() => "");
  const normalized = toIngestFile(config.defaultFilename, raw);
  return normalized ? [normalized] : [];
}
