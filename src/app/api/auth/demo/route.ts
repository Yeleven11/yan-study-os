import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/server/auth";

export async function POST() {
  const token = createSessionToken("demo");
  const response = NextResponse.json({ ok: true, mode: "demo" as const });

  response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions());

  return response;
}
