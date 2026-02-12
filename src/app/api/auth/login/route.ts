import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
  verifyPasscode,
} from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";

  if (!passcode) {
    return NextResponse.json({ error: "Passcode is required" }, { status: 400 });
  }

  if (!verifyPasscode(passcode)) {
    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
  }

  const token = createSessionToken();
  const response = NextResponse.json({ ok: true });

  response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions());

  return response;
}
