import { Schema, model, models, Document, Model, Types } from "mongoose";

export type AIChatbotScope = "public" | "client" | "admin";
export interface IAIChatbotConfig extends Document {
  scope: AIChatbotScope;
  providerId: Types.ObjectId;
  modelName: string;
  fallbackProviderId?: Types.ObjectId;
  fallbackModelName?: string;
  enabled: boolean;
  welcomeMessage: string;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
const ConfigSchema = new Schema<IAIChatbotConfig>({
  scope: { type: String, enum: ["public","client","admin"], required: true, unique: true },
  providerId: { type: Schema.Types.ObjectId, ref: "AIProvider", required: true },
  modelName: { type: String, required: true, maxlength: 120 },
  fallbackProviderId: { type: Schema.Types.ObjectId, ref: "AIProvider" },
  fallbackModelName: { type: String, maxlength: 120 },
  enabled: { type: Boolean, default: false },
  welcomeMessage: { type: String, default: "Hello. How can I help?", maxlength: 300 },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export interface IAIChatMessage {
  messageId: string;
  role: "user" | "assistant";
  content: string;
  inputTokens: number;
  outputTokens: number;
  feedback?: "helpful" | "unhelpful";
  sources?: string[];
  createdAt: Date;
}
const MessageSchema = new Schema<IAIChatMessage>({
  messageId: { type: String, required: true, maxlength: 80 },
  role: { type: String, enum: ["user","assistant"], required: true },
  content: { type: String, required: true, maxlength: 8000 },
  inputTokens: { type: Number, default: 0, min: 0 },
  outputTokens: { type: Number, default: 0, min: 0 },
  feedback: { type: String, enum: ["helpful","unhelpful"] },
  sources: { type: [String], default: [], validate: [(v: string[]) => v.length <= 20, "Maximum 20 source references"] },
  createdAt: { type: Date, default: Date.now, required: true },
}, { _id: false });
export interface IAIChatSession extends Document {
  scope: AIChatbotScope;
  ownerId?: Types.ObjectId;
  publicTokenHash?: string;
  messages: IAIChatMessage[];
  dailyDate: string;
  dailyRequests: number;
  dailyTokens: number;
  createdAt: Date;
  updatedAt: Date;
}
const SessionSchema = new Schema<IAIChatSession>({
  scope: { type: String, enum: ["public","client","admin"], required: true, index: true },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  publicTokenHash: { type: String, select: false, index: true },
  messages: { type: [MessageSchema], default: [] },
  dailyDate: { type: String, default: "" },
  dailyRequests: { type: Number, default: 0, min: 0 },
  dailyTokens: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
SessionSchema.index({ scope: 1, ownerId: 1, updatedAt: -1 });
const AIChatbotConfig: Model<IAIChatbotConfig> = models.AIChatbotConfig || model<IAIChatbotConfig>("AIChatbotConfig", ConfigSchema);
const AIChatSession: Model<IAIChatSession> = models.AIChatSession || model<IAIChatSession>("AIChatSession", SessionSchema);
export { AIChatbotConfig, AIChatSession };
