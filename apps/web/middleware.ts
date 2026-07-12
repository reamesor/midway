import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Serve the exact midway-intro.html at `/` (visual source of truth). */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/midway-intro.html";
    // Preserve ?replay=1 and any other query params for the intro script.
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
