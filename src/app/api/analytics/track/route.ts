import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PageView from "@/models/PageView";
import Visitor, {
  type VisitorStatus,
} from "@/models/Visitor";
import {
  getClientMetadata,
  getDeploymentHost,
  getDeploymentProvider,
  getVisitorGeo,
  parseUserAgent,
} from "@/lib/analytics/visitor";

const VISITOR_COOKIE = "tgo_visitor_id";
const SESSION_COOKIE = "tgo_session_id";

const SESSION_MAX_AGE = 60 * 30;
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;

function determineStatus(params: {
  isNewVisitor: boolean;
  totalPageViews: number;
  totalSessions: number;
  lastSeen?: Date;
  firstSeen?: Date;
}): VisitorStatus {
  if (params.isNewVisitor) {
    return "new";
  }

  const now = Date.now();

  const lastSeenAge = params.lastSeen
    ? now - new Date(params.lastSeen).getTime()
    : 0;

  const firstSeenAge = params.firstSeen
    ? now - new Date(params.firstSeen).getTime()
    : 0;

  const daysSinceLastSeen =
    lastSeenAge / (1000 * 60 * 60 * 24);

  const daysSinceFirstSeen =
    firstSeenAge / (1000 * 60 * 60 * 24);

  if (daysSinceLastSeen > 30) {
    return "dormant";
  }

  if (
    params.totalPageViews >= 20 ||
    params.totalSessions >= 10
  ) {
    return "highly-active";
  }

  if (
    daysSinceFirstSeen >= 14 &&
    params.totalSessions >= 5
  ) {
    return "constant";
  }

  if (
    daysSinceLastSeen <= 7 &&
    params.totalPageViews >= 5
  ) {
    return "active";
  }

  return "returning";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const path =
      typeof body?.path === "string"
        ? body.path.slice(0, 2000)
        : "";

    if (!path) {
      return NextResponse.json(
        {
          status: "error",
          message: "path is required.",
        },
        { status: 400 }
      );
    }

    const visitorCookie =
      request.cookies.get(VISITOR_COOKIE)?.value;

    const isNewVisitor = !visitorCookie;

    const visitorId =
      visitorCookie || randomUUID();

    const sessionCookie =
      request.cookies.get(SESSION_COOKIE)?.value;

    const isNewSession = !sessionCookie;

    const sessionId =
      sessionCookie || randomUUID();

    const userAgent =
      request.headers.get("user-agent") ||
      "unknown";

    const parsedUserAgent =
      parseUserAgent(userAgent);

    const client =
      getClientMetadata(body?.metadata);

    const geo = getVisitorGeo(request);

    const deploymentHost =
      getDeploymentHost(request);

    const deploymentProvider =
      getDeploymentProvider(deploymentHost);

    const requestUrl = new URL(request.url);

    const pageUrl =
      typeof body?.url === "string"
        ? body.url.slice(0, 4000)
        : requestUrl.toString();

    let pageQuery: URLSearchParams;

    try {
      pageQuery = new URL(pageUrl).searchParams;
    } catch {
      pageQuery = requestUrl.searchParams;
    }

    const utmSource =
      client.utmSource ||
      pageQuery.get("utm_source") ||
      undefined;

    const utmMedium =
      client.utmMedium ||
      pageQuery.get("utm_medium") ||
      undefined;

    const utmCampaign =
      client.utmCampaign ||
      pageQuery.get("utm_campaign") ||
      undefined;

    const utmTerm =
      client.utmTerm ||
      pageQuery.get("utm_term") ||
      undefined;

    const utmContent =
      client.utmContent ||
      pageQuery.get("utm_content") ||
      undefined;

    const referrer =
      client.referrer ||
      request.headers.get("referer") ||
      undefined;

    const now = new Date();

    await connectToDatabase();

    const existingVisitor =
      await Visitor.findOne({ visitorId })
        .select(
          "firstSeen lastSeen totalPageViews totalSessions"
        )
        .lean();

    const previousPageViews =
      existingVisitor?.totalPageViews || 0;

    const previousSessions =
      existingVisitor?.totalSessions || 0;

    const totalPageViews =
      previousPageViews + 1;

    const totalSessions =
      previousSessions +
      (isNewSession ? 1 : 0);

    const status = determineStatus({
      isNewVisitor,
      totalPageViews,
      totalSessions,
      lastSeen: existingVisitor?.lastSeen,
      firstSeen: existingVisitor?.firstSeen,
    });

    await Visitor.findOneAndUpdate(
      { visitorId },
      {
        $setOnInsert: {
          visitorId,
          firstSeen: now,
          firstPath: path,
          firstReferrer: referrer,
          activeDays: 1,
        },

        $set: {
          lastSeen: now,
          latestPath: path,
          latestReferrer: referrer,

          language: client.language,
          languages: client.languages,

          timezone:
            client.timezone ||
            geo.timezone,

          screenWidth:
            client.screenWidth,

          screenHeight:
            client.screenHeight,

          viewportWidth:
            client.viewportWidth,

          viewportHeight:
            client.viewportHeight,

          isStandalonePwa:
            client.isStandalonePwa,

          cookiesEnabled:
            client.cookiesEnabled,

          deviceType:
            parsedUserAgent.deviceType,

          deviceModel:
            parsedUserAgent.deviceModel,

          browser:
            parsedUserAgent.browser,

          browserVersion:
            parsedUserAgent.browserVersion,

          operatingSystem:
            parsedUserAgent.operatingSystem,

          operatingSystemVersion:
            parsedUserAgent.operatingSystemVersion,

          country:
            geo.country,

          countryCode:
            geo.countryCode,

          region:
            geo.region,

          city:
            geo.city,

          deploymentHost,

          deploymentProvider,

          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent,

          status,
        },

        $inc: {
          totalPageViews: 1,

          ...(isNewSession
            ? { totalSessions: 1 }
            : {}),
        },
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    await PageView.create({
      path,
      visitorId,
      sessionId,
      userAgent,
      referrer,

      host: deploymentHost,
      deploymentProvider,

      language: client.language,
      deviceType: parsedUserAgent.deviceType,
      browser: parsedUserAgent.browser,
      operatingSystem:
        parsedUserAgent.operatingSystem,

      country: geo.country,
      countryCode: geo.countryCode,
      region: geo.region,
      city: geo.city,
      timezone:
        client.timezone ||
        geo.timezone,

      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
    });

    const response =
      NextResponse.json({
        status: "ok",
      });

    if (isNewVisitor) {
      response.cookies.set(
        VISITOR_COOKIE,
        visitorId,
        {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: VISITOR_MAX_AGE,
        }
      );
    }

    if (isNewSession) {
      response.cookies.set(
        SESSION_COOKIE,
        sessionId,
        {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_MAX_AGE,
        }
      );
    }

    return response;
  } catch (error) {
    console.error(
      "[TGO Analytics] Tracking failed:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message:
          "Analytics tracking failed.",
      },
      { status: 500 }
    );
  }
}
