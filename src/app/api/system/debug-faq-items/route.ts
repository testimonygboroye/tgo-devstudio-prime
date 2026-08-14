import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import FaqItem from "@/models/FaqItem";

export async function GET(request: NextRequest) {
  const providedSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  await connectToDatabase();
  const items = await FaqItem.find().select("question publishStatus category").lean();

  return NextResponse.json({ status: "ok", count: items.length, items });
}
