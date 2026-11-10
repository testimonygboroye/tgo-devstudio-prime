import type { NextRequest } from "next/server";

/**
 * Resolve the public origin used in emails and other externally shared links.
 * A request's Host header is deliberately not trusted: reverse proxies,
 * preview hosts and local development requests must never leak into emails.
 */
export function getPublicSiteUrl(_request?: NextRequest): string {
  const candidates = [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.RENDER_EXTERNAL_URL,
    process.env.URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    // The established public production host is the safe final fallback.
    "https://tgo-devstudio-prime.onrender.com",
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
      const host = parsed.hostname.toLowerCase();
      const isLocal = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host.endsWith(".localhost") || host.endsWith(".local");
      const isPrivateIPv4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
      if (isLocal || isPrivateIPv4) continue;
      if (parsed.protocol !== "https:") continue;
      return parsed.origin;
    } catch {
      // Ignore malformed values and try the next configured public origin.
    }
  }

  // This is intentionally a stable HTTPS production URL, not request-derived.
  return "https://tgo-devstudio-prime.onrender.com";
}
