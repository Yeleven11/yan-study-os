import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    mode: session.mode || "full",
    issuedAt: new Date(session.iat * 1000).toISOString(),
    expiresAt: new Date(session.exp * 1000).toISOString(),
  });
}
