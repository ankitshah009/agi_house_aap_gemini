import { NextRequest, NextResponse } from "next/server";
import { authkit, handleAuthkitHeaders } from "@workos-inc/authkit-nextjs";

const workosEnabled = Boolean(
  process.env.WORKOS_API_KEY && process.env.WORKOS_CLIENT_ID && process.env.WORKOS_COOKIE_PASSWORD,
);
const authRequired = process.env.AUTH_REQUIRED === "1";

const PUBLIC_PREFIXES = ["/login", "/callback", "/logout", "/api/health"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default async function proxy(request: NextRequest) {
  if (!workosEnabled) {
    return NextResponse.next();
  }

  const { session, headers, authorizationUrl } = await authkit(request, {
    debug: process.env.NODE_ENV === "development",
  });
  const { pathname } = request.nextUrl;

  if (authRequired && !session.user && !isPublic(pathname) && authorizationUrl) {
    return handleAuthkitHeaders(request, headers, { redirect: authorizationUrl });
  }

  return handleAuthkitHeaders(request, headers);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
