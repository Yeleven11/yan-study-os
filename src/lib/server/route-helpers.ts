import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "./auth";

export function requireSession(request: NextRequest): NextResponse | null {
  const session = getSessionFromRequest(request);

  if (!session || session.mode === "demo") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}
