import { NextRequest } from "next/server";

export interface VisitorClientMetadata {
  language?: string;
  languages?: string[];
  timezone?: string;
  screenWidth?: number;
  screenHeight?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  isStandalonePwa?: boolean;
  cookiesEnabled?: boolean;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface ParsedUserAgent {
  deviceType: string;
  deviceModel?: string;
  browser: string;
  browserVersion?: string;
  operatingSystem: string;
  operatingSystemVersion?: string;
}

export interface VisitorGeo {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  timezone?: string;
}

function clean(value: unknown, maxLength = 500): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();

  if (!trimmed) return undefined;

  return trimmed.slice(0, maxLength);
}

function parseVersion(
  userAgent: string,
  pattern: RegExp
): string | undefined {
  const match = userAgent.match(pattern);

  return match?.[1];
}

export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent.toLowerCase();

  let deviceType = "Desktop";

  if (/ipad|tablet|playbook|silk/.test(ua)) {
    deviceType = "Tablet";
  } else if (
    /mobile|iphone|ipod|android.*mobile|windows phone/.test(ua)
  ) {
    deviceType = "Mobile";
  }

  let browser = "Unknown";
  let browserVersion: string | undefined;

  if (/samsungbrowser\//.test(ua)) {
    browser = "Samsung Internet";
    browserVersion = parseVersion(
      userAgent,
      /SamsungBrowser\/([\d.]+)/i
    );
  } else if (/edg\//.test(ua)) {
    browser = "Microsoft Edge";
    browserVersion = parseVersion(userAgent, /Edg\/([\d.]+)/i);
  } else if (/opr\//.test(ua)) {
    browser = "Opera";
    browserVersion = parseVersion(userAgent, /OPR\/([\d.]+)/i);
  } else if (/chrome\//.test(ua)) {
    browser = "Chrome";
    browserVersion = parseVersion(userAgent, /Chrome\/([\d.]+)/i);
  } else if (/firefox\//.test(ua)) {
    browser = "Firefox";
    browserVersion = parseVersion(userAgent, /Firefox\/([\d.]+)/i);
  } else if (/safari\//.test(ua) && /version\//.test(ua)) {
    browser = "Safari";
    browserVersion = parseVersion(userAgent, /Version\/([\d.]+)/i);
  }

  let operatingSystem = "Unknown";
  let operatingSystemVersion: string | undefined;

  if (/windows nt/.test(ua)) {
    operatingSystem = "Windows";
    operatingSystemVersion = parseVersion(
      userAgent,
      /Windows NT ([\d.]+)/i
    );
  } else if (/android/.test(ua)) {
    operatingSystem = "Android";
    operatingSystemVersion = parseVersion(
      userAgent,
      /Android ([\d.]+)/i
    );
  } else if (/iphone|ipad|ipod/.test(ua)) {
    operatingSystem = "iOS";
    operatingSystemVersion = parseVersion(
      userAgent,
      /OS ([\d_]+)/i
    )?.replace(/_/g, ".");
  } else if (/mac os x/.test(ua)) {
    operatingSystem = "macOS";
    operatingSystemVersion = parseVersion(
      userAgent,
      /Mac OS X ([\d_]+)/i
    )?.replace(/_/g, ".");
  } else if (/cros/.test(ua)) {
    operatingSystem = "ChromeOS";
  } else if (/linux/.test(ua)) {
    operatingSystem = "Linux";
  }

  let deviceModel: string | undefined;

  if (operatingSystem === "Android") {
    const androidMatch = userAgent.match(
      /Android [^;,)]+;\s*(?:[a-z]{2}-[a-z]{2};\s*)?([^;)]+?)(?:\s+Build\/[^;)]+)?[;)]/i
    );

    if (androidMatch?.[1]) {
      const candidate = androidMatch[1].trim();

      if (
        candidate &&
        candidate.length <= 80 &&
        !/wv|mobile|chrome|safari/i.test(candidate)
      ) {
        deviceModel = candidate;
      }
    }
  }

  return {
    deviceType,
    deviceModel,
    browser,
    browserVersion,
    operatingSystem,
    operatingSystemVersion,
  };
}

