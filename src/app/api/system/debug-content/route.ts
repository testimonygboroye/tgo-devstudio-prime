import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import ProcessStep from "@/models/ProcessStep";

export async function GET(request: NextRequest) {
  const providedSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  await connectToDatabase();
  const services = await Service.find().select("title publishStatus").lean();
  const steps = await ProcessStep.find().select("title publishStatus").lean();

  return NextResponse.json({ status: "ok", services, steps });
}
