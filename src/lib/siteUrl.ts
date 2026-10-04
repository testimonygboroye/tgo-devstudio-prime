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
    process.env.VERCEL_URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.URL ||
    process.env.RENDER_EXTERNAL_URL;

  if (deploymentUrl) {
    const value = deploymentUrl.trim();

    if (/^https?:\/\//i.test(value)) {
      return normalizeUrl(value);
    }

    return normalizeUrl(`https://${value}`);
  }

  return "http://localhost:3000";
}
