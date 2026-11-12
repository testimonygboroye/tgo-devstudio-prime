import { Schema, model, models, Document, Model, Types } from "mongoose";

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
  workspaceId?: Types.ObjectId;
  assignedUserId?: Types.ObjectId;
  description: string;
  providerId: Types.ObjectId;
  modelName: string;
  systemInstructions: string;
  permissions: string[];
  requiresApproval: boolean;
  maxDailyTokens: number;
  enabled: boolean;
  createdBy: string;
}
const AIAgentSchema = new Schema<IAIAgent>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  role: { type: String, required: true, maxlength: 100 },
  department: { type: String, required: true, maxlength: 100 },
  workspaceId: { type: Schema.Types.ObjectId, ref: "AIWorkspace" },
  assignedUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  description: { type: String, default: "", maxlength: 1000 },
  providerId: { type: Schema.Types.ObjectId, ref: "AIProvider", required: true },
  modelName: { type: String, required: true, maxlength: 120 },
  systemInstructions: { type: String, required: true, maxlength: 12000 },
  permissions: { type: [String], default: [] },
  requiresApproval: { type: Boolean, default: true },
  maxDailyTokens: { type: Number, default: 100000, min: 5000, max: 1000000 },
  enabled: { type: Boolean, default: false },
  createdBy: { type: String, required: true },
}, { timestamps: true });
AIAgentSchema.index({ department: 1, enabled: 1 });

export interface AITask extends Document {
  agentId: Types.ObjectId;
  parentTaskId?: Types.ObjectId;
  operation?: string;
  operationPayload?: Record<string, unknown>;
  operationResult?: Record<string, unknown>;
  title: string;
  input: string;
  status: "queued" | "awaiting_approval" | "running" | "completed" | "failed" | "cancelled";
  requestedBy: string;
  result?: string;
  error?: string;
  approvedBy?: string;
  startedAt?: Date;
  completedAt?: Date;
  executionAttempts: number;
  inputTokens: number;
  outputTokens: number;
  providerRequestId?: string;
  handedOverAt?: Date;
  handedOverBy?: string;
  handoverNote?: string;
}
const AITaskSchema = new Schema<AITask>({
  agentId: { type: Schema.Types.ObjectId, ref: "AIAgent", required: true },
  parentTaskId: { type: Schema.Types.ObjectId, ref: "AITask" },
  operation: { type: String, maxlength: 80 },
  operationPayload: { type: Schema.Types.Mixed },
  operationResult: { type: Schema.Types.Mixed },
  title: { type: String, required: true, maxlength: 180 },
  input: { type: String, required: true, maxlength: 20000 },
  status: { type: String, enum: ["queued", "awaiting_approval", "running", "completed", "failed", "cancelled"], default: "queued" },
  requestedBy: { type: String, required: true },
  result: { type: String, maxlength: 50000 },
  error: { type: String, maxlength: 2000 },
  approvedBy: String,
  startedAt: Date,
  completedAt: Date,
  executionAttempts: { type: Number, default: 0, min: 0, max: 20 },
  inputTokens: { type: Number, default: 0, min: 0 },
  outputTokens: { type: Number, default: 0, min: 0 },
  providerRequestId: { type: String, maxlength: 200 },
  handedOverAt: Date,
  handedOverBy: String,
  handoverNote: { type: String, maxlength: 2000 },
}, { timestamps: true });
AITaskSchema.index({ status: 1, createdAt: 1 });
AITaskSchema.index({ agentId: 1, createdAt: -1 });

const AIProvider: Model<IAIProvider> = models.AIProvider || model<IAIProvider>("AIProvider", AIProviderSchema);
const AIAgent: Model<IAIAgent> = models.AIAgent || model<IAIAgent>("AIAgent", AIAgentSchema);
const AITask: Model<AITask> = models.AITask || model<AITask>("AITask", AITaskSchema);
export { AIProvider, AIAgent, AITask };
