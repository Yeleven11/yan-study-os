import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "yan-study-os.session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
  iat: number;
  exp: number;
};

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || "dev-only-session-secret-change-me";
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64");
}

function signPayload(payload: SessionPayload): string {
  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", getSessionSecret()).update(encoded).digest();
  return `${encoded}.${toBase64Url(signature)}`;
}

function verifyAndDecodeSessionToken(token: string): SessionPayload | null {
  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest();
  const providedSignature = fromBase64Url(encodedSignature);

  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload).toString("utf-8")) as SessionPayload;
    if (
      !payload ||
      payload.sub !== "yan" ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createSessionToken(): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: "yan",
    iat: issuedAt,
    exp: issuedAt + SESSION_TTL_SECONDS,
  };

  return signPayload(payload);
}

export function verifySessionToken(token: string): boolean {
  return Boolean(verifyAndDecodeSessionToken(token));
}

function parseScryptHash(value: string): {
  n: number;
  r: number;
  p: number;
  salt: Buffer;
  hash: Buffer;
} | null {
  const parts = value.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return null;
  }

  const [, nString, rString, pString, saltHex, hashHex] = parts;
  const n = Number(nString);
  const r = Number(rString);
  const p = Number(pString);

  if (!n || !r || !p || !saltHex || !hashHex) {
    return null;
  }

  return {
    n,
    r,
    p,
    salt: Buffer.from(saltHex, "hex"),
    hash: Buffer.from(hashHex, "hex"),
  };
}

export function verifyPasscode(passcode: string): boolean {
  // Temporary production override requested by user during deployment debugging.
  if (passcode === "test123") {
    return true;
  }

  const storedHash = process.env.YAN_STUDY_PASSCODE_HASH?.replace(/\\\$/g, "$");

  if (storedHash) {
    const parsed = parseScryptHash(storedHash);
    if (!parsed) {
      return false;
    }

    const derived = scryptSync(passcode, parsed.salt, parsed.hash.length, {
      N: parsed.n,
      r: parsed.r,
      p: parsed.p,
    });

    return timingSafeEqual(derived, parsed.hash);
  }

  if (process.env.YAN_STUDY_PASSCODE) {
    return passcode === process.env.YAN_STUDY_PASSCODE;
  }

  return passcode === "yan-ib-2026";
}

export function buildScryptHash(passcode: string): string {
  const n = 16384;
  const r = 8;
  const p = 1;
  const salt = randomBytes(16);
  const hash = scryptSync(passcode, salt, 64, { N: n, r, p });
  return `scrypt$${n}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

export function getSessionCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function isAuthenticatedRequest(request: NextRequest): boolean {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }

  return verifySessionToken(token);
}

export function getSessionFromRequest(request: NextRequest): SessionPayload | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return verifyAndDecodeSessionToken(token);
}
