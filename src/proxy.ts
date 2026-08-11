import { NextRequest, NextResponse } from "next/server";
import { verifyRequestOrigin, csrfRejectionResponse } from "@/lib/security/csrf";

const INTERNAL_ADMIN_SEGMENT = "admin";
const STATE_CHANGING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (STATE_CHANGING_METHODS.includes(request.method) && !verifyRequestOrigin(request)) {
      return csrfRejectionResponse();
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
