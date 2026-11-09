import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface IClientActivity extends Document {
  clientId: Types.ObjectId;
  actorId?: Types.ObjectId;
  actorType: "client" | "staff" | "system";
  action: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const ClientActivitySchema = new Schema<IClientActivity>({
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  actorId: { type: Schema.Types.ObjectId, ref: "User" },
  actorType: { type: String, enum: ["client", "staff", "system"], required: true },
  action: { type: String, required: true, maxlength: 100 },
  summary: { type: String, required: true, maxlength: 500 },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } });

ClientActivitySchema.index({ clientId: 1, createdAt: -1 });

const ClientActivity: Model<IClientActivity> = models.ClientActivity || model<IClientActivity>("ClientActivity", ClientActivitySchema);
export default ClientActivity;
