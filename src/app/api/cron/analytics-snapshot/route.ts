import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PageView from "@/models/PageView";
import { captureAnalyticsSnapshot } from "@/lib/push/analyticsSnapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Scheduled analytics is not configured." },
      { status: 503 }
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();

    const [uniqueVisitors, dailyVisitors] = await Promise.all([
      PageView.distinct("visitorId"),

      PageView.aggregate([
        {
          $project: {
            visitorId: 1,
            day: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "UTC",
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
            visitors: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totalDays = dailyVisitors.length;

    const averageDailyVisitors =
      totalDays > 0
        ? Math.round(
            (dailyVisitors.reduce(
              (sum, item) => sum + Number(item.visitors),
              0
            ) / totalDays) * 100
          ) / 100
        : 0;

    const peakDay = dailyVisitors.reduce(
      (
        highest: { _id: string; visitors: number } | null,
        current: { _id: string; visitors: number }
      ) =>
        Number(current.visitors) > Number(highest?.visitors ?? 0)
          ? current
          : highest,
      null
    );

    await captureAnalyticsSnapshot({
      uniqueVisitorCount: uniqueVisitors.length,
      averageDailyVisitors,
      peakDailyVisitors: peakDay ? Number(peakDay.visitors) : 0,
      peakDay: peakDay?._id ?? null,
    });

    return NextResponse.json({
      status: "ok",
      uniqueVisitorCount: uniqueVisitors.length,
      averageDailyVisitors,
      peakDailyVisitors: peakDay ? Number(peakDay.visitors) : 0,
      snapshotProcessed: true,
    });
  } catch (error) {
    console.error("[Push] Scheduled analytics snapshot failed:", error);

    return NextResponse.json(
      { error: "Could not process the analytics snapshot." },
      { status: 500 }
    );
  }
}
