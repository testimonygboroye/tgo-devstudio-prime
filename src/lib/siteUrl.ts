function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

function isLocalOrPrivateUrl(value: string): boolean {
  try {
    const url = new URL(normalizeUrl(value));
    const host = url.hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1" ||
      host.endsWith(".localhost") || host.endsWith(".local") ||
      /^10\./.test(host) || /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  } catch { return true; }
}

function isPlatformUrl(value: string): boolean {
  try {
    const hostname = new URL(normalizeUrl(value)).hostname.toLowerCase();
    return ["vercel.app", "netlify.app", "onrender.com", "render.com"].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch { return true; }
}

export function getSiteUrl(): string {
  const customCandidates = [process.env.SITE_URL, process.env.NEXT_PUBLIC_SITE_URL, process.env.URL];
  const customDomain = customCandidates.find((value) => value?.trim() && !isLocalOrPrivateUrl(value) && !isPlatformUrl(value));
  if (customDomain) return normalizeUrl(customDomain);

  const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionDomain && !isLocalOrPrivateUrl(productionDomain)) {
    const normalized = normalizeUrl(productionDomain);
    try {
      const host = new URL(normalized).hostname.toLowerCase();
      if (host === "tgo-devstudio-prime.vercel.app") return normalized;
    } catch { /* Use the stable production fallback. */ }
  }

  // Never use request host headers, localhost, VERCEL_URL or preview deployment URLs
  // for account verification, OAuth callbacks, payment callbacks or canonical metadata.
  return "https://tgo-devstudio-prime.vercel.app";
}
