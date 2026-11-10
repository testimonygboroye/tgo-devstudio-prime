import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IEngagementProfile extends Document {
  clientId: Types.ObjectId; points: number; lifetimePoints: number; tier: string;
  createdAt: Date; updatedAt: Date;
}
const ProfileSchema = new Schema<IEngagementProfile>({
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  points: { type: Number, default: 0, min: 0 }, lifetimePoints: { type: Number, default: 0, min: 0 },
  tier: { type: String, enum: ["starter", "silver", "gold", "platinum"], default: "starter" },
}, { timestamps: true });

export interface IReward extends Document {
  name: string; description: string; kind: "points" | "discount" | "account_credit";
  pointsCost: number; creditMinor: number; currency: string; discountPercent: number;
  active: boolean; stock: number; redeemed: number; createdAt: Date; updatedAt: Date;
}
const RewardSchema = new Schema<IReward>({
  name: { type: String, required: true, trim: true, maxlength: 100 }, description: { type: String, default: "", maxlength: 500 },
  kind: { type: String, enum: ["points", "discount", "account_credit"], required: true },
  pointsCost: { type: Number, required: true, min: 1 }, creditMinor: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: "NGN", uppercase: true }, discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  active: { type: Boolean, default: true }, stock: { type: Number, default: -1 }, redeemed: { type: Number, default: 0 },
}, { timestamps: true });

export interface IReferral extends Document {
  code: string; referrerId: Types.ObjectId; referredClientId?: Types.ObjectId; status: "pending" | "qualified" | "rejected";
  commissionMinor: number; currency: string; qualifiedAt?: Date; createdAt: Date;
}
const ReferralSchema = new Schema<IReferral>({
  code: { type: String, required: true, unique: true, uppercase: true }, referrerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  referredClientId: { type: Schema.Types.ObjectId, ref: "User", unique: true, sparse: true },
  status: { type: String, enum: ["pending", "qualified", "rejected"], default: "pending" },
  commissionMinor: { type: Number, default: 0, min: 0 }, currency: { type: String, default: "NGN" }, qualifiedAt: Date,
}, { timestamps: { createdAt: true, updatedAt: false } });

export interface IEngagementEarnRule extends Document { eventType: string; points: number; dailyCap: number; active: boolean; campaignId?: Types.ObjectId; createdAt: Date; updatedAt: Date; }
const EarnRuleSchema = new Schema<IEngagementEarnRule>({ eventType: { type: String, required: true, unique: true }, points: { type: Number, required: true, min: 0, max: 100000 }, dailyCap: { type: Number, default: 0, min: 0 }, active: { type: Boolean, default: true }, campaignId: { type: Schema.Types.ObjectId, ref: "EngagementCampaign" } }, { timestamps: true });
export interface IEngagementCampaign extends Document { name: string; startsAt: Date; endsAt: Date; multiplier: number; active: boolean; createdAt: Date; updatedAt: Date; }
const CampaignSchema = new Schema<IEngagementCampaign>({ name: { type: String, required: true, trim: true, maxlength: 100 }, startsAt: { type: Date, required: true }, endsAt: { type: Date, required: true }, multiplier: { type: Number, default: 1, min: 1, max: 5 }, active: { type: Boolean, default: false } }, { timestamps: true });

export interface IEngagementReferralRule extends Document { key: string; commissionPercent: number; minimumPurchaseMinor: number; referrerPoints: number; active: boolean; updatedAt: Date; }
const ReferralRuleSchema = new Schema<IEngagementReferralRule>({ key: { type: String, default: "default", unique: true }, commissionPercent: { type: Number, default: 5, min: 0, max: 50 }, minimumPurchaseMinor: { type: Number, default: 0, min: 0 }, referrerPoints: { type: Number, default: 300, min: 0, max: 10000 }, active: { type: Boolean, default: true } }, { timestamps: true });

export interface IEngagementCommission extends Document { referralId: Types.ObjectId; referrerId: Types.ObjectId; amountMinor: number; currency: string; status: "pending" | "approved" | "paid" | "rejected"; settlementReference?: string; approvedBy?: Types.ObjectId; paidAt?: Date; createdAt: Date; updatedAt: Date; }
const CommissionSchema = new Schema<IEngagementCommission>({ referralId: { type: Schema.Types.ObjectId, ref: "EngagementReferral", required: true, unique: true }, referrerId: { type: Schema.Types.ObjectId, ref: "User", required: true }, amountMinor: { type: Number, required: true, min: 0 }, currency: { type: String, required: true, uppercase: true }, status: { type: String, enum: ["pending", "approved", "paid", "rejected"], default: "pending" }, settlementReference: { type: String, unique: true, sparse: true }, approvedBy: { type: Schema.Types.ObjectId, ref: "User" }, paidAt: Date }, { timestamps: true });
export interface IEngagementFraudCase extends Document { clientId?: Types.ObjectId; referralId?: Types.ObjectId; reason: string; severity: "low" | "medium" | "high"; status: "open" | "reviewed" | "dismissed"; reviewedBy?: Types.ObjectId; createdAt: Date; updatedAt: Date; }
const FraudCaseSchema = new Schema<IEngagementFraudCase>({ clientId: { type: Schema.Types.ObjectId, ref: "User" }, referralId: { type: Schema.Types.ObjectId, ref: "EngagementReferral" }, reason: { type: String, required: true, maxlength: 500 }, severity: { type: String, enum: ["low", "medium", "high"], default: "medium" }, status: { type: String, enum: ["open", "reviewed", "dismissed"], default: "open" }, reviewedBy: { type: Schema.Types.ObjectId, ref: "User" } }, { timestamps: true });

