import { createHash, randomBytes, scryptSync } from "node:crypto";

const passcode = process.argv[2];

if (!passcode) {
  console.error("Usage: node scripts/generate-passcode-hash.mjs <passcode>");
  process.exit(1);
}

const n = 16384;
const r = 8;
const p = 1;
const salt = randomBytes(16);
const hash = scryptSync(passcode, salt, 64, { N: n, r, p });
const fingerprint = createHash("sha256").update(hash).digest("hex").slice(0, 12);

console.log(`scrypt$${n}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`);
console.log(`fingerprint:${fingerprint}`);
