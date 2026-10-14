import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const publicKey = getVapidPublicKey()?.trim();

  if (!publicKey) {
    return NextResponse.json(
      { error: "Push notifications are not configured on this hosting platform." },
      { status: 503 }
    );
  }

  try {
    const normalized = publicKey
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decoded = Buffer.from(normalized, "base64");

    if (decoded.length !== 65 || decoded[0] !== 4) {
      return NextResponse.json(
        { error: "The configured VAPID public key has an invalid format." },
        { status: 503 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "The configured VAPID public key could not be decoded." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { publicKey },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
