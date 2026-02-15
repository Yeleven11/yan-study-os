import crypto from "node:crypto";

const bytes = 32;
const token = crypto.randomBytes(bytes).toString("hex");

console.log(token);
