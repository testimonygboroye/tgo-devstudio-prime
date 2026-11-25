function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

function isPlatformUrl(value: string): boolean {
  try {
    const hostname = new URL(normalizeUrl(value)).hostname.toLowerCase();
    return ["vercel.app", "netlify.app", "onrender.com", "render.com"].some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return true;
  }
}

/**
 * Public SEO origin. Custom domains are respected; provider-specific
 * deployment hostnames are not. Render is the stable production fallback.
 */
export function getSiteUrl(): string {
  const candidates = [process.env.SITE_URL, process.env.NEXT_PUBLIC_SITE_URL, process.env.URL];
  const customDomain = candidates.find((value) => value?.trim() && !isPlatformUrl(value));
  return customDomain ? normalizeUrl(customDomain) : "https://tgo-devstudio-prime.onrender.com";
}
