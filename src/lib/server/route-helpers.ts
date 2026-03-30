import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "./auth";

export type RouteResult = "success" | "unauthorized" | "client_error" | "server_error";

export type RouteLogContext = {
  route: string;
  correlationId: string;
  startedAtMs: number;
  sessionMode: "full" | "demo" | "none";
  sessionSubject: string | null;
};

export function beginRouteRequest(request: NextRequest, route: string): RouteLogContext {
  const session = getSessionFromRequest(request);

  return {
    route,
    correlationId: request.headers.get("x-correlation-id") || request.headers.get("x-request-id") || randomUUID(),
    startedAtMs: Date.now(),
    sessionMode: session?.mode || "none",
    sessionSubject: session?.sub || null,
  };
}

export function logRouteCompletion(
  context: RouteLogContext,
  details: {
    status: number;
    result: RouteResult;
    errorClass?: string | null;
    userContext?: Record<string, unknown>;
  },
): void {
  const latencyMs = Date.now() - context.startedAtMs;

  console.info(
    JSON.stringify({
      event: "api.request.completed",
      route: context.route,
      correlationId: context.correlationId,
      sessionMode: context.sessionMode,
      sessionSubject: context.sessionSubject,
      latencyMs,
      status: details.status,
      result: details.result,
      errorClass: details.errorClass || null,
      userContext: details.userContext || null,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function routeJson(
  context: RouteLogContext,
  body: unknown,
  details: {
    status?: number;
    result: RouteResult;
    errorClass?: string | null;
    userContext?: Record<string, unknown>;
  },
): NextResponse {
  const status = details.status ?? 200;
  logRouteCompletion(context, {
    status,
    result: details.result,
    errorClass: details.errorClass,
    userContext: details.userContext,
  });

  const response = NextResponse.json(body, { status });
  response.headers.set("x-correlation-id", context.correlationId);
  return response;
}

export function classifyError(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    typeof (error as { name: unknown }).name === "string"
  ) {
    return (error as { name: string }).name;
  }

  return "UnknownError";
}

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
