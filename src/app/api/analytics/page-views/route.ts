import { NextRequest, NextResponse, after } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { captureAnalyticsSnapshot } from "@/lib/push/analyticsSnapshot";
import PageView from "@/models/PageView";
import Visitor from "@/models/Visitor";
import { TRUSTED_ANALYTICS_TRAFFIC_FILTER, onlineCutoff, getUtcDayRange } from "@/lib/analytics/reporting";
import { canonicalizeDeploymentHost, countryName, decodeAnalyticsLabel, formatRegionName, isLikelyGeoMismatch } from "@/lib/analytics/visitor";
import {
  getAuthenticatedSession,
} from "@/lib/auth/session";
import {
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth/authorize";

function getDateRange(searchParams: URLSearchParams) {
  const range = getUtcDayRange(searchParams.get("from"), searchParams.get("to"));
  return { createdAt: range };
}

function calculateStatus(visitor: {
  firstSeen: Date;
  lastSeen: Date;
  totalPageViews: number;
  totalSessions: number;
  activeDays: number;
}) {
  const now = Date.now();

  const daysSinceLastSeen =
    (now - new Date(visitor.lastSeen).getTime()) / 86400000;

  const daysSinceFirstSeen =
    (now - new Date(visitor.firstSeen).getTime()) / 86400000;

  if (daysSinceLastSeen > 30) {
    return "dormant";
  }

  if (
    visitor.totalPageViews >= 20 ||
    visitor.totalSessions >= 10
  ) {
    return "highly-active";
  }

  if (
    daysSinceFirstSeen >= 14 &&
    visitor.activeDays >= 5
  ) {
    return "constant";
  }

  if (
    visitor.totalSessions >= 2 &&
    daysSinceLastSeen <= 30
  ) {
    return "returning";
  }

  if (daysSinceLastSeen <= 7) {
    return "active";
  }

  return "new";
}

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);

  if (!session) {
    return unauthorizedResponse();
  }

  if (!session.role.isFounderRole) {
    return forbiddenResponse(
      "Only the Founder can view visitor analytics."
    );
  }

  await connectToDatabase();

  const { searchParams } = new URL(request.url);

  const limit = Math.min(
    Math.max(
      parseInt(searchParams.get("limit") || "100", 10) || 100,
      1
    ),
    250
  );

  const host = searchParams.get("host") || undefined;
  const provider = searchParams.get("provider") || undefined;
  const countryFilter = searchParams.get("countryCode") || undefined;
  const countrySuffixStart = countryFilter?.lastIndexOf("(") ?? -1;
  const countryCode = countryFilter && countrySuffixStart >= 0 && countryFilter.endsWith(")") ? countryFilter.slice(countrySuffixStart + 1, -1).toUpperCase() : countryFilter;
  const region = searchParams.get("region") || undefined;
  const city = searchParams.get("city") || undefined;
  const deviceType = searchParams.get("deviceType") || undefined;
  const browser = searchParams.get("browser") || undefined;
  const operatingSystem =
    searchParams.get("operatingSystem") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const presence = searchParams.get("presence") || "";
  const sort = searchParams.get("sort") || "recent";

  const dateFilter = getDateRange(searchParams);
  // Preview deployments and automated headless checks are infrastructure traffic, not people visiting the public site.
  const trustedTrafficFilter = TRUSTED_ANALYTICS_TRAFFIC_FILTER;
  const recordedHosts = await PageView.distinct("host", trustedTrafficFilter);
  const regionPairs = await PageView.aggregate([
    { $match: { ...trustedTrafficFilter, region: { $exists: true, $nin: [null, ""] } } },
    { $group: { _id: { region: "$region", countryCode: "$countryCode", timezone: "$timezone" } } },
  ]);
  const cityPairs = await PageView.aggregate([
    { $match: { ...trustedTrafficFilter, city: { $exists: true, $nin: [null, ""] } } },
    { $group: { _id: { city: "$city", countryCode: "$countryCode", timezone: "$timezone" } } },
  ]);
  const trustedRegionPairs = regionPairs.filter((row) => !isLikelyGeoMismatch(row._id.timezone ? String(row._id.timezone) : undefined, row._id.countryCode ? String(row._id.countryCode) : undefined));
  const trustedCityPairs = cityPairs.filter((row) => !isLikelyGeoMismatch(row._id.timezone ? String(row._id.timezone) : undefined, row._id.countryCode ? String(row._id.countryCode) : undefined));

  const pageViewMatch: Record<string, unknown> = { ...trustedTrafficFilter, ...dateFilter };

  if (host) {
    const matches = recordedHosts.filter((value): value is string => typeof value === "string" && canonicalizeDeploymentHost(value) === host);
    pageViewMatch.host = { $in: matches.length ? matches : [host] };
  }
  if (provider) pageViewMatch.deploymentProvider = provider;
  if (countryCode) pageViewMatch.countryCode = countryCode;
  const variants = (value: string) => [...new Set([value, decodeAnalyticsLabel(value), encodeURIComponent(value), value.replace(/ /g, "%20"), value.replace(/ /g, "+")])];
  if (region) {
    const regionSuffixStart = region.lastIndexOf("(");
    const code = regionSuffixStart >= 0 && region.endsWith(")") ? region.slice(regionSuffixStart + 1, -1).toUpperCase() : undefined;
    const legacyRegionValues = code ? regionPairs.filter((row) => (formatRegionName(String(row._id.region), row._id.countryCode ? String(row._id.countryCode) : undefined) || decodeAnalyticsLabel(String(row._id.region))) === region).map((row) => String(row._id.region)) : [];
    const choices = code ? [...new Set([region, code, code.includes("-") ? code : countryCode ? `${countryCode}-${code}` : code, ...legacyRegionValues])] : variants(region);
    pageViewMatch.region = { $in: choices };
  }
  if (city) pageViewMatch.city = { $in: variants(city) };
  if (deviceType) pageViewMatch.deviceType = deviceType;
  if (browser) pageViewMatch.browser = browser;
  if (operatingSystem) {
    pageViewMatch.operatingSystem = operatingSystem;
  }

  const hasPageViewFilters =
    Boolean(
      host ||
      provider ||
      countryCode ||
      region ||
      city ||
      deviceType ||
      browser ||
      operatingSystem ||
      Object.keys(dateFilter).length
    );

  const visitorListMatch: Record<string, unknown> = { ...pageViewMatch };
  if (presence === "online") delete visitorListMatch.createdAt;
  const matchingVisitorIds = await PageView.distinct("visitorId", visitorListMatch);

  const visitorQuery: Record<string, unknown> = {
    isInternal: { $ne: true },
    visitorId: { $in: matchingVisitorIds },
  };

  if (search) {
    visitorQuery.$or = [
      { displayName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { visitorId: { $regex: search, $options: "i" } },
    ];
  }
  const onlineSince = onlineCutoff();
  if (presence === "online") {
    visitorQuery.lastActiveAt = { $gte: onlineSince };
  } else if (presence === "offline") {
    visitorQuery.$and = [
      { $or: [{ lastActiveAt: { $lt: onlineSince } }, { lastActiveAt: { $exists: false } }] },
    ];
  }

  const [
    views,
    totalCount,
    uniqueVisitors,
    dailyVisitors,
    availableHosts,
    availableProviders,
    availableCountries,
    availableRegions,
    availableCities,
    availableDevices,
    availableBrowsers,
    availableOperatingSystems,
  ] = await Promise.all([
    PageView.find(pageViewMatch)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),

    PageView.countDocuments(pageViewMatch),

    PageView.distinct(
      "visitorId",
      pageViewMatch
    ),

    PageView.aggregate([
      {
        $match: pageViewMatch,
      },
      {
        $project: {
          visitorId: 1,
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
        },
      },
      {
        $group: {
          _id: {
            day: "$day",
            visitorId: "$visitorId",
          },
        },
      },
      {
        $group: {
          _id: "$_id.day",
          visitors: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]),

    PageView.distinct("host", trustedTrafficFilter),
    PageView.distinct("deploymentProvider", trustedTrafficFilter),
    PageView.distinct("countryCode", trustedTrafficFilter),
    PageView.distinct("region", trustedTrafficFilter),
    PageView.distinct("city", trustedTrafficFilter),
    PageView.distinct("deviceType", trustedTrafficFilter),
    PageView.distinct("browser", trustedTrafficFilter),
    PageView.distinct("operatingSystem", trustedTrafficFilter),
  ]);

  const onlineVisitorCount = await Visitor.countDocuments({
    isInternal: { $ne: true },
    lastActiveAt: { $gte: onlineSince },
  });

  const visitors = await Visitor.find(visitorQuery)
    .limit(1000)
    .lean();

  const visitorIds = visitors.map(
    (visitor) => visitor.visitorId
  );

  const activeDayRows = visitorIds.length
    ? await PageView.aggregate([
        {
          $match: {
            ...trustedTrafficFilter,
            visitorId: { $in: visitorIds },
          },
        },
        {
          $project: {
            visitorId: 1,
            day: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
          },
        },
        {
          $group: {
            _id: {
              visitorId: "$visitorId",
              day: "$day",
            },
          },
        },
        {
          $group: {
            _id: "$_id.visitorId",
            activeDays: {
              $sum: 1,
            },
          },
        },
      ])
    : [];

  const activeDayMap = new Map(
    activeDayRows.map((row) => [
      row._id as string,
      row.activeDays as number,
    ])
  );

  const visitorHosts = visitorIds.length
    ? await PageView.aggregate([
        {
          $match: {
            ...trustedTrafficFilter,
            visitorId: { $in: visitorIds },
          },
        },
        {
          $match: {
            host: {
              $exists: true,
              $ne: null,
            },
          },
        },
        {
          $group: {
            _id: "$visitorId",
            hosts: {
              $addToSet: "$host",
            },
          },
        },
      ])
    : [];

  const hostMap = new Map(
    visitorHosts.map((row) => [
      row._id as string,
      row.hosts as string[],
    ])
  );

  const visitorStatsRows = visitorIds.length
    ? await PageView.aggregate([
        { $match: { ...trustedTrafficFilter, visitorId: { $in: visitorIds } } },
        {
          $group: {
            _id: "$visitorId",
            totalPageViews: { $sum: 1 },
            sessions: { $addToSet: "$sessionId" },
            activeDates: {
              $addToSet: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" },
              },
            },
          },
        },
        {
          $project: {
            totalPageViews: 1,
            totalSessions: {
              $size: {
                $filter: {
                  input: "$sessions",
                  as: "session",
                  cond: { $and: [{ $ne: ["$$session", null] }, { $ne: ["$$session", ""] }] },
                },
              },
            },
            activeDays: { $size: "$activeDates" },
          },
        },
      ])
    : [];
  const visitorStatsMap = new Map(visitorStatsRows.map((row) => [row._id as string, row]));

  const formattedVisitors = visitors
    .map((visitor) => {
      const stats = visitorStatsMap.get(visitor.visitorId);
      const activeDays = stats?.activeDays ?? activeDayMap.get(visitor.visitorId) ?? visitor.activeDays ?? 0;
      const totalPageViews = stats?.totalPageViews ?? visitor.totalPageViews;
      const totalSessions = stats?.totalSessions ?? visitor.totalSessions;

      return {
        ...visitor,
        totalPageViews,
        totalSessions,
        _id: String(visitor._id),
        isOnline: Boolean(visitor.lastActiveAt && new Date(visitor.lastActiveAt).getTime() >= onlineSince.getTime()),
        activeDays,
        status: calculateStatus({
          firstSeen: visitor.firstSeen,
          lastSeen: visitor.lastSeen,
          totalPageViews,
          totalSessions,
          activeDays,
        }),
        hosts:
          hostMap.get(visitor.visitorId) || [],
      };
    })
    .filter((visitor) =>
      status ? visitor.status === status : true
    )
    .sort((a, b) => {
      switch (sort) {
        case "all": return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
        case "recent": return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
        case "top-visited": return b.totalPageViews - a.totalPageViews || new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
        case "top-active": return b.totalSessions - a.totalSessions || b.totalPageViews - a.totalPageViews;
        case "top-constant": return b.activeDays - a.activeDays || b.totalSessions - a.totalSessions;
        case "oldest": return new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime();
        case "newest": return new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime();
        default: return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      }
    })
    .slice(0, limit)
    .map((visitor, index) => ({
      ...visitor,
      rank: index + 1,
    }));

  const totalDays = dailyVisitors.length;

  const averageDailyVisitors =
    totalDays > 0
      ? Math.round(
          (dailyVisitors.reduce(
            (sum, item) =>
              sum + Number(item.visitors),
            0
          ) /
            totalDays) *
            100
        ) / 100
      : 0;

  const peakDay = dailyVisitors.reduce(
    (highest, current) =>
      Number(current.visitors) >
      Number(highest?.visitors || 0)
        ? current
        : highest,
    null as
      | {
          _id: string;
          visitors: number;
        }
      | null
  );

  const cleanOptions = (values: unknown[]) =>
    values
      .filter(
        (value): value is string =>
          typeof value === "string" &&
          value.length > 0
      )
      .sort();

  // Capture only unfiltered metrics, once per UTC day, so dashboard filters
  // cannot distort the daily comparison baseline.
  if (!hasPageViewFilters && !search) {
    after(async () => {
      try {
        await captureAnalyticsSnapshot({
          uniqueVisitorCount: uniqueVisitors.length,
          averageDailyVisitors,
          peakDailyVisitors: peakDay ? Number(peakDay.visitors) : 0,
          peakDay: peakDay?._id || null,
        });
      } catch (error) { console.error("[Push] Analytics snapshot failed:", error); }
    });
  }

  const [excludedAutomatedPageViews, excludedInternalPageViews] = await Promise.all([
    PageView.countDocuments({
      createdAt: dateFilter.createdAt,
      $or: [
        { userAgent: { $regex: "HeadlessChrome|PhantomJS|Playwright|Puppeteer|bot|crawler|spider|slurp|facebookexternalhit|TelegramBot|Twitterbot|LinkedInBot|Discordbot|Google-InspectionTool", $options: "i" } },
        { host: { $regex: "^tgo-devstudio-prime-[a-z0-9]+-testimonygboroye\\.vercel\\.app$", $options: "i" } },
        { referrer: { $regex: "tgo-devstudio-prime-[a-z0-9]+-testimonygboroye\\.vercel\\.app", $options: "i" } },
      ],
    }),
    PageView.countDocuments({ createdAt: dateFilter.createdAt, isInternal: true }),
  ]);

  return NextResponse.json({
    status: "ok",

    views: views.map((view) => {
      const unverified = isLikelyGeoMismatch(view.timezone, view.countryCode);
      return { ...view, path: decodeAnalyticsLabel(view.path), host: canonicalizeDeploymentHost(view.host), country: view.country || countryName(view.countryCode), region: unverified ? undefined : formatRegionName(view.region, view.countryCode) || view.region, city: unverified ? undefined : view.city ? decodeAnalyticsLabel(view.city) : view.city };
    }),

    visitors: formattedVisitors.map((visitor) => {
      const unverified = isLikelyGeoMismatch(visitor.timezone, visitor.countryCode);
      return { ...visitor, deploymentHost: canonicalizeDeploymentHost(visitor.deploymentHost), country: visitor.country || countryName(visitor.countryCode), region: unverified ? undefined : formatRegionName(visitor.region, visitor.countryCode) || visitor.region, city: unverified ? undefined : visitor.city ? decodeAnalyticsLabel(visitor.city) : visitor.city, hosts: [...new Set((visitor.hosts || []).map((value) => canonicalizeDeploymentHost(value)).filter(Boolean))] };
    }),

    totalCount,

    uniqueVisitorCount:
      uniqueVisitors.length,

    onlineVisitorCount,
    onlineWindowSeconds: 120,
    trafficClassification: { excludedAutomatedOrPreviewPageViews: excludedAutomatedPageViews, excludedInternalPageViews },

    averageDailyVisitors,

    peakDailyVisitors:
      peakDay
        ? Number(peakDay.visitors)
        : 0,

    peakDay:
      peakDay?._id || null,

    deploymentHosts:
      [...new Set(recordedHosts.filter((value): value is string => typeof value === "string").map((value) => canonicalizeDeploymentHost(value)).filter((value): value is string => Boolean(value)))].sort(),

    deploymentProviders:
      cleanOptions(availableProviders),

    countries:
      cleanOptions(availableCountries).map((code) => `${countryName(code) || code} (${code})`),

    regions:
      [...new Set(trustedRegionPairs.map((row) => formatRegionName(String(row._id.region), row._id.countryCode ? String(row._id.countryCode) : undefined) || decodeAnalyticsLabel(String(row._id.region))))].sort(),

    cities:
      [...new Set(trustedCityPairs.map((row) => decodeAnalyticsLabel(String(row._id.city))))].sort(),

    deviceTypes:
      cleanOptions(availableDevices),

    browsers:
      cleanOptions(availableBrowsers),

    operatingSystems:
      cleanOptions(availableOperatingSystems),
  });
}
