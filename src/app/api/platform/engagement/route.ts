import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import {
  EngagementProfile, EngagementReward, EngagementReferral, EngagementEvent,
  EngagementEarnRule, EngagementCampaign, EngagementCommission, EngagementFraudCase,
  EngagementBadge, EngagementReferralRule,
} from "@/models/Engagement";
import PaymentTransaction from "@/models/PaymentTransaction";
import FinancialLedgerEntry from "@/models/FinancialLedgerEntry";
import { tierForLifetimePoints } from "@/lib/engagement/tiers";
import { awardEngagementPoints } from "@/lib/engagement/award";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
async function founder() {
  const session = await getServerSession();
  if (!session) return { session: null, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  if (!session.role?.isFounderRole) return { session: null, response: NextResponse.json({ error: "Founder access required." }, { status: 403 }) };
  return { session, response: null };
}
export async function GET() {
  const auth = await founder(); if (auth.response) return auth.response;
  await connectToDatabase();
  const [rewards, referrals, profiles, eventCount, earnRules, campaigns, commissions, fraudCases, badges, referralRule] = await Promise.all([
    EngagementReward.find().sort({ createdAt: -1 }).lean(),
    EngagementReferral.find().populate("referrerId", "name email").populate("referredClientId", "name email").sort({ createdAt: -1 }).limit(200).lean(),
    EngagementProfile.find().populate("clientId", "name email").sort({ lifetimePoints: -1 }).limit(100).lean(),
    EngagementEvent.countDocuments(),
    EngagementEarnRule.find().sort({ eventType: 1 }).lean(),
    EngagementCampaign.find().sort({ startsAt: -1 }).lean(),
    EngagementCommission.find().populate("referrerId", "name email").sort({ createdAt: -1 }).limit(200).lean(),
    EngagementFraudCase.find({ status: "open" }).populate("clientId", "name email").sort({ createdAt: -1 }).limit(100).lean(),
    EngagementBadge.find().sort({ lifetimePointsRequired: 1 }).lean(),
    EngagementReferralRule.findOne({ key: "default" }).lean(),
  ]);
  return NextResponse.json({ rewards, referrals, profiles, eventCount, earnRules, campaigns, commissions, fraudCases, badges, referralRule }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST(request: NextRequest) {
  const auth = await founder();
  if (!auth.session) return auth.response || NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  await connectToDatabase();
  const actorId = String(auth.session.user._id);
  const audit = async (action: string, targetType: string, targetId: string, metadata: Record<string, unknown> = {}) =>
    writePlatformAuditEvent({ actorType: "human", actorId, actorLabel: auth.session!.user.name, action, module: "engagement", targetType, targetId, outcome: "success", metadata });

  if (body.action === "referral_rule.save") {
    const commissionPercent = Number(body.commissionPercent), minimumPurchaseMinor = Number(body.minimumPurchaseMinor), referrerPoints = Number(body.referrerPoints);
    if (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 50 || !Number.isSafeInteger(minimumPurchaseMinor) || minimumPurchaseMinor < 0 || !Number.isSafeInteger(referrerPoints) || referrerPoints < 0 || referrerPoints > 10000) return NextResponse.json({ error: "Enter valid commission percentage, minimum purchase and points." }, { status: 400 });
    const rule = await EngagementReferralRule.findOneAndUpdate({ key: "default" }, { $set: { commissionPercent, minimumPurchaseMinor, referrerPoints, active: body.active !== false } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await audit("engagement.referral_rules_updated", "referral_rule", String(rule._id));
    return NextResponse.json({ rule });
  }
  if (body.action === "badge.create") {
    const key = String(body.key || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"), name = String(body.name || "").trim(), threshold = Number(body.lifetimePointsRequired);
    if (key.length < 3 || name.length < 2 || !Number.isSafeInteger(threshold) || threshold < 1) return NextResponse.json({ error: "Enter a valid badge key, name and threshold." }, { status: 400 });
    const badge = await EngagementBadge.create({ key, name, description: String(body.description || "").slice(0, 300), lifetimePointsRequired: threshold, active: true });
    await audit("engagement.badge_created", "badge", String(badge._id));
    return NextResponse.json({ badge }, { status: 201 });
  }
  if (body.action === "earn_rule.save") {
    const eventType = String(body.eventType || "").trim(), points = Number(body.points), dailyCap = Number(body.dailyCap || 0);
    if (!/^[a-z][a-z0-9_]{2,59}$/.test(eventType) || !Number.isSafeInteger(points) || points < 0 || points > 100000 || !Number.isSafeInteger(dailyCap) || dailyCap < 0) return NextResponse.json({ error: "Enter a valid event key, points and daily cap." }, { status: 400 });
    const campaignId = mongoose.isValidObjectId(String(body.campaignId || "")) ? body.campaignId : undefined;
    const rule = await EngagementEarnRule.findOneAndUpdate({ eventType }, { $set: { points, dailyCap, active: body.active !== false, campaignId } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await audit("engagement.earn_rule_saved", "earn_rule", String(rule._id), { eventType, points, dailyCap });
    return NextResponse.json({ rule });
  }
  if (body.action === "campaign.create") {
    const startsAt = new Date(String(body.startsAt || "")), endsAt = new Date(String(body.endsAt || "")), multiplier = Number(body.multiplier || 1), name = String(body.name || "").trim();
    if (name.length < 2 || !Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt || !Number.isFinite(multiplier) || multiplier < 1 || multiplier > 5) return NextResponse.json({ error: "Enter a valid campaign name, date range and multiplier." }, { status: 400 });
    const campaign = await EngagementCampaign.create({ name: name.slice(0, 100), startsAt, endsAt, multiplier, active: body.active === true });
    await audit("engagement.campaign_created", "campaign", String(campaign._id));
    return NextResponse.json({ campaign }, { status: 201 });
  }
  if (body.action === "fraud.resolve") {
    if (!mongoose.isValidObjectId(String(body.caseId || "")) || !["reviewed", "dismissed"].includes(String(body.status))) return NextResponse.json({ error: "Invalid fraud case decision." }, { status: 400 });
    const item = await EngagementFraudCase.findOneAndUpdate({ _id: body.caseId, status: "open" }, { $set: { status: body.status, reviewedBy: auth.session.user._id } }, { new: true });
    if (!item) return NextResponse.json({ error: "Open fraud case not found." }, { status: 404 });
    await audit("engagement.fraud_case_resolved", "fraud_case", String(item._id), { status: item.status });
    return NextResponse.json({ item });
  }
  if (body.action === "reward.create") {
    const name = String(body.name || "").trim(), kind = String(body.kind || "points"), pointsCost = Number(body.pointsCost);
    const stock = body.stock === undefined || body.stock === "" ? -1 : Number(body.stock);
    const discountPercent = Number(body.discountPercent || 0), creditMinor = Number(body.creditMinor || 0), currency = String(body.currency || "NGN").toUpperCase();
    if (name.length < 2 || !["points", "discount", "account_credit"].includes(kind) || !Number.isSafeInteger(pointsCost) || pointsCost < 1 || (!Number.isSafeInteger(stock) || stock < -1) || (kind === "discount" && (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100)) || (kind === "account_credit" && (!Number.isSafeInteger(creditMinor) || creditMinor < 1)) || !/^[A-Z]{3}$/.test(currency)) return NextResponse.json({ error: "Enter valid reward details, stock, currency and reward value." }, { status: 400 });
    const reward = await EngagementReward.create({ name, description: String(body.description || "").slice(0, 500), kind, pointsCost, creditMinor: kind === "account_credit" ? creditMinor : 0, currency, discountPercent: kind === "discount" ? discountPercent : 0, stock, active: true });
    await audit("engagement.reward_created", "reward", String(reward._id), { kind, pointsCost });
    return NextResponse.json({ reward }, { status: 201 });
  }
  if (body.action === "reward.toggle") {
    if (!mongoose.isValidObjectId(String(body.rewardId || ""))) return NextResponse.json({ error: "Invalid reward." }, { status: 400 });
    const reward = await EngagementReward.findByIdAndUpdate(body.rewardId, { $set: { active: body.active === true } }, { new: true });
    if (!reward) return NextResponse.json({ error: "Reward not found." }, { status: 404 });
    await audit("engagement.reward_status_changed", "reward", String(reward._id), { active: reward.active });
    return NextResponse.json({ reward });
  }
  if (body.action === "points.grant") {
    const clientId = String(body.clientId || ""), points = Number(body.points);
    if (!mongoose.isValidObjectId(clientId) || !Number.isSafeInteger(points) || points < 1 || points > 100000) return NextResponse.json({ error: "Choose a valid client and a points amount between 1 and 100,000." }, { status: 400 });
    const session = await mongoose.startSession();
    let profile: unknown = null;
    try {
      await session.withTransaction(async () => {
        const eventKey = "admin-grant:" + new mongoose.Types.ObjectId().toString();
        await EngagementEvent.create([{ clientId, eventKey, eventType: "admin_points_grant", points, metadata: { note: String(body.note || "Founder reward grant").slice(0, 200), actorId } }], { session });
        const updated = await EngagementProfile.findOneAndUpdate({ clientId }, { $inc: { points, lifetimePoints: points }, $setOnInsert: { clientId } }, { upsert: true, new: true, setDefaultsOnInsert: true, session });
        updated.tier = tierForLifetimePoints(updated.lifetimePoints); await updated.save({ session }); profile = updated;
      });
    } finally { await session.endSession(); }
    await audit("engagement.points_granted", "client", clientId, { points });
    return NextResponse.json({ profile });
  }
  if (body.action === "referral.qualify") {
    const referralId = String(body.referralId || ""), currency = String(body.currency || "NGN").toUpperCase();
    if (!mongoose.isValidObjectId(referralId) || !/^[A-Z]{3}$/.test(currency)) return NextResponse.json({ error: "Choose a valid referral and currency." }, { status: 400 });
    const candidate = await EngagementReferral.findOne({ _id: referralId, status: "pending", referredClientId: { $exists: true } });
    if (!candidate?.referredClientId || String(candidate.referrerId) === String(candidate.referredClientId)) return NextResponse.json({ error: "Referral is not eligible for qualification." }, { status: 409 });
    const rule = await EngagementReferralRule.findOne({ key: "default" }).lean();
    if (rule && !rule.active) return NextResponse.json({ error: "Referral qualification is disabled." }, { status: 409 });
    const paid = await PaymentTransaction.aggregate([{ $match: { clientId: candidate.referredClientId, status: "paid", currency } }, { $group: { _id: null, total: { $sum: "$amountMinor" } } }]);
    const paidMinor = Number(paid[0]?.total || 0);
    if (paidMinor <= 0 || paidMinor < Number(rule?.minimumPurchaseMinor || 0)) return NextResponse.json({ error: "The referred client must complete verified paid transactions meeting the minimum in the selected currency." }, { status: 409 });
    const commissionMinor = Math.floor(paidMinor * Number(rule?.commissionPercent ?? 5) / 100);
    const session = await mongoose.startSession();
    let referral: any = null;
    try {
      await session.withTransaction(async () => {
        referral = await EngagementReferral.findOneAndUpdate({ _id: candidate._id, status: "pending" }, { $set: { status: "qualified", qualifiedAt: new Date(), commissionMinor, currency } }, { new: true, session });
        if (!referral) throw new Error("Referral has already been qualified.");
        if (commissionMinor > 0) await EngagementCommission.create([{ referralId: referral._id, referrerId: referral.referrerId, amountMinor: commissionMinor, currency, status: "pending" }], { session });
      });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Referral qualification failed." }, { status: 409 });
    } finally { await session.endSession(); }
    const points = Number(rule?.referrerPoints ?? 300);
    if (points > 0) await awardEngagementPoints({ clientId: String(referral.referrerId), eventKey: "referral-qualified:" + String(referral._id), eventType: "referral_qualified", metadata: { referralId: String(referral._id) } });
    await audit("engagement.referral_qualified", "referral", String(referral._id), { currency, paidMinor, commissionMinor, points });
    return NextResponse.json({ referral });
  }
  if (body.action === "commission.approve") {
    if (!mongoose.isValidObjectId(String(body.commissionId || ""))) return NextResponse.json({ error: "Invalid commission." }, { status: 400 });
    const item = await EngagementCommission.findOneAndUpdate({ _id: body.commissionId, status: "pending", amountMinor: { $gt: 0 } }, { $set: { status: "approved", approvedBy: auth.session.user._id } }, { new: true });
    if (!item) return NextResponse.json({ error: "Pending commission not found." }, { status: 409 });
    await audit("engagement.commission_approved", "commission", String(item._id));
    return NextResponse.json({ item });
  }
  if (body.action === "commission.record_payout") {
    const commissionId = String(body.commissionId || ""), reference = String(body.settlementReference || "").trim();
    if (!mongoose.isValidObjectId(commissionId) || reference.length < 5 || reference.length > 100) return NextResponse.json({ error: "A valid commission and verified Paystack transfer reference are required." }, { status: 400 });
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: "Paystack transfer verification is not configured. Do not mark this commission paid manually." }, { status: 503 });
    const current = await EngagementCommission.findOne({ _id: commissionId, status: "approved" });
    if (!current) return NextResponse.json({ error: "Only approved commissions can be paid." }, { status: 409 });
    const verify = await fetch("https://api.paystack.co/transfer/verify/" + encodeURIComponent(reference), { headers: { Authorization: "Bearer " + secret }, cache: "no-store", signal: AbortSignal.timeout(12000) });
    const verification = await verify.json().catch(() => ({}));
    const transfer = verification?.data;
    if (!verify.ok || verification?.status !== true || transfer?.status !== "success" || Number(transfer?.amount) !== current.amountMinor || String(transfer?.currency || "").toUpperCase() !== current.currency) return NextResponse.json({ error: "Paystack did not confirm a successful transfer matching this commission amount and currency." }, { status: 409 });
    const session = await mongoose.startSession();
    let item: any = null;
    try {
      await session.withTransaction(async () => {
        const locked = await EngagementCommission.findOne({ _id: commissionId, status: "approved", settlementReference: { $exists: false } }).session(session);
        if (!locked) throw new Error("Commission has already been settled.");
        await FinancialLedgerEntry.create([
          { entryKey: reference + ":commission-expense", accountCode: "expense", direction: "debit", amountMinor: locked.amountMinor, currency: locked.currency, source: "manual_adjustment", sourceReference: reference, clientId: locked.referrerId, postedAt: new Date(), metadata: { reason: "verified_referral_commission", referralId: String(locked.referralId) } },
          { entryKey: reference + ":commission-cash", accountCode: "cash", direction: "credit", amountMinor: locked.amountMinor, currency: locked.currency, source: "manual_adjustment", sourceReference: reference, clientId: locked.referrerId, postedAt: new Date(), metadata: { reason: "verified_referral_commission", referralId: String(locked.referralId) } },
        ], { session });
        locked.status = "paid"; locked.settlementReference = reference; locked.paidAt = new Date(); await locked.save({ session }); item = locked;
      });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Settlement record failed." }, { status: 409 });
    } finally { await session.endSession(); }
    await audit("engagement.commission_paid_verified", "commission", String(item._id), { settlementReference: reference });
    return NextResponse.json({ item });
  }
  return NextResponse.json({ error: "Unsupported engagement action." }, { status: 400 });
}
