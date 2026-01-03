import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "admin_session";

// Helper to parse the signed session cookie
function parseSignedSession(cookieValue: string): { token: string; expiresAt: number } | null {
  try {
    // Session format is: JSON_PAYLOAD.SIGNATURE
    const dotIndex = cookieValue.lastIndexOf(".");
    if (dotIndex === -1) {
      // Old format without signature - treat as invalid
      return null;
    }
    const payload = cookieValue.substring(0, dotIndex);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (except /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

    // If no session cookie, redirect to login
    if (!sessionCookie?.value) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Lightweight check - just verify cookie exists and parse is valid
    // Actual auth validation (including HMAC) happens in server components/actions
    const session = parseSignedSession(sessionCookie.value);
    if (!session || !session.token || session.expiresAt < Date.now()) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already logged in and trying to access login page, redirect to admin
  if (pathname === "/admin/login") {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    if (sessionCookie?.value) {
      const session = parseSignedSession(sessionCookie.value);
      if (session && session.token && session.expiresAt > Date.now()) {
        const adminUrl = new URL("/admin", request.url);
        return NextResponse.redirect(adminUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

