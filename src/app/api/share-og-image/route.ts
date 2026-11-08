import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/**
 * Fetches only this site's own OG image or images stored in our Cloudinary
 * account. This gives the browser a same-origin image file for Android's
 * multi-file Web Share API without exposing an unrestricted URL proxy.
 */
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing image URL." }, { status: 400 });
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid image URL." }, { status: 400 });
  }

  const requestUrl = new URL(request.url);
  const allowedHosts = new Set([
    requestUrl.hostname,
    "tgo-devstudio-prime.vercel.app",
    "res.cloudinary.com",
  ]);

  if (
    imageUrl.protocol !== "https:" ||
    !allowedHosts.has(imageUrl.hostname) ||
    imageUrl.username ||
    imageUrl.password
  ) {
    return NextResponse.json({ error: "Image host is not allowed." }, { status: 403 });
  }

  try {
    const upstream = await fetch(imageUrl, {
      redirect: "error",
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "Preview image is unavailable." }, { status: 502 });
    }

    const contentType = (upstream.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return NextResponse.json({ error: "Unsupported preview image format." }, { status: 415 });
    }

    const declaredLength = Number(upstream.headers.get("content-length") || 0);
    if (declaredLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Preview image is too large." }, { status: 413 });
    }

    const image = await upstream.arrayBuffer();
    if (image.byteLength === 0 || image.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Preview image size is invalid." }, { status: 413 });
    }

    return new NextResponse(image, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(image.byteLength),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("[Share OG Image] Failed to fetch preview image:", error);
    return NextResponse.json({ error: "Could not retrieve preview image." }, { status: 502 });
  }
}
