import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import type { DashboardStore } from "@/lib/server/store/types";

const IDEMPOTENCY_TTL_MS = 1000 * 60 * 60 * 24;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = canonicalize((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }

  return value;
}

export function hashIdempotencyPayload(payload: unknown): string {
  const canonical = JSON.stringify(canonicalize(payload));
  return createHash("sha256").update(canonical).digest("hex");
}

export async function respondWithIdempotency<T>(params: {
  store: DashboardStore;
  scope: string;
  key: string | null;
  payloadHash: string;
  handler: () => Promise<{ status?: number; body: T }>;
  now?: Date;
  ttlMs?: number;
}) {
  const { store, scope, key, payloadHash, handler } = params;
  if (!key || key.trim().length === 0) {
    const result = await handler();
    return NextResponse.json(result.body, { status: result.status ?? 200 });
  }

  const record = await store.getIdempotencyRecord(scope, key);
  if (record) {
    if (record.payloadHash !== payloadHash) {
      return NextResponse.json(
        { error: "Idempotency key replay payload mismatch" },
        { status: 409 },
      );
    }

    return NextResponse.json(record.body, { status: record.status });
  }

  const result = await handler();
  const now = params.now ?? new Date();
  const ttlMs = params.ttlMs ?? IDEMPOTENCY_TTL_MS;
  await store.putIdempotencyRecord({
    scope,
    key,
    payloadHash,
    status: result.status ?? 200,
    body: result.body,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
  });

  return NextResponse.json(result.body, { status: result.status ?? 200 });
}
