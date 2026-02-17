import { createDynamoStore } from "./dynamo-store";
import { createLocalFileStore } from "./local-file-store";
import { createNeonStore } from "./neon-store";
import type { DashboardStore } from "./types";

let store: DashboardStore | null = null;

function getBackendMode(): "local" | "dynamodb" | "neon" {
  const backend = (process.env.DATA_BACKEND || "local").toLowerCase();
  if (backend === "dynamodb") {
    return "dynamodb";
  }
  if (backend === "neon") {
    return "neon";
  }
  return "local";
}

export function getDashboardStore(): DashboardStore {
  if (store) {
    return store;
  }

  const backend = getBackendMode();

  if (backend === "dynamodb") {
    store = createDynamoStore();
    return store;
  }

  if (backend === "neon") {
    store = createNeonStore();
    return store;
  }

  store = createLocalFileStore();
  return store;
}
