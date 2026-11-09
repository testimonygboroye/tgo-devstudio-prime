import { Schema, model, models, Document, Model } from "mongoose";

export interface IPlatformAuditEvent extends Document {
  actorType: "human" | "ai" | "system";
  actorId: string;
  actorLabel?: string;
  action: string;
  module: string;
  targetType?: string;
  targetId?: string;
  outcome: "success" | "denied" | "failure";
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const PlatformAuditEventSchema = new Schema<IPlatformAuditEvent>(
  {
    actorType: { type: String, enum: ["human", "ai", "system"], required: true },
    actorId: { type: String, required: true, maxlength: 160 },
    actorLabel: { type: String, maxlength: 160 },
    action: { type: String, required: true, maxlength: 160 },
    module: { type: String, required: true, maxlength: 100 },
    targetType: { type: String, maxlength: 100 },
    targetId: { type: String, maxlength: 160 },
    outcome: { type: String, enum: ["success", "denied", "failure"], required: true },
    correlationId: { type: String, maxlength: 160 },
    ipAddress: { type: String, maxlength: 64 },
    userAgent: { type: String, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

PlatformAuditEventSchema.index({ createdAt: -1 });
PlatformAuditEventSchema.index({ actorType: 1, actorId: 1, createdAt: -1 });
PlatformAuditEventSchema.index({ module: 1, action: 1, createdAt: -1 });
PlatformAuditEventSchema.index({ correlationId: 1 }, { sparse: true });

const PlatformAuditEvent: Model<IPlatformAuditEvent> =
  models.PlatformAuditEvent ||
  model<IPlatformAuditEvent>("PlatformAuditEvent", PlatformAuditEventSchema);

export default PlatformAuditEvent;
