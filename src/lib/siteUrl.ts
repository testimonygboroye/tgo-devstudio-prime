import { headers } from "next/headers";

function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export async function getSiteUrl(): Promise<string> {
  const configured =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  if (configured) {
    return normalizeUrl(configured);
  }

  try {
    const requestHeaders = await headers();

    const forwardedHost =
      requestHeaders.get("x-forwarded-host");

    const host =
      forwardedHost ||
      requestHeaders.get("host");

    if (host) {
      const normalizedHost =
        host.split(",")[0].trim();

      const forwardedProto =
        requestHeaders.get("x-forwarded-proto");

      const protocol =
        forwardedProto === "http"
          ? "http"
          : "https";

      return `${protocol}://${normalizedHost}`;
    }
  } catch {
    // Fall back below when request headers are unavailable.
  }

  return "http://localhost:3000";
}
