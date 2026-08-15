import { connectToDatabase } from "@/lib/db";
import PageView from "@/models/PageView";

interface LogPageViewParams {
  path: string;
  visitorId: string;
  userAgent: string;
  referrer?: string;
}

export async function logPageView(params: LogPageViewParams): Promise<void> {
  try {
    await connectToDatabase();
    await PageView.create(params);
  } catch (error) {
    console.error("Failed to write page view log:", error);
  }
}
