import { connectToDatabase } from "@/lib/db";
import { getAdminBasePath } from "@/lib/adminPath";
import PushAnalyticsSnapshot from "@/models/PushAnalyticsSnapshot";
import { sendAdminPush } from "@/lib/push/server";

interface AnalyticsSnapshotInput {
  uniqueVisitorCount: number;
  averageDailyVisitors: number;
  peakDailyVisitors: number;
  peakDay: string | null;
}

export async function captureAnalyticsSnapshot(
  metrics: AnalyticsSnapshotInput
): Promise<void> {
  await connectToDatabase();

  const snapshotDate = new Date().toISOString().slice(0, 10);
  const alreadyCaptured = await PushAnalyticsSnapshot.findOne({ snapshotDate }).lean();
  if (alreadyCaptured) return;

  const previous = await PushAnalyticsSnapshot.findOne({
    snapshotDate: { $lt: snapshotDate },
  }).sort({ snapshotDate: -1 }).lean();

  try {
    await PushAnalyticsSnapshot.create({ snapshotDate, ...metrics });
  } catch (error) {
    // Concurrent analytics requests may race to create today's snapshot.
    if ((error as { code?: number })?.code === 11000) return;
    throw error;
  }

  if (!previous) return;

  const notices: Array<{
    title: string;
    body: string;
    category: "analytics";
    tag: string;
  }> = [];

  if (metrics.uniqueVisitorCount > previous.uniqueVisitorCount) {
    notices.push({
      title: "Unique visitors increased",
      body: `Unique visitors rose from ${previous.uniqueVisitorCount} to ${metrics.uniqueVisitorCount}.`,
      category: "analytics",
      tag: `analytics-unique-${snapshotDate}`,
    });
  }

  if (metrics.averageDailyVisitors !== previous.averageDailyVisitors) {
    const direction = metrics.averageDailyVisitors > previous.averageDailyVisitors
      ? "increased" : "decreased";
    notices.push({
      title: `Average daily visitors ${direction}`,
      body: `Average daily visitors changed from ${previous.averageDailyVisitors} to ${metrics.averageDailyVisitors}.`,
      category: "analytics",
      tag: `analytics-average-${snapshotDate}`,
    });
  }

  if (metrics.peakDailyVisitors > previous.peakDailyVisitors) {
    notices.push({
      title: "Daily visitor peak increased",
      body: `The daily peak rose from ${previous.peakDailyVisitors} to ${metrics.peakDailyVisitors} visitors.`,
      category: "analytics",
      tag: `analytics-peak-${snapshotDate}`,
    });
  }

  await Promise.all(notices.map((notice) =>
    sendAdminPush({
      ...notice,
      url: `${getAdminBasePath()}/analytics`,
    }).catch((error) => {
      console.error("[Push] Analytics notification failed:", error);
      return { sent: 0, removed: 0, failed: 1 };
    })
  ));
}
