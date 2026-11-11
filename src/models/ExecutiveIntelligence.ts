import { Schema, model, models, type Document, type Model, Types } from "mongoose";

export type ExecutiveRecommendationStatus = "proposed" | "approved" | "rejected" | "implemented";
export interface IExecutiveRecommendation extends Document {
  fingerprint: string; title: string; summary: string; rationale: string; priority: "low" | "medium" | "high" | "critical";
  domain: string; status: ExecutiveRecommendationStatus; actionType: "create_follow_up" | "review_only";
  actionPayload: Record<string, unknown>; operationId?: Types.ObjectId; createdBy: string; reviewedBy?: string; reviewedAt?: Date;
  createdAt: Date; updatedAt: Date;
}
const RecommendationSchema = new Schema<IExecutiveRecommendation>({
  fingerprint: { type: String, required: true, unique: true, maxlength: 180 },
  title: { type: String, required: true, maxlength: 180 }, summary: { type: String, required: true, maxlength: 1200 },
  rationale: { type: String, required: true, maxlength: 2000 }, priority: { type: String, enum: ["low","medium","high","critical"], default: "medium" },
  domain: { type: String, required: true, maxlength: 80 }, status: { type: String, enum: ["proposed","approved","rejected","implemented"], default: "proposed", index: true },
  actionType: { type: String, enum: ["create_follow_up","review_only"], default: "review_only" },
  actionPayload: { type: Schema.Types.Mixed, default: {} }, operationId: { type: Schema.Types.ObjectId, ref: "BusinessOperation" },
  createdBy: { type: String, required: true }, reviewedBy: String, reviewedAt: Date,
}, { timestamps: true });
RecommendationSchema.index({ status: 1, priority: -1, createdAt: -1 });

export interface IExecutiveDecision extends Document {
  title: string; decision: string; rationale: string; ownerId?: Types.ObjectId; dueAt?: Date;
  status: "open" | "in_progress" | "completed" | "cancelled"; outcome?: string; createdBy: string; updatedBy: string;
  completedAt?: Date; createdAt: Date; updatedAt: Date;
}
const DecisionSchema = new Schema<IExecutiveDecision>({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  decision: { type: String, required: true, trim: true, maxlength: 5000 },
  rationale: { type: String, default: "", maxlength: 3000 },
  ownerId: { type: Schema.Types.ObjectId, ref: "User" }, dueAt: Date,
  status: { type: String, enum: ["open","in_progress","completed","cancelled"], default: "open", index: true },
  outcome: { type: String, default: "", maxlength: 3000 }, createdBy: { type: String, required: true }, updatedBy: { type: String, required: true }, completedAt: Date,
}, { timestamps: true });
DecisionSchema.index({ status: 1, dueAt: 1 });

export interface IExecutiveReportSchedule extends Document {
  name: string; frequency: "daily" | "weekly" | "monthly"; active: boolean; createdBy: string;
  lastRunAt?: Date; nextRunAt: Date; createdAt: Date; updatedAt: Date;
}
const ScheduleSchema = new Schema<IExecutiveReportSchedule>({
  name: { type: String, required: true, trim: true, maxlength: 140 },
  frequency: { type: String, enum: ["daily","weekly","monthly"], required: true },
  active: { type: Boolean, default: true, index: true }, createdBy: { type: String, required: true },
  lastRunAt: Date, nextRunAt: { type: Date, required: true, index: true },
}, { timestamps: true });
ScheduleSchema.index({ active: 1, nextRunAt: 1 });

export interface IExecutiveReportRun extends Document {
  scheduleId?: Types.ObjectId; name: string; periodStart: Date; periodEnd: Date;
  snapshot: Record<string, unknown>; generatedBy: "schedule" | "founder"; createdBy: string; createdAt: Date;
}
const RunSchema = new Schema<IExecutiveReportRun>({
  scheduleId: { type: Schema.Types.ObjectId, ref: "ExecutiveReportSchedule" },
  name: { type: String, required: true, maxlength: 140 }, periodStart: { type: Date, required: true }, periodEnd: { type: Date, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true }, generatedBy: { type: String, enum: ["schedule","founder"], required: true }, createdBy: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
RunSchema.index({ scheduleId: 1, createdAt: -1 });

export const ExecutiveRecommendation: Model<IExecutiveRecommendation> = models.ExecutiveRecommendation || model<IExecutiveRecommendation>("ExecutiveRecommendation", RecommendationSchema);
export const ExecutiveDecision: Model<IExecutiveDecision> = models.ExecutiveDecision || model<IExecutiveDecision>("ExecutiveDecision", DecisionSchema);
export const ExecutiveReportSchedule: Model<IExecutiveReportSchedule> = models.ExecutiveReportSchedule || model<IExecutiveReportSchedule>("ExecutiveReportSchedule", ScheduleSchema);
export const ExecutiveReportRun: Model<IExecutiveReportRun> = models.ExecutiveReportRun || model<IExecutiveReportRun>("ExecutiveReportRun", RunSchema);
