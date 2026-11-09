import { NextResponse } from "next/server";

export function getPlatformRequestId(request: Request): string {
  const incoming = request.headers.get("x-request-id");
  if (incoming && /^[a-zA-Z0-9._:-]{8,120}$/.test(incoming)) return incoming;
  return globalThis.crypto.randomUUID();
}

export function platformSuccess<T>(
  data: T,
  options: { status?: number; requestId?: string } = {}
) {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: { requestId: options.requestId || globalThis.crypto.randomUUID() },
    },
    { status: options.status || 200 }
  );
}

export function platformFailure(
  code: string,
  message: string,
  options: { status?: number; requestId?: string } = {}
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
      meta: { requestId: options.requestId || globalThis.crypto.randomUUID() },
    },
    { status: options.status || 400 }
  );
}
