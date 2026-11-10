import type { NextRequest } from "next/server";

/**
 * Resolve the canonical public origin for links sent to people outside the
 * running server. Never email a localhost or private container hostname from
 * a production deployment.
 */
export function getPublicSiteUrl(request?: NextRequest): string {
  const candidates = [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.RENDER_EXTERNAL_URL,
    process.env.URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    request?.nextUrl.origin,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
      const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "0.0.0.0";
      if (isLocal && process.env.NODE_ENV === "production") continue;
      if (parsed.protocol !== "https:" && process.env.NODE_ENV === "production") continue;
      return parsed.origin;
    } catch {
      // Try the next trusted hosting-provided origin.
    }
  }

  throw new Error("The public site URL is not configured. Set SITE_URL to the HTTPS production domain before sending external links.");
}
