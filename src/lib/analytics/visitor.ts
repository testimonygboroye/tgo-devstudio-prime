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

export function decodeAnalyticsLabel(value: string): string {
  const normalized = value.split("+").join(" ");
  try { return decodeURIComponent(normalized).trim(); } catch { return normalized.trim(); }
}

export function countryName(code?: string): string | undefined {
  if (!code) return undefined;
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) || code.toUpperCase(); }
  catch { return code.toUpperCase(); }
}

const SUBDIVISIONS: Record<string, Record<string, string>> = {
  NG: { AB:"Abia", AD:"Adamawa", AK:"Akwa Ibom", AN:"Anambra", BA:"Bauchi", BY:"Bayelsa", BE:"Benue", BO:"Borno", CR:"Cross River", DE:"Delta", EB:"Ebonyi", ED:"Edo", EK:"Ekiti", EN:"Enugu", FC:"Federal Capital Territory", GO:"Gombe", IM:"Imo", JI:"Jigawa", KD:"Kaduna", KN:"Kano", KT:"Katsina", KE:"Kebbi", KO:"Kogi", KW:"Kwara", LA:"Lagos", NA:"Nasarawa", NI:"Niger", OG:"Ogun", ON:"Ondo", OS:"Osun", OY:"Oyo", PL:"Plateau", RI:"Rivers", SO:"Sokoto", TA:"Taraba", YO:"Yobe", ZA:"Zamfara" },
  US: { AL:"Alabama", AK:"Alaska", AZ:"Arizona", AR:"Arkansas", CA:"California", CO:"Colorado", CT:"Connecticut", DE:"Delaware", FL:"Florida", GA:"Georgia", HI:"Hawaii", ID:"Idaho", IL:"Illinois", IN:"Indiana", IA:"Iowa", KS:"Kansas", KY:"Kentucky", LA:"Louisiana", ME:"Maine", MD:"Maryland", MA:"Massachusetts", MI:"Michigan", MN:"Minnesota", MS:"Mississippi", MO:"Missouri", MT:"Montana", NE:"Nebraska", NV:"Nevada", NH:"New Hampshire", NJ:"New Jersey", NM:"New Mexico", NY:"New York", NC:"North Carolina", ND:"North Dakota", OH:"Ohio", OK:"Oklahoma", OR:"Oregon", PA:"Pennsylvania", RI:"Rhode Island", SC:"South Carolina", SD:"South Dakota", TN:"Tennessee", TX:"Texas", UT:"Utah", VT:"Vermont", VA:"Virginia", WA:"Washington", WV:"West Virginia", WI:"Wisconsin", WY:"Wyoming", DC:"District of Columbia" },
  CA: { AB:"Alberta", BC:"British Columbia", MB:"Manitoba", NB:"New Brunswick", NL:"Newfoundland and Labrador", NS:"Nova Scotia", NT:"Northwest Territories", NU:"Nunavut", ON:"Ontario", PE:"Prince Edward Island", QC:"Quebec", SK:"Saskatchewan", YT:"Yukon" },
  AU: { ACT:"Australian Capital Territory", NSW:"New South Wales", NT:"Northern Territory", QLD:"Queensland", SA:"South Australia", TAS:"Tasmania", VIC:"Victoria", WA:"Western Australia" },
};
export function formatRegionName(value?: string, countryCode?: string): string | undefined {
  if (!value) return undefined;
  const raw = decodeAnalyticsLabel(value).trim();
  const qualified = raw.match(/^([A-Z]{2})[-_]([A-Z0-9]{1,3})$/i);
  const country = (qualified?.[1] || countryCode || "").toUpperCase();
  const code = (qualified?.[2] || raw).toUpperCase();
  const regions = SUBDIVISIONS[country];
  if (regions) {
    const name = regions[code];
    if (name) return `${name} (${code})`;
    const reverse = Object.entries(regions).find(([, label]) => label.toLowerCase() === raw.replace(/\s+state$/i, "").toLowerCase());
    return reverse ? `${reverse[1]} (${reverse[0]})` : raw;
  }
  // Some older records have a subdivision code but no country code.
  // Resolve it only when the code/name is unambiguous across our supported regions.
  const candidates = Object.entries(SUBDIVISIONS).flatMap(([countryKey, entries]) =>
    Object.entries(entries).filter(([key, label]) =>
      key === code || label.toLowerCase() === raw.replace(/\s+state$/i, "").toLowerCase()
    ).map(([key, label]) => ({ countryKey, key, label }))
  );
  const unique = [...new Map(candidates.map((item) => [item.label, item])).values()];
  return unique.length === 1 ? `${unique[0].label} (${unique[0].key})` : raw;
}
const COUNTRY_TIMEZONE_GROUP: Record<string, string> = {};
for (const code of "NG GH KE ZA EG MA DZ TN SN CI CM ET UG TZ RW ZM ZW".split(" ")) COUNTRY_TIMEZONE_GROUP[code] = "Africa";
for (const code of "GB IE FR DE ES PT IT NL BE CH AT SE NO DK FI PL CZ SK HU RO BG GR UA IS".split(" ")) COUNTRY_TIMEZONE_GROUP[code] = "Europe";
for (const code of "US CA MX BR AR CL CO PE VE EC BO UY PY CR PA CU DO JM".split(" ")) COUNTRY_TIMEZONE_GROUP[code] = "America";
for (const code of "IN PK BD LK NP CN JP KR SG MY TH VN ID PH AE SA QA IL TR".split(" ")) COUNTRY_TIMEZONE_GROUP[code] = "Asia";
for (const code of "AU NZ FJ PG".split(" ")) COUNTRY_TIMEZONE_GROUP[code] = "Australia";
export function isLikelyGeoMismatch(timezone?: string, countryCode?: string): boolean {
  if (!timezone || !countryCode || timezone === "UTC" || timezone.startsWith("Etc/")) return false;
  const timezoneGroup = timezone.split("/")[0];
  const expectedGroup = COUNTRY_TIMEZONE_GROUP[countryCode.toUpperCase()];
  if (!expectedGroup) return false;
  if (expectedGroup === "America") return timezoneGroup !== "America";
  if (expectedGroup === "Australia") return timezoneGroup !== "Australia" && timezoneGroup !== "Pacific";
  return timezoneGroup !== expectedGroup;
}

