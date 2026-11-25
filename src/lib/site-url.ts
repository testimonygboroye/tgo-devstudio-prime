import type { NextRequest } from "next/server";

const CANONICAL_PRODUCTION_URL = "https://tgo-devstudio-prime.onrender.com";

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" ||
    host.endsWith(".localhost") || host.endsWith(".local") ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
}

function isHostingPlatformHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ["vercel.app", "netlify.app", "onrender.com", "render.com"].some(
    (domain) => host === domain || host.endsWith(`.${domain}`)
  );
}

/**
 * Resolve the public origin used in emails and externally shared links.
 * Preview and provider-owned platform hostnames are never canonical.
 */
export function getPublicSiteUrl(_request?: NextRequest): string {
  const candidates = [process.env.SITE_URL, process.env.NEXT_PUBLIC_SITE_URL, process.env.URL];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
      if (parsed.protocol !== "https:" || isPrivateOrLocalHost(parsed.hostname)) continue;
      if (isHostingPlatformHost(parsed.hostname)) continue;
      return parsed.origin;
    } catch {
      // Ignore malformed values and continue to the stable production host.
    }
  }

  return CANONICAL_PRODUCTION_URL;
}