export interface IEngagementBadge extends Document { key: string; name: string; description: string; lifetimePointsRequired: number; active: boolean; createdAt: Date; updatedAt: Date; }
const BadgeSchema = new Schema<IEngagementBadge>({ key: { type: String, required: true, unique: true, lowercase: true }, name: { type: String, required: true, trim: true, maxlength: 80 }, description: { type: String, default: "", maxlength: 300 }, lifetimePointsRequired: { type: Number, required: true, min: 1 }, active: { type: Boolean, default: true } }, { timestamps: true });
export interface IEngagementBadgeAward extends Document { clientId: Types.ObjectId; badgeId: Types.ObjectId; awardedAt: Date; }
const BadgeAwardSchema = new Schema<IEngagementBadgeAward>({ clientId: { type: Schema.Types.ObjectId, ref: "User", required: true }, badgeId: { type: Schema.Types.ObjectId, ref: "EngagementBadge", required: true }, awardedAt: { type: Date, default: Date.now } });
BadgeAwardSchema.index({ clientId: 1, badgeId: 1 }, { unique: true });

export interface IEngagementEvent extends Document {
  clientId: Types.ObjectId; eventKey: string; eventType: string; points: number; metadata: Record<string, unknown>; expiresAt?: Date; expiredAt?: Date; createdAt: Date;
}
const EventSchema = new Schema<IEngagementEvent>({
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, eventKey: { type: String, required: true },
  eventType: { type: String, required: true, maxlength: 80 }, points: { type: Number, default: 0, min: 0 }, metadata: { type: Schema.Types.Mixed, default: {} }, expiresAt: Date, expiredAt: Date,
}, { timestamps: { createdAt: true, updatedAt: false } });
EventSchema.index({ clientId: 1, eventKey: 1 }, { unique: true });

export interface IRedemption extends Document {
  clientId: Types.ObjectId; rewardId: Types.ObjectId; pointsSpent: number; status: "completed" | "rejected"; reference: string; couponCode?: string; createdAt: Date;
}
const RedemptionSchema = new Schema<IRedemption>({
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, rewardId: { type: Schema.Types.ObjectId, ref: "EngagementReward", required: true },
  pointsSpent: { type: Number, required: true, min: 1 }, status: { type: String, enum: ["completed", "rejected"], default: "completed" }, reference: { type: String, required: true, unique: true }, couponCode: { type: String, unique: true, sparse: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const EngagementProfile = (models.EngagementProfile || model<IEngagementProfile>("EngagementProfile", ProfileSchema)) as Model<IEngagementProfile>;
export const EngagementReward = (models.EngagementReward || model<IReward>("EngagementReward", RewardSchema)) as Model<IReward>;
export const EngagementReferral = (models.EngagementReferral || model<IReferral>("EngagementReferral", ReferralSchema)) as Model<IReferral>;
export const EngagementEvent = (models.EngagementEvent || model<IEngagementEvent>("EngagementEvent", EventSchema)) as Model<IEngagementEvent>;
export const EngagementRedemption = (models.EngagementRedemption || model<IRedemption>("EngagementRedemption", RedemptionSchema)) as Model<IRedemption>;
export const EngagementEarnRule = (models.EngagementEarnRule || model<IEngagementEarnRule>("EngagementEarnRule", EarnRuleSchema)) as Model<IEngagementEarnRule>;
export const EngagementCampaign = (models.EngagementCampaign || model<IEngagementCampaign>("EngagementCampaign", CampaignSchema)) as Model<IEngagementCampaign>;
export const EngagementCommission = (models.EngagementCommission || model<IEngagementCommission>("EngagementCommission", CommissionSchema)) as Model<IEngagementCommission>;
export const EngagementFraudCase = (models.EngagementFraudCase || model<IEngagementFraudCase>("EngagementFraudCase", FraudCaseSchema)) as Model<IEngagementFraudCase>;
export const EngagementBadge = (models.EngagementBadge || model<IEngagementBadge>("EngagementBadge", BadgeSchema)) as Model<IEngagementBadge>;
export const EngagementBadgeAward = (models.EngagementBadgeAward || model<IEngagementBadgeAward>("EngagementBadgeAward", BadgeAwardSchema)) as Model<IEngagementBadgeAward>;
export const EngagementReferralRule = (models.EngagementReferralRule || model<IEngagementReferralRule>("EngagementReferralRule", ReferralRuleSchema)) as Model<IEngagementReferralRule>;
