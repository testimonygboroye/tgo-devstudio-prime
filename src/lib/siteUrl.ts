function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const configured =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  if (configured) {
    return normalizeUrl(configured);
  }

  const deploymentUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.URL ||
    process.env.VERCEL_URL;

  if (deploymentUrl) {
    const value = deploymentUrl.trim();

    if (/^https?:\/\//i.test(value)) {
      return normalizeUrl(value);
    }

    return normalizeUrl(`https://${value}`);
  }

  /*
   * TGO DevStudio's public SEO canonical is Vercel until
   * a custom domain is configured through SITE_URL.
   *
   * Other deployment hosts remain measurable in analytics,
   * but should not become competing canonical versions.
   */
  return "https://tgo-devstudio-prime.vercel.app";
}
