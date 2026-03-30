import { createHash } from "node:crypto";
import type { AppData, HealthImportDeadLetter, HealthRawRow } from "@/lib/types";

export const CSV_SUPPORTED_SCHEMA_VERSIONS = [1] as const;

export function normalizeIdempotencyKey(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function hasProcessedIdempotencyKey(
  data: AppData,
  channel: "csv" | "mobile" | "batch",
  key: string,
): boolean {
  return data.healthRawRows.some(
    (row) => row.values.channel === channel && row.values.idempotencyKey === key,
  );
}

export function buildIdempotencyRow(
  channel: "csv" | "mobile" | "batch",
  key: string,
  schemaVersion: number,
): HealthRawRow {
  const now = new Date().toISOString();
  const id = createHash("sha256").update(`idempotency|${channel}|${key}`).digest("hex").slice(0, 24);
  return {
    id,
    fileId: `idempotency-${channel}`,
    rowIndex: 0,
    timestamp: now,
    values: {
      channel,
      idempotencyKey: key,
      schemaVersion: String(schemaVersion),
      recordedAt: now,
    },
  };
}

export function upsertDeadLetter(
  data: AppData,
  deadLetter: Omit<HealthImportDeadLetter, "retryCount" | "firstFailedAt" | "lastFailedAt">,
): AppData {
  const now = new Date().toISOString();
  const existing = data.healthImportDeadLetters.find(
    (item) => item.channel === deadLetter.channel && item.requestHash === deadLetter.requestHash,
  );

  const next: HealthImportDeadLetter = existing
    ? {
        ...existing,
        retryCount: existing.retryCount + 1,
        lastFailedAt: now,
        errorCode: deadLetter.errorCode,
        errorMessage: deadLetter.errorMessage,
      }
    : {
        ...deadLetter,
        retryCount: 1,
        firstFailedAt: now,
        lastFailedAt: now,
      };

  return {
    ...data,
    healthImportDeadLetters: [
      ...data.healthImportDeadLetters.filter((item) => item.id !== next.id),
      next,
    ],
  };
}

export function stableRequestHash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
