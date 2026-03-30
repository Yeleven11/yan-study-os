import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultAppData } from "@/lib/constants";
import { hashIdempotencyPayload, respondWithIdempotency } from "@/lib/server/idempotency";
import type { DashboardStore } from "@/lib/server/store/types";

type StoredRecord = {
  scope: string;
  key: string;
  payloadHash: string;
  status: number;
  body: unknown;
  createdAt: string;
  expiresAt: string;
};

function createMockStore() {
  const records = new Map<string, StoredRecord>();
  const state = {
    writeCount: 0,
    handlerCount: 0,
  };

  const store: DashboardStore = {
    async getData() {
      return createDefaultAppData("UTC");
    },
    async saveData() {},
    async appendStudySession() {},
    async addTodo() {},
    async updateTodo() {},
    async archiveTodo() {},
    async restoreTodo() {},
    async updateExams() {},
    async appendHealthRawFiles() {},
    async appendHealthRawRows() {},
    async upsertWorkoutDetails() {},
    async getIdempotencyRecord(scope, key) {
      const record = records.get(`${scope}:${key}`);
      if (!record) {
        return null;
      }
      if (new Date(record.expiresAt).getTime() <= Date.now()) {
        records.delete(`${scope}:${key}`);
        return null;
      }
      return record;
    },
    async putIdempotencyRecord(record) {
      state.writeCount += 1;
      records.set(`${record.scope}:${record.key}`, record);
    },
  };

  return { store, state };
}

test("idempotency returns deterministic response for duplicate submission", async () => {
  const { store, state } = createMockStore();
  const key = "same-key";
  const payload = { csv: "date,sleep\n2026-03-01,7" };

  const first = await respondWithIdempotency({
    store,
    scope: "test.scope",
    key,
    payloadHash: hashIdempotencyPayload(payload),
    handler: async () => {
      state.handlerCount += 1;
      return {
        body: {
          ok: true,
          imported: 1,
          serverTime: "2026-03-30T12:00:00.000Z",
        },
      };
    },
  });

  const second = await respondWithIdempotency({
    store,
    scope: "test.scope",
    key,
    payloadHash: hashIdempotencyPayload(payload),
    handler: async () => {
      state.handlerCount += 1;
      return {
        body: {
          ok: true,
          imported: 999,
          serverTime: "2026-03-30T12:00:01.000Z",
        },
      };
    },
  });

  assert.equal(state.handlerCount, 1);
  assert.equal(state.writeCount, 1);
  assert.deepEqual(await first.json(), await second.json());
});

test("idempotency allows retry after timeout window", async () => {
  const { store, state } = createMockStore();
  const key = "expired-key";
  const payload = { batchId: "batch-1" };

  const firstNow = new Date("2026-03-30T12:00:00.000Z");
  const secondNow = new Date("2026-03-30T12:00:10.000Z");

  await respondWithIdempotency({
    store,
    scope: "test.scope",
    key,
    payloadHash: hashIdempotencyPayload(payload),
    now: firstNow,
    ttlMs: 1000,
    handler: async () => {
      state.handlerCount += 1;
      return { body: { ok: true, imported: 1 } };
    },
  });

  const second = await respondWithIdempotency({
    store,
    scope: "test.scope",
    key,
    payloadHash: hashIdempotencyPayload(payload),
    now: secondNow,
    ttlMs: 1000,
    handler: async () => {
      state.handlerCount += 1;
      return { body: { ok: true, imported: 2 } };
    },
  });

  assert.equal(state.handlerCount, 2);
  assert.equal(state.writeCount, 2);
  assert.deepEqual(await second.json(), { ok: true, imported: 2 });
});

test("idempotency rejects conflicting replay payload", async () => {
  const { store } = createMockStore();
  const key = "conflict-key";

  await respondWithIdempotency({
    store,
    scope: "test.scope",
    key,
    payloadHash: hashIdempotencyPayload({ payload: 1 }),
    handler: async () => ({ body: { ok: true } }),
  });

  const conflict = await respondWithIdempotency({
    store,
    scope: "test.scope",
    key,
    payloadHash: hashIdempotencyPayload({ payload: 2 }),
    handler: async () => ({ body: { ok: true, never: true } }),
  });

  assert.equal(conflict.status, 409);
  assert.deepEqual(await conflict.json(), {
    error: "Idempotency key replay payload mismatch",
  });
});