export function getVisitorGeo(request: NextRequest): VisitorGeo {
  const vercelCountry = clean(
    request.headers.get("x-vercel-ip-country"),
    10
  );

  const vercelRegion = clean(
    request.headers.get("x-vercel-ip-country-region"),
    40
  );

  const vercelCity = clean(
    request.headers.get("x-vercel-ip-city"),
    120
  );

  const vercelTimezone = clean(
    request.headers.get("x-vercel-ip-timezone"),
    80
  );

  if (vercelCountry || vercelRegion || vercelCity) {
    return {
      countryCode: vercelCountry?.toUpperCase(),
      region: vercelRegion,
      city: vercelCity,
      timezone: vercelTimezone,
    };
  }

  const netlifyGeo = request.headers.get("x-nf-geo");

  if (netlifyGeo) {
    try {
      const parsed = JSON.parse(netlifyGeo) as {
        city?: string;
        country?: {
          code?: string;
          name?: string;
        };
        subdivision?: {
          code?: string;
          name?: string;
        };
        timezone?: string;
      };

      return {
        country: clean(parsed.country?.name, 120),
        countryCode: clean(
          parsed.country?.code,
          10
        )?.toUpperCase(),
        region: clean(parsed.subdivision?.name, 120),
        city: clean(parsed.city, 120),
        timezone: clean(parsed.timezone, 80),
      };
    } catch {
      // Ignore malformed provider data.
    }
  }

  return {};
}

export function getDeploymentHost(
  request: NextRequest
): string | undefined {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const directHost = request.headers.get("host");

  const rawHost = forwardedHost || directHost;

  if (!rawHost) return undefined;

  const host = rawHost.split(",")[0].trim();

  try {
    return new URL(`https://${host}`).hostname.toLowerCase();
  } catch {
    return clean(host, 255)?.toLowerCase();
  }
}

export function getDeploymentProvider(
  host?: string
): string {
  const normalized = host?.toLowerCase() || "";

  if (
    normalized === "tgo-devstudio-prime.onrender.com" ||
    normalized.endsWith(".onrender.com")
  ) {
    return "Render";
  }

  if (
    normalized === "tgo-devstudio-prime.vercel.app" ||
    normalized.endsWith(".vercel.app")
  ) {
    return "Vercel";
  }

  if (
    normalized === "tgodevstudioprime.netlify.app" ||
    normalized.endsWith(".netlify.app")
  ) {
    return "Netlify";
  }

  if (!normalized) {
    return "Unknown";
  }

  return "Custom / Other";
}

export function getClientMetadata(
  value: unknown
): VisitorClientMetadata {
  if (!value || typeof value !== "object") {
    return {};
  }

  const data = value as Record<string, unknown>;

  const numeric = (
    input: unknown
  ): number | undefined => {
    return typeof input === "number" &&
      Number.isFinite(input) &&
      input >= 0
      ? Math.round(input)
      : undefined;
  };

  return {
    language: clean(data.language, 20),

    languages: Array.isArray(data.languages)
      ? data.languages
          .filter(
            (item): item is string =>
              typeof item === "string"
          )
          .map((item) => item.slice(0, 20))
          .slice(0, 20)
      : undefined,

    timezone: clean(data.timezone, 80),

    screenWidth: numeric(data.screenWidth),
    screenHeight: numeric(data.screenHeight),
    viewportWidth: numeric(data.viewportWidth),
    viewportHeight: numeric(data.viewportHeight),

    isStandalonePwa:
      typeof data.isStandalonePwa === "boolean"
        ? data.isStandalonePwa
        : undefined,

    cookiesEnabled:
      typeof data.cookiesEnabled === "boolean"
        ? data.cookiesEnabled
        : undefined,

    referrer: clean(data.referrer, 2000),

    utmSource: clean(data.utmSource, 200),
    utmMedium: clean(data.utmMedium, 200),
    utmCampaign: clean(data.utmCampaign, 300),
    utmTerm: clean(data.utmTerm, 300),
    utmContent: clean(data.utmContent, 300),
  };
}
