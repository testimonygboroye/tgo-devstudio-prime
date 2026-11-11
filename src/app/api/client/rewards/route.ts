import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import { EngagementProfile, EngagementReward, EngagementReferral, EngagementRedemption, EngagementBadgeAward, EngagementFraudCase } from "@/models/Engagement";
import { tierForLifetimePoints } from "@/lib/engagement/tiers";
import ClientCreditAccount from "@/models/ClientCreditAccount";
import FinancialLedgerEntry from "@/models/FinancialLedgerEntry";
import PlatformNotification from "@/models/PlatformNotification";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const dynamic = "force-dynamic";
async function clientSession() {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client" || !session.user.isEmailVerified) return null;
  return session;
}
export async function GET() {
  const session = await clientSession();
  if (!session) return NextResponse.json({ error: "Verified client sign-in required." }, { status: 401 });
  await connectToDatabase();
  const clientId = session.user._id;
  const profile = await EngagementProfile.findOneAndUpdate({ clientId }, { $setOnInsert: { clientId } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
  const [rewards, referrals, redemptions, badges] = await Promise.all([
    EngagementReward.find({ active: true, $or: [{ stock: -1 }, { $expr: { $gt: ["$stock", "$redeemed"] } }] }).sort({ pointsCost: 1 }).lean(),
    EngagementReferral.find({ referrerId: clientId }).sort({ createdAt: -1 }).limit(50).lean(),
    EngagementRedemption.find({ clientId }).populate("rewardId", "name kind").sort({ createdAt: -1 }).limit(30).lean(),
    EngagementBadgeAward.find({ clientId }).populate("badgeId", "name description lifetimePointsRequired").sort({ awardedAt: -1 }).lean(),
  ]);
  return NextResponse.json({ profile: { points: profile?.points || 0, lifetimePoints: profile?.lifetimePoints || 0, tier: profile?.tier || "starter" }, rewards, referrals, redemptions, badges }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST(request: NextRequest) {
  const session = await clientSession();
  if (!session) return NextResponse.json({ error: "Verified client sign-in required." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  await connectToDatabase();
  const clientId = session.user._id;
  const actorId = String(clientId);
  if (body.action === "referral.create") {
    const existing = await EngagementReferral.findOne({ referrerId: clientId, status: "pending", referredClientId: { $exists: false } }).lean();
    if (existing) return NextResponse.json({ code: existing.code });
    const code = `TGO${randomBytes(5).toString("hex").toUpperCase()}`;
    try {
      const referral = await EngagementReferral.create({ code, referrerId: clientId });
      await PlatformNotification.create({ recipientId: clientId, category: "engagement", title: "Your referral link is ready", body: "Share your referral code with a new TGO client. Rewards are issued after verified qualifying payment.", href: "/client/rewards", dedupeKey: "referral-link:" + String(referral._id), metadata: { referralId: String(referral._id) } });
      await writePlatformAuditEvent({ actorType: "human", actorId, actorLabel: session.user.name, action: "engagement.referral_link_created", module: "engagement", targetType: "referral", targetId: String(referral._id), outcome: "success" });
      return NextResponse.json({ code: referral.code }, { status: 201 });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const existing = await EngagementReferral.findOne({ referrerId: clientId, status: "pending", referredClientId: { $exists: false } }).lean();
        if (existing) return NextResponse.json({ code: existing.code });
      }
      throw error;
    }
  }
  if (body.action === "referral.apply") {
    const code = String(body.code || "").trim().toUpperCase();
    const existingAttribution = await EngagementReferral.findOne({ referredClientId: clientId }).select("_id");
    if (existingAttribution) return NextResponse.json({ error: "A referral code has already been linked to this account." }, { status: 409 });
    if (!/^TGO[A-F0-9]{10}$/.test(code)) return NextResponse.json({ error: "Enter a valid referral code." }, { status: 400 });
    const referral = await EngagementReferral.findOne({ code, status: "pending", referredClientId: { $exists: false }, referrerId: { $ne: clientId } });
    if (!referral) {
      const self = await EngagementReferral.findOne({ code, referrerId: clientId });
      if (self) await EngagementFraudCase.create({ clientId, referralId: self._id, reason: "Self-referral attempt detected.", severity: "high" });
      return NextResponse.json({ error: "This referral code is invalid, already used, or belongs to this account." }, { status: 409 });
    }
    referral.referredClientId = clientId; referral.attributedAt = new Date();
    await referral.save();
    await PlatformNotification.create([{ recipientId: clientId, category: "engagement", title: "Referral code applied", body: "Your referral code has been linked to your account. Qualification follows verified payment.", href: "/client/rewards", dedupeKey: "referral-applied:" + String(referral._id) + ":" + actorId, metadata: { referralId: String(referral._id) } }, { recipientId: referral.referrerId, category: "engagement", title: "Your referral was used", body: "A new client has linked your referral code. Your reward is pending verified qualifying payment.", href: "/client/rewards", dedupeKey: "referral-used:" + String(referral._id), metadata: { referralId: String(referral._id) } }]);
    await writePlatformAuditEvent({ actorType: "human", actorId, actorLabel: session.user.name, action: "engagement.referral_code_applied", module: "engagement", targetType: "referral", targetId: String(referral._id), outcome: "success", metadata: { code } });
    return NextResponse.json({ ok: true, message: "Referral code linked to your account. Qualification follows verified payment." });
  }
  if (body.action !== "reward.redeem" || typeof body.rewardId !== "string" || !mongoose.isValidObjectId(body.rewardId)) return NextResponse.json({ error: "Unsupported rewards action." }, { status: 400 });
  const dbSession = await mongoose.startSession();
  let result: { reference: string; rewardName: string; kind: string; couponCode?: string } = { reference: "", rewardName: "", kind: "" };
  try {
    await dbSession.withTransaction(async () => {
      const reward = await EngagementReward.findById(body.rewardId).session(dbSession);
      if (!reward || !reward.active || (reward.stock !== -1 && reward.redeemed >= reward.stock)) throw new Error("This reward is no longer available.");
      const stockFilter: Record<string, unknown> = { _id: reward._id, active: true }; if (reward.stock !== -1) stockFilter.redeemed = reward.redeemed;
      const stockUpdate = await EngagementReward.collection.updateOne(stockFilter, { $inc: { redeemed: 1 } }, { session: dbSession });
      if (stockUpdate.modifiedCount !== 1) throw new Error("This reward was just redeemed by another request. Please retry.");
      const profile = await EngagementProfile.findOneAndUpdate(
        { clientId, points: { $gte: reward.pointsCost } },
        { $inc: { points: -reward.pointsCost } }, { new: true, session: dbSession }
      );
      if (!profile) throw new Error("You do not have enough points for this reward.");
      profile.tier = tierForLifetimePoints(profile.lifetimePoints);
      await profile.save({ session: dbSession });
      if (reward.kind === "account_credit" && reward.creditMinor <= 0) throw new Error("Reward credit value is not configured.");
      const reference = `RWD-${new mongoose.Types.ObjectId().toString().toUpperCase()}`;
      const couponCode = reward.kind === "discount" ? `TGO-${randomBytes(6).toString("hex").toUpperCase()}` : undefined;
      await EngagementRedemption.create([{
        clientId, rewardId: reward._id, pointsSpent: reward.pointsCost, reference,
        ...(couponCode ? { couponCode, couponStatus: "issued", couponExpiresAt: new Date(Date.now() + 90 * 86400000) } : {}),
      }], { session: dbSession });
      if (reward.kind === "account_credit") {
        await ClientCreditAccount.findOneAndUpdate(
          { clientId, currency: reward.currency },
          { $inc: { balanceMinor: reward.creditMinor }, $setOnInsert: { clientId, currency: reward.currency } },
          { upsert: true, new: true, session: dbSession }
        );
        await FinancialLedgerEntry.create([
          { entryKey: `${reference}:debit`, accountCode: "revenue", direction: "debit", amountMinor: reward.creditMinor, currency: reward.currency, source: "manual_adjustment", sourceReference: reference, clientId, postedAt: new Date(), metadata: { reason: "engagement_reward" } },
          { entryKey: `${reference}:credit`, accountCode: "client_credit", direction: "credit", amountMinor: reward.creditMinor, currency: reward.currency, source: "manual_adjustment", sourceReference: reference, clientId, postedAt: new Date(), metadata: { reason: "engagement_reward" } },
        ], { session: dbSession });
      }
      result = { reference, rewardName: reward.name, kind: reward.kind, ...(couponCode ? { couponCode } : {}) };
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Reward redemption failed." }, { status: 409 });
  } finally { await dbSession.endSession(); }
  await PlatformNotification.create({ recipientId: clientId, category: "engagement", title: "Reward redeemed", body: result?.kind === "account_credit" ? "Your account credit reward has been posted to your client balance." : result?.kind === "discount" ? "Your discount coupon " + result?.couponCode + " is ready to use at checkout." : "You redeemed " + result?.rewardName + ".", href: "/client/rewards", dedupeKey: "reward-redemption:" + result?.reference, metadata: { reference: result?.reference, rewardId: body.rewardId } });
  await writePlatformAuditEvent({ actorType: "human", actorId, actorLabel: session.user.name, action: "engagement.reward_redeemed", module: "engagement", targetType: "redemption", targetId: result?.reference, outcome: "success", metadata: { reference: result?.reference, rewardId: body.rewardId } });
  return NextResponse.json({ ok: true, redemption: result });
}
