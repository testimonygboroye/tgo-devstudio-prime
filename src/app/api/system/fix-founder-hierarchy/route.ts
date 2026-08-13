import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Role from "@/models/Role";

export async function GET(request: NextRequest) {
  const providedSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  await connectToDatabase();

  await Role.updateOne({ isFounderRole: true }, { hierarchyLevel: 0 });

  const roles = await Role.find().select("name hierarchyLevel isFounderRole").lean();

  return NextResponse.json({ status: "ok", roles });
}
