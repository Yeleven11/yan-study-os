import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "./auth";

export function requireSession(request: NextRequest): NextResponse | null {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}
