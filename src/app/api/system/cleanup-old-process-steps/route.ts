import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ProcessStep from "@/models/ProcessStep";

const OLD_TITLES = [
  "Discovery",
  "Planning & Architecture",
  "Design",
  "Development",
  "Testing",
  "Launch",
  "Support & Maintenance",
];

export async function GET(request: NextRequest) {
  const providedSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  await connectToDatabase();
  const result = await ProcessStep.deleteMany({ title: { $in: OLD_TITLES } });

  return NextResponse.json({ status: "ok", deleted: result.deletedCount });
}
