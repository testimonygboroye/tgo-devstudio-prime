import { Schema, model, models, Document, Model } from "mongoose";

export interface IAIProvider extends Document {
  name: string;
  provider: "google" | "openai" | "anthropic" | "openai-compatible";
  baseUrl?: string;
  encryptedApiKey: string;
  enabled: boolean;
  createdBy: string;
  lastTestedAt?: Date;
  lastTestStatus?: "success" | "failed";
}
const AIProviderSchema = new Schema<IAIProvider>({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  provider: { type: String, enum: ["google", "openai", "anthropic", "openai-compatible"], required: true },
  baseUrl: { type: String, maxlength: 500 },
  encryptedApiKey: { type: String, required: true, select: false },
  enabled: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
  lastTestedAt: Date,
  lastTestStatus: { type: String, enum: ["success", "failed"] },
}, { timestamps: true });
AIProviderSchema.index({ name: 1 }, { unique: true });

export interface IAIAgent extends Document {
  name: string;
  role: string;
  department: string;
  description: string;
  providerId: Schema.Types.ObjectId;
  model: string;
  systemInstructions: string;
  permissions: string[];
  requiresApproval: boolean;
  enabled: boolean;
  createdBy: string;
}
const AIAgentSchema = new Schema<IAIAgent>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  role: { type: String, required: true, maxlength: 100 },
  department: { type: String, required: true, maxlength: 100 },
  description: { type: String, default: "", maxlength: 1000 },
  providerId: { type: Schema.Types.ObjectId, ref: "AIProvider", required: true },
  model: { type: String, required: true, maxlength: 120 },
  systemInstructions: { type: String, required: true, maxlength: 12000 },
  permissions: { type: [String], default: [] },
  requiresApproval: { type: Boolean, default: true },
  enabled: { type: Boolean, default: false },
  createdBy: { type: String, required: true },
}, { timestamps: true });
AIAgentSchema.index({ department: 1, enabled: 1 });

export interface AITask extends Document {
  agentId: Schema.Types.ObjectId;
  title: string;
  input: string;
  status: "queued" | "awaiting_approval" | "running" | "completed" | "failed" | "cancelled";
  requestedBy: string;
  result?: string;
  error?: string;
  approvedBy?: string;
  startedAt?: Date;
  completedAt?: Date;
}
const AITaskSchema = new Schema<AITask>({
  agentId: { type: Schema.Types.ObjectId, ref: "AIAgent", required: true },
  title: { type: String, required: true, maxlength: 180 },
  input: { type: String, required: true, maxlength: 20000 },
  status: { type: String, enum: ["queued", "awaiting_approval", "running", "completed", "failed", "cancelled"], default: "queued" },
  requestedBy: { type: String, required: true },
  result: { type: String, maxlength: 50000 },
  error: { type: String, maxlength: 2000 },
  approvedBy: String,
  startedAt: Date,
  completedAt: Date,
}, { timestamps: true });
AITaskSchema.index({ status: 1, createdAt: 1 });
AITaskSchema.index({ agentId: 1, createdAt: -1 });

const AIProvider: Model<IAIProvider> = models.AIProvider || model<IAIProvider>("AIProvider", AIProviderSchema);
const AIAgent: Model<IAIAgent> = models.AIAgent || model<IAIAgent>("AIAgent", AIAgentSchema);
const AITask: Model<AITask> = models.AITask || model<AITask>("AITask", AITaskSchema);
export { AIProvider, AIAgent, AITask };
