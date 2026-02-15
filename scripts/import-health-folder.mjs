#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

async function readCsvFiles(folderPath) {
  const entries = await readdir(folderPath);
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(folderPath, entry);
    const info = await stat(absolute);
    if (!info.isFile() || !entry.toLowerCase().endsWith(".csv")) {
      continue;
    }

    const csv = await readFile(absolute, "utf8");
    files.push({ filename: entry, csv });
  }

  return files;
}

async function main() {
  const folderArg = process.argv[2];
  const baseUrl = process.argv[3] || process.env.HEALTH_IMPORT_BASE_URL || "http://localhost:3000";

  if (!folderArg) {
    console.error("Usage: node scripts/import-health-folder.mjs <folder> [baseUrl]");
    process.exit(1);
  }

  const folderPath = path.resolve(folderArg);
  const files = await readCsvFiles(folderPath);

  if (files.length === 0) {
    console.error(`No CSV files found in: ${folderPath}`);
    process.exit(1);
  }

  const headers = { "Content-Type": "application/json" };
  const token = process.env.HEALTH_EXPORT_BEARER_TOKEN;
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}/api/integrations/health/import-batch`, {
    method: "POST",
    headers,
    body: JSON.stringify({ files }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Import failed:", payload);
    process.exit(1);
  }

  console.log("Batch import complete");
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
