import { NextRequest, NextResponse } from "next/server";

const INTERNAL_ADMIN_SEGMENT = "admin";

export function proxy(request: NextRequest) {
  const adminPath = process.env.ADMIN_PATH;

  if (!adminPath) {
    return NextResponse.next();
  }

  const normalizedAdminPath = adminPath.startsWith("/") ? adminPath : `/${adminPath}`;
  const { pathname } = request.nextUrl;

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
