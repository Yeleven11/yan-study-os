import type { NextRequest } from "next/server";
import { NextResponse, userAgent } from "next/server";

const MOBILE_ONLY_REDIRECT_PATHS = new Set([
  "/",
  "/flashcards",
  "/notes",
  "/papers",
  "/planner",
  "/syllabus",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!MOBILE_ONLY_REDIRECT_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const deviceType = userAgent(request).device.type;
  const isMobile = deviceType === "mobile";

  if (!isMobile) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/timeline";
  redirectUrl.search = "";

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/", "/flashcards", "/notes", "/papers", "/planner", "/syllabus"],
};
