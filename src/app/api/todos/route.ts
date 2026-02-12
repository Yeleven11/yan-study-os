import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { TodoItem } from "@/lib/types";
import { getDashboardStore } from "@/lib/server/store";
import { badRequest, requireSession } from "@/lib/server/route-helpers";

function isValidTodo(input: unknown): input is TodoItem {
  if (!input || typeof input !== "object") {
    return false;
  }

  const candidate = input as TodoItem;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.subjectId === "string" &&
    typeof candidate.deadline === "string" &&
    typeof candidate.ultraPriority === "boolean" &&
    typeof candidate.completed === "boolean" &&
    typeof candidate.archived === "boolean" &&
    typeof candidate.createdAt === "string"
  );
}

export async function GET(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const store = getDashboardStore();
  const data = await store.getData();
  return NextResponse.json({ data: data.todos });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);
  if (!isValidTodo(body)) {
    return badRequest("Invalid todo payload");
  }

  const store = getDashboardStore();
  await store.addTodo(body);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const patch = body?.patch as Partial<TodoItem> | undefined;

  if (!id || !patch || typeof patch !== "object") {
    return badRequest("Invalid todo patch payload");
  }

  const store = getDashboardStore();
  await store.updateTodo(id, patch);
  return NextResponse.json({ ok: true });
}
