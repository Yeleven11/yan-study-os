import { createDynamoStore } from "./dynamo-store";
import { createLocalFileStore } from "./local-file-store";
import type { DashboardStore } from "./types";

let store: DashboardStore | null = null;

function shouldUseDynamo(): boolean {
  return process.env.DATA_BACKEND === "dynamodb";
}

export function getDashboardStore(): DashboardStore {
  if (store) {
    return store;
  }

  if (shouldUseDynamo()) {
    store = createDynamoStore();
    return store;
  }

  store = createLocalFileStore();
  return store;
}