export function canonicalizeDeploymentHost(value?: string): string | undefined {
  const host = value?.trim().toLowerCase().replace("https://", "").replace("http://", "").split("/")[0];
  if (!host) return undefined;
  if (host === "tgo-devstudio-prime.vercel.app" || host.endsWith(".vercel.app")) return "tgo-devstudio-prime.vercel.app";
  if (host === "tgo-devstudio-prime.onrender.com" || host.endsWith(".onrender.com")) return "tgo-devstudio-prime.onrender.com";
  if (host === "tgodevstudioprime.netlify.app" || host.endsWith(".netlify.app")) return "tgodevstudioprime.netlify.app";
  return host;
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

  const vercelCityRaw = clean(request.headers.get("x-vercel-ip-city"), 120);
  const vercelCity = vercelCityRaw ? decodeAnalyticsLabel(vercelCityRaw) : undefined;

  const vercelTimezone = clean(
    request.headers.get("x-vercel-ip-timezone"),
    80
  );

  if (vercelCountry || vercelRegion || vercelCity) {
    const countryCode = vercelCountry?.toUpperCase();
    return {
      country: countryName(countryCode),
      countryCode,
      region: vercelRegion ? formatRegionName(decodeAnalyticsLabel(vercelRegion), countryCode) : undefined,
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
        city: parsed.city ? decodeAnalyticsLabel(parsed.city).slice(0, 120) : undefined,
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
    return canonicalizeDeploymentHost(new URL(`https://${host}`).hostname) || undefined;
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
