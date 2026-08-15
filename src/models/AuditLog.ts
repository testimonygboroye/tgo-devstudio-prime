import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface IAuditLog extends Document {
  actor: Types.ObjectId;
  actorName: string;
  method: string;
  path: string;
  action: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    action: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });

const AuditLog: Model<IAuditLog> = models.AuditLog || model<IAuditLog>("AuditLog", AuditLogSchema);
export default AuditLog;
