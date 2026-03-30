import type { NextRequest } from "next/server";
import { getSessionCookieName } from "@/lib/server/auth";
import { beginRouteRequest, routeJson } from "@/lib/server/route-helpers";

export async function POST(request: NextRequest) {
  const route = beginRouteRequest(request, "/api/auth/logout");
  const response = routeJson(route, { ok: true }, { result: "success" });
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
