function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}
function isPlatformUrl(value: string): boolean {
  try {
    const hostname = new URL(normalizeUrl(value)).hostname.toLowerCase();
    return ["vercel.app", "netlify.app", "onrender.com", "render.com"].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch { return true; }
}
export function getSiteUrl(): string {
  const customCandidates = [process.env.SITE_URL, process.env.NEXT_PUBLIC_SITE_URL, process.env.URL];
  const customDomain = customCandidates.find((value) => value?.trim() && !isPlatformUrl(value));
  if (customDomain) return normalizeUrl(customDomain);

  // Accept only TGO-owned stable platform hostnames; reject per-deploy preview URLs.
  const knownProductionHosts = new Set(["tgo-devstudio-prime.onrender.com", "tgo-devstudio-prime.vercel.app"]);
  const configuredProductionHost = customCandidates.find((value) => {
    if (!value?.trim()) return false;
    try { return knownProductionHosts.has(new URL(normalizeUrl(value)).hostname.toLowerCase()); }
    catch { return false; }
  });
  if (configuredProductionHost) return normalizeUrl(configuredProductionHost);

  const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionDomain && !isPlatformUrl(productionDomain)) return normalizeUrl(productionDomain);
  if (productionDomain) {
    const normalized = normalizeUrl(productionDomain);
    try {
      const host = new URL(normalized).hostname.toLowerCase();
      if (host === "tgo-devstudio-prime.vercel.app") return normalized;
    } catch { /* Use the stable production fallback. */ }
  }

  // Never use VERCEL_URL: it points to an individual deployment/preview hostname.
  return "https://tgo-devstudio-prime.onrender.com";
}
