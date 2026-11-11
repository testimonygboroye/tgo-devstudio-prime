import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { EngagementEvent, EngagementProfile, EngagementRedemption } from "@/models/Engagement";
import { tierForLifetimePoints } from "@/lib/engagement/tiers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Scheduled engagement expiry is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== "Bearer " + secret) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  await connectToDatabase();
  const now = new Date();
  const due = await EngagementEvent.find({ points: { $gt: 0 }, expiresAt: { $lte: now }, expiredAt: { $exists: false } }).sort({ expiresAt: 1 }).limit(500).lean();
  let expired = 0;
  for (const event of due) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const current = await EngagementEvent.findOne({ _id: event._id, expiredAt: { $exists: false } }).session(session);
        if (!current) return;
        const profile = await EngagementProfile.findOne({ clientId: current.clientId }).session(session);
        if (profile) {
          profile.points = Math.max(0, profile.points - current.points);
          profile.tier = tierForLifetimePoints(profile.lifetimePoints);
          await profile.save({ session });
        }
        current.expiredAt = now;
        await current.save({ session });
        expired += 1;
      });
    } finally { await session.endSession(); }
  }
  const coupons = await EngagementRedemption.updateMany({ couponStatus: "issued", couponExpiresAt: { $lte: now } }, { $set: { couponStatus: "expired" } });
  return NextResponse.json({ ok: true, scanned: due.length, expired, expiredCoupons: coupons.modifiedCount });
}
