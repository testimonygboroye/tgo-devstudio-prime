import mongoose from "mongoose";
import { EngagementEvent, EngagementProfile, EngagementEarnRule, EngagementCampaign, EngagementBadge, EngagementBadgeAward } from "@/models/Engagement";
import { tierForLifetimePoints } from "@/lib/engagement/tiers";

export async function awardEngagementPoints(input: { clientId: string; eventKey: string; eventType: string; metadata?: Record<string, unknown>; pointsOverride?: number }) {
  if (!mongoose.isValidObjectId(input.clientId) || !input.eventKey || input.eventKey.length > 180) return { awarded: false, reason: "invalid" };
  const rule = await EngagementEarnRule.findOne({ eventType: input.eventType, active: true }).lean();
  let points = input.pointsOverride ?? rule?.points ?? ({ invoice_paid: 100, payment_verified: 100, project_completed: 500, review_submitted: 75, profile_completed: 100, referral_qualified: 300 } as Record<string, number>)[input.eventType] ?? 0;
  if (!points || !Number.isSafeInteger(points) || points < 1) return { awarded: false, reason: "no-rule" };
  const now = new Date();
  const defaults = [
    { key: "first-steps", name: "First Steps", description: "Earn your first 100 lifetime points.", lifetimePointsRequired: 100 },
    { key: "rising-star", name: "Rising Star", description: "Reach 1,500 lifetime points.", lifetimePointsRequired: 1500 },
    { key: "gold-standard", name: "Gold Standard", description: "Reach 5,000 lifetime points.", lifetimePointsRequired: 5000 },
    { key: "platinum-elite", name: "Platinum Elite", description: "Reach 10,000 lifetime points.", lifetimePointsRequired: 10000 },
  ];
  await EngagementBadge.bulkWrite(defaults.map(b => ({ updateOne: { filter: { key: b.key }, update: { $setOnInsert: { ...b, active: true } }, upsert: true } })), { ordered: false });
  if (rule?.dailyCap) {
    const since = new Date(now); since.setHours(0, 0, 0, 0);
    const used = await EngagementEvent.aggregate([{ $match: { clientId: new mongoose.Types.ObjectId(input.clientId), eventType: input.eventType, createdAt: { $gte: since } } }, { $group: { _id: null, points: { $sum: "$points" } } }]);
    const remaining = rule.dailyCap - Number(used[0]?.points || 0);
    if (remaining <= 0) return { awarded: false, reason: "daily-cap" };
    points = Math.min(points, remaining);
  }
  if (rule?.campaignId) {
    const campaign = await EngagementCampaign.findOne({ _id: rule.campaignId, active: true, startsAt: { $lte: now }, endsAt: { $gte: now } }).lean();
    if (!campaign) return { awarded: false, reason: "campaign-inactive" };
    points = Math.floor(points * campaign.multiplier);
  }
  const session = await mongoose.startSession();
  try {
    let awarded = false;
    await session.withTransaction(async () => {
      const created = await EngagementEvent.create([{ clientId: input.clientId, eventKey: input.eventKey, eventType: input.eventType, points, metadata: input.metadata || {}, expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) }], { session });
      if (!created.length) return;
      const profile = await EngagementProfile.findOneAndUpdate({ clientId: input.clientId }, { $inc: { points, lifetimePoints: points }, $setOnInsert: { clientId: input.clientId } }, { upsert: true, new: true, setDefaultsOnInsert: true, session });
      profile.tier = tierForLifetimePoints(profile.lifetimePoints); await profile.save({ session });
      const badges = await EngagementBadge.find({ active: true, lifetimePointsRequired: { $lte: profile.lifetimePoints } }).session(session).lean();
      if (badges.length) await EngagementBadgeAward.bulkWrite(badges.map(b => ({ updateOne: { filter: { clientId: profile.clientId, badgeId: b._id }, update: { $setOnInsert: { clientId: profile.clientId, badgeId: b._id, awardedAt: now } }, upsert: true } })), { session, ordered: false });
      awarded = true;
    });
    return { awarded };
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) return { awarded: false, reason: "duplicate" };
    throw error;
  } finally { await session.endSession(); }
}
