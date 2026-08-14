import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/config";

const AUTH_PATHS = new Set(["/login", "/signup"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const isAuth = AUTH_PATHS.has(pathname);

  if (!session && !isAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session && isAuth) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
