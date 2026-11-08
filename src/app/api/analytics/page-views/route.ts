import { NextRequest, NextResponse, after } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { captureAnalyticsSnapshot } from "@/lib/push/analyticsSnapshot";
import PageView from "@/models/PageView";
import Visitor from "@/models/Visitor";
import { canonicalizeDeploymentHost, countryName, decodeAnalyticsLabel, formatRegionName } from "@/lib/analytics/visitor";
import {
  getAuthenticatedSession,
} from "@/lib/auth/session";
import {
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth/authorize";

function getDateRange(searchParams: URLSearchParams) {
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const createdAt: {
    $gte?: Date;
    $lte?: Date;
  } = {};

  if (from) {
    const date = new Date(`${from}T00:00:00.000Z`);
    if (!Number.isNaN(date.getTime())) {
      createdAt.$gte = date;
    }
  }

  if (to) {
    const date = new Date(`${to}T23:59:59.999Z`);
    if (!Number.isNaN(date.getTime())) {
      createdAt.$lte = date;
    }
  }

  return Object.keys(createdAt).length ? { createdAt } : {};
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
  const sort = searchParams.get("sort") || "recent";

  const dateFilter = getDateRange(searchParams);
  const recordedHosts = await PageView.distinct("host");
  const regionPairs = await PageView.aggregate([
    { $match: { region: { $exists: true, $nin: [null, ""] } } },
    { $group: { _id: { region: "$region", countryCode: "$countryCode" } } },
  ]);

  const pageViewMatch: Record<string, unknown> = {
    ...dateFilter,
  };

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

  const matchingVisitorIds = hasPageViewFilters
    ? await PageView.distinct(
        "visitorId",
        pageViewMatch
      )
    : null;

  const visitorQuery: Record<string, unknown> = {};

  if (matchingVisitorIds) {
    visitorQuery.visitorId = {
      $in: matchingVisitorIds,
    };
  }

  if (search) {
    visitorQuery.$or = [
      {
        displayName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
      {
        visitorId: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  let sortQuery: Record<string, 1 | -1>;

  switch (sort) {
    case "top-visited":
      sortQuery = {
        totalPageViews: -1,
        lastSeen: -1,
      };
      break;

    case "top-active":
      sortQuery = {
        totalSessions: -1,
        totalPageViews: -1,
        lastSeen: -1,
      };
      break;

    case "top-constant":
      sortQuery = {
        activeDays: -1,
        totalSessions: -1,
        lastSeen: -1,
      };
      break;

    case "oldest":
      sortQuery = {
        firstSeen: 1,
      };
      break;

    case "newest":
      sortQuery = {
        firstSeen: -1,
      };
      break;

    default:
      sortQuery = {
        lastSeen: -1,
      };
      break;
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

    PageView.distinct("host"),
    PageView.distinct("deploymentProvider"),
    PageView.distinct("countryCode"),
    PageView.distinct("region"),
    PageView.distinct("city"),
    PageView.distinct("deviceType"),
    PageView.distinct("browser"),
    PageView.distinct("operatingSystem"),
  ]);

  const visitors = await Visitor.find(visitorQuery)
    .sort(sortQuery)
    .limit(250)
    .lean();

  const visitorIds = visitors.map(
    (visitor) => visitor.visitorId
  );

  const activeDayRows = visitorIds.length
    ? await PageView.aggregate([
        {
          $match: {
            visitorId: {
              $in: visitorIds,
            },
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
            visitorId: {
              $in: visitorIds,
            },
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

  const formattedVisitors = visitors
    .map((visitor) => {
      const activeDays =
        activeDayMap.get(visitor.visitorId) ||
        visitor.activeDays ||
        0;

      return {
        ...visitor,
        _id: String(visitor._id),
        activeDays,
        status: calculateStatus({
          firstSeen: visitor.firstSeen,
          lastSeen: visitor.lastSeen,
          totalPageViews: visitor.totalPageViews,
          totalSessions: visitor.totalSessions,
          activeDays,
        }),
        hosts:
          hostMap.get(visitor.visitorId) || [],
      };
    })
    .filter((visitor) =>
      status ? visitor.status === status : true
    )
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

  return NextResponse.json({
    status: "ok",

    views: views.map((view) => ({ ...view, path: decodeAnalyticsLabel(view.path), host: canonicalizeDeploymentHost(view.host), country: view.country || countryName(view.countryCode), region: formatRegionName(view.region, view.countryCode) || view.region, city: view.city ? decodeAnalyticsLabel(view.city) : view.city })),

    visitors: formattedVisitors.map((visitor) => ({ ...visitor, deploymentHost: canonicalizeDeploymentHost(visitor.deploymentHost), country: visitor.country || countryName(visitor.countryCode), region: formatRegionName(visitor.region, visitor.countryCode) || visitor.region, city: visitor.city ? decodeAnalyticsLabel(visitor.city) : visitor.city, hosts: [...new Set((visitor.hosts || []).map((value) => canonicalizeDeploymentHost(value)).filter(Boolean))] })),

    totalCount,

    uniqueVisitorCount:
      uniqueVisitors.length,

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
      [...new Set(regionPairs.map((row) => formatRegionName(String(row._id.region), row._id.countryCode ? String(row._id.countryCode) : undefined) || decodeAnalyticsLabel(String(row._id.region))))].sort(),

    cities:
      [...new Set(cleanOptions(availableCities).map((value) => decodeAnalyticsLabel(value)))].sort(),

    deviceTypes:
      cleanOptions(availableDevices),

    browsers:
      cleanOptions(availableBrowsers),

    operatingSystems:
      cleanOptions(availableOperatingSystems),
  });
}
