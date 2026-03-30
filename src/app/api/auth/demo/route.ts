import type { NextRequest } from "next/server";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/server/auth";
import { beginRouteRequest, routeJson } from "@/lib/server/route-helpers";

export async function POST(request: NextRequest) {
  const route = beginRouteRequest(request, "/api/auth/demo");
  const token = createSessionToken("demo");
  const response = routeJson(route, { ok: true, mode: "demo" as const }, {
    result: "success",
    userContext: { authMode: "demo" },
  });

  response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions());

  return response;
}
