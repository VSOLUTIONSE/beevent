import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(COOKIE_NAME)?.value;

  const protectedPaths = ["/dashboard", "/book"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const authPaths = ["/login", "/signup"];
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));

  if (isAuthPage && sessionToken) {
    return NextResponse.redirect(new URL("/book", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/book/:path*", "/login", "/signup"],
};
