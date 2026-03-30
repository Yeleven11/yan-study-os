import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { beginRouteRequest, routeJson } from "@/lib/server/route-helpers";

export async function GET(request: NextRequest) {
  const route = beginRouteRequest(request, "/api/auth/session");
  const session = getSessionFromRequest(request);
  if (!session) {
    return routeJson(route, { authenticated: false }, {
      result: "success",
      userContext: { authenticated: false },
    });
  }

  return routeJson(route, {
    authenticated: true,
    mode: session.mode || "full",
    issuedAt: new Date(session.iat * 1000).toISOString(),
    expiresAt: new Date(session.exp * 1000).toISOString(),
  }, {
    result: "success",
    userContext: { authenticated: true },
  });
}
