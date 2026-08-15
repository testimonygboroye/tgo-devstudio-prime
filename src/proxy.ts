import { NextRequest, NextResponse } from "next/server";
import { verifyRequestOrigin, csrfRejectionResponse } from "@/lib/security/csrf";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { logAuditAction } from "@/lib/audit/logAction";

const INTERNAL_ADMIN_SEGMENT = "admin";
const STATE_CHANGING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

// Public-facing submission endpoints are never attributed to a logged-in admin,
// so they're excluded from the admin audit log (visitor analytics covers public activity instead).
const PUBLIC_SUBMISSION_PATTERNS = [
  /^\/api\/contact$/,
  /^\/api\/reviews$/,
  /^\/api\/newsletter$/,
  /^\/api\/careers\/[^/]+\/applications$/,
  /^\/api\/auth\/signup-via-invite$/,
  /^\/api\/auth\/forgot-password$/,
  /^\/api\/auth\/reset-password$/,
  /^\/api\/analytics\/track$/,
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (STATE_CHANGING_METHODS.includes(request.method) && !verifyRequestOrigin(request)) {
      return csrfRejectionResponse();
    }

    if (
      STATE_CHANGING_METHODS.includes(request.method) &&
      !PUBLIC_SUBMISSION_PATTERNS.some((pattern) => pattern.test(pathname))
    ) {
      const accessToken = request.cookies.get("accessToken")?.value;
      if (accessToken) {
        try {
          const payload = verifyAccessToken(accessToken);
          // Fire-and-forget: never let audit logging delay or affect the actual request.
          logAuditAction({
            actorId: payload.userId,
            method: request.method,
            path: pathname,
          }).catch(() => {});
        } catch {
          // Invalid/expired token — nothing to log, request proceeds normally.
        }
      }
    }

    return NextResponse.next();
  }

  const adminPath = process.env.ADMIN_PATH;

  if (!adminPath) {
    return NextResponse.next();
  }

  const normalizedAdminPath = adminPath.startsWith("/") ? adminPath : `/${adminPath}`;

  if (
    pathname === `/${INTERNAL_ADMIN_SEGMENT}` ||
    pathname.startsWith(`/${INTERNAL_ADMIN_SEGMENT}/`)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  if (pathname === normalizedAdminPath || pathname.startsWith(`${normalizedAdminPath}/`)) {
    const remainder = pathname.slice(normalizedAdminPath.length);
    const url = request.nextUrl.clone();
    url.pathname = `/${INTERNAL_ADMIN_SEGMENT}${remainder}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
