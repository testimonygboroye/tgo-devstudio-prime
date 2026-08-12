import { NextRequest, NextResponse } from "next/server";

export function verifyRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return true;
  }

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

export function csrfRejectionResponse(): NextResponse {
  return NextResponse.json(
    { status: "error", message: "Request origin could not be verified." },
    { status: 403 }
  );
}
