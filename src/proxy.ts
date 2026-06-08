import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  COOKIE_ACCESS, COOKIE_REFRESH,
  ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS,
  verifyAccessToken, verifyRefreshToken,
  signAccessToken, signRefreshToken,
} from "@/lib/jwt";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    let accessToken = request.cookies.get(COOKIE_ACCESS)?.value;
    let session = accessToken ? verifyAccessToken(accessToken) : null;

    // ── SILENT REFRESH ────────────────────────────────────────────────────────
    // Access token missing/expired but refresh still valid — mint a new pair
    // and let the request proceed. Prevents the user from being booted to login
    // every 15 minutes while they're actively working.
    let rotatedCookies: { access: string; refresh: string } | null = null;
    if (!session) {
        const refreshToken = request.cookies.get(COOKIE_REFRESH)?.value;
        const refreshPayload = refreshToken ? verifyRefreshToken(refreshToken) : null;
        if (refreshPayload) {
            const fresh = {
                userId: refreshPayload.userId,
                email: refreshPayload.email,
                role: refreshPayload.role,
                status: refreshPayload.status,
            };
            accessToken = signAccessToken(fresh);
            const newRefresh = signRefreshToken(fresh);
            session = fresh;
            rotatedCookies = { access: accessToken, refresh: newRefresh };
        }
    }

    const attachRotated = (res: NextResponse) => {
        if (rotatedCookies) {
            res.cookies.set(COOKIE_ACCESS, rotatedCookies.access, ACCESS_COOKIE_OPTIONS);
            res.cookies.set(COOKIE_REFRESH, rotatedCookies.refresh, REFRESH_COOKIE_OPTIONS);
        }
        return res;
    };

    // Builds a NextResponse.next() that forwards the rotated cookies into the
    // downstream request headers — so server components in the same request
    // see the freshly-minted access token instead of the expired one.
    const passthroughWithRotation = () => {
        if (!rotatedCookies) return NextResponse.next();
        const cookieHeader = `${COOKIE_ACCESS}=${rotatedCookies.access}; ${COOKIE_REFRESH}=${rotatedCookies.refresh}`;
        const requestHeaders = new Headers(request.headers);
        // Preserve any unrelated cookies the browser sent (Mongo session, analytics, etc.)
        const existing = request.headers.get("cookie") ?? "";
        const others = existing
            .split(";")
            .map(p => p.trim())
            .filter(p => p && !p.startsWith(`${COOKIE_ACCESS}=`) && !p.startsWith(`${COOKIE_REFRESH}=`))
            .join("; ");
        requestHeaders.set("cookie", others ? `${cookieHeader}; ${others}` : cookieHeader);
        const res = NextResponse.next({ request: { headers: requestHeaders } });
        res.cookies.set(COOKIE_ACCESS, rotatedCookies.access, ACCESS_COOKIE_OPTIONS);
        res.cookies.set(COOKIE_REFRESH, rotatedCookies.refresh, REFRESH_COOKIE_OPTIONS);
        return res;
    };

    // ── 1. UNAUTHENTICATED: block protected routes ────────────────────────────
    if (!session) {
        if (pathname.startsWith("/admin") || pathname.startsWith("/employee")) {
            const res = NextResponse.redirect(new URL("/login", request.url));
            // Clear stale cookies so the login page doesn't loop
            res.cookies.delete(COOKIE_ACCESS);
            res.cookies.delete(COOKIE_REFRESH);
            return res;
        }
        return NextResponse.next();
    }

    // ── 2. PENDING/REJECTED non-admins boot out ───────────────────────────────
    if (session.status !== "ACTIVE" && (pathname.startsWith("/admin") || pathname.startsWith("/employee"))) {
        if (session.role !== "ADMIN") {
            const response = NextResponse.redirect(new URL("/login?error=onboarding_pending", request.url));
            response.cookies.delete(COOKIE_ACCESS);
            response.cookies.delete(COOKIE_REFRESH);
            return response;
        }
    }

    // ── 3. Role isolation ─────────────────────────────────────────────────────
    if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
        return attachRotated(NextResponse.redirect(new URL("/employee/dashboard", request.url)));
    }
    if (pathname.startsWith("/employee") && session.role !== "EMPLOYEE") {
        return attachRotated(NextResponse.redirect(new URL("/admin/dashboard", request.url)));
    }

    // ── 4. Authenticated users skip login/register ────────────────────────────
    if (pathname === "/login" || pathname === "/register") {
        const destination = session.role === "ADMIN" ? "/admin/dashboard" : "/employee/dashboard";
        return attachRotated(NextResponse.redirect(new URL(destination, request.url)));
    }

    return passthroughWithRotation();
}

export const config = {
    matcher: ["/admin/:path*", "/employee/:path*", "/login", "/register"],
};
