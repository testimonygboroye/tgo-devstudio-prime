function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
}

function isPlatformUrl(value: string): boolean {
  try {
    const hostname = new URL(normalizeUrl(value)).hostname.toLowerCase();

    return [
      "vercel.app",
      "netlify.app",
      "onrender.com",
      "render.com",
    ].some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return true;
  }
}

function firstConfigured(
  values: Array<string | undefined>
): string | undefined {
  return values.find((value) => Boolean(value?.trim()));
}

export function getSiteUrl(): string {
  const configuredCandidates = [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.DEPLOY_PRIME_URL,
  ];

  const customDomain = configuredCandidates.find(
    (value) => value?.trim() && !isPlatformUrl(value)
  );

  if (customDomain) {
    return normalizeUrl(customDomain);
  }

  const deploymentUrl = firstConfigured([
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.RENDER_EXTERNAL_URL,
  ]);

  if (deploymentUrl) {
    return normalizeUrl(deploymentUrl);
  }

  return "https://tgo-devstudio-prime.vercel.app";
}
