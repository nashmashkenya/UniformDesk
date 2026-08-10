import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

/** Paths that do not require a session cookie. */
const PUBLIC_PATHS: RegExp[] = [
  /^\/login$/,
  /^\/sso$/,
  /^\/offline$/,
  /^\/issue-offline$/,
  /^\/v\//,
  /^\/api\/v1\/payments\/mpesa\/callback$/,
  /^\/api\/v1\/roster\/sync$/,
  /^\/api\/v1\/sso\/exchange$/,
  /^\/manifest\.webmanifest$/,
  /^\/sw\.js$/,
  /^\/icons\//,
  /^\/sample-students\.csv$/,
];

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((re) => re.test(pathname));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-ud-pathname", pathname);

  if (isPublicPath(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = token ? await verifySessionToken(token) : null;

  if (!userId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const login = request.nextUrl.clone();
    login.pathname = "/login";
    if (pathname !== "/") {
      login.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(login);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
