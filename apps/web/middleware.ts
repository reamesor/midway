import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Serve the exact midway-intro.html at `/` (visual source of truth). */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/midway-intro.html", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
