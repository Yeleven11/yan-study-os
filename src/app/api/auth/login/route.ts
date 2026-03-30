import type { NextRequest } from "next/server";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
  verifyPasscode,
} from "@/lib/server/auth";
import { beginRouteRequest, routeJson } from "@/lib/server/route-helpers";

export async function POST(request: NextRequest) {
  const route = beginRouteRequest(request, "/api/auth/login");
  const body = await request.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";

  if (!passcode) {
    return routeJson(route, { error: "Passcode is required" }, {
      status: 400,
      result: "client_error",
      errorClass: "ValidationError",
    });
  }

  if (!verifyPasscode(passcode)) {
    return routeJson(route, { error: "Invalid passcode" }, {
      status: 401,
      result: "unauthorized",
      errorClass: "AuthenticationError",
    });
  }

  const token = createSessionToken();
  const response = routeJson(route, { ok: true }, {
    result: "success",
    userContext: { authMode: "full" },
  });

  response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions());

  return response;
}
