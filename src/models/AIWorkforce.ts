import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface IAIProvider extends Document {
  name: string;
  provider: "google" | "openai" | "anthropic" | "openai-compatible";
  baseUrl?: string;
  encryptedApiKey: string;
  enabled: boolean;
  createdBy: string;
  lastTestedAt?: Date;
  lastTestedModel?: string;
  apiKeyFingerprint?: string;
  lastTestStatus?: "success" | "failed";
  archivedAt?: Date;
  disabledAt?: Date;
}
const AIProviderSchema = new Schema<IAIProvider>({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  provider: { type: String, enum: ["google", "openai", "anthropic", "openai-compatible"], required: true },
  baseUrl: { type: String, maxlength: 500 },
  encryptedApiKey: { type: String, required: true, select: false },
  enabled: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
  lastTestedAt: Date,
  lastTestedModel: { type: String, maxlength: 120 },
  apiKeyFingerprint: { type: String, select: false, maxlength: 64 },
  lastTestStatus: { type: String, enum: ["success", "failed"] },
  archivedAt: { type: Date, default: undefined, index: true },
  disabledAt: { type: Date, default: undefined, index: true },
}, { timestamps: true });
AIProviderSchema.index({ name: 1 }, { unique: true });
// Atomic cross-provider duplicate-key protection. Archived providers release their key.
AIProviderSchema.index({ apiKeyFingerprint: 1 }, { unique: true, partialFilterExpression: { apiKeyFingerprint: { $type: "string" }, archivedAt: { $exists: false } } });

export interface IAIAgent extends Document {
  name: string;
  role: string;
  department: string;
  workspaceId?: Types.ObjectId;
  memoryKey?: string;
  positionId?: Types.ObjectId;
  assignedUserId?: Types.ObjectId;
  description: string;
  providerId?: Types.ObjectId;
  modelName: string;
  systemInstructions: string;
  permissions: string[];
  requiresApproval: boolean;
  maxDailyTokens: number;
  enabled: boolean;
  disabledAt?: Date;
  createdBy: string;
  jobDescription?: string;
  responsibilities?: string[];
  reportingToRole?: string;
  operationalTools?: string[];
  approvalPolicy?: { defaultRequired: boolean; sensitiveActions: string[]; autonomousActions: string[] };
  memorySettings?: { enabled: boolean; scope: "role" | "private" | "shared"; retentionDays?: number; writeRequiresApproval: boolean };
  performanceTargets?: { metric: string; target: string; reviewCadence: "daily" | "weekly" | "monthly" }[];
  operatingStatus?: "draft" | "ready" | "paused" | "needs_review";
  lastReadinessCheckAt?: Date;
}
const AIAgentSchema = new Schema<IAIAgent>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  role: { type: String, required: true, maxlength: 100 },
  department: { type: String, required: true, maxlength: 100 },
  workspaceId: { type: Schema.Types.ObjectId, ref: "AIWorkspace" },
  memoryKey: { type: String, maxlength: 300, index: true },
  positionId: { type: Schema.Types.ObjectId, ref: "Position", index: true },
  assignedUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  description: { type: String, default: "", maxlength: 1000 },
  // Legacy display hint only. Agents are not bound to a provider; runtime routes across all healthy TGO providers.
  providerId: { type: Schema.Types.ObjectId, ref: "AIProvider", required: false, index: true },
  modelName: { type: String, default: "", maxlength: 120 },
  systemInstructions: { type: String, required: true, maxlength: 12000 },
  permissions: { type: [String], default: [] },
  requiresApproval: { type: Boolean, default: true },
  maxDailyTokens: { type: Number, default: 100000, min: 5000, max: 1000000 },
  enabled: { type: Boolean, default: false },
  disabledAt: { type: Date, default: undefined, index: true },
  createdBy: { type: String, required: true },
  jobDescription: { type: String, default: "", maxlength: 5000 },
  responsibilities: { type: [String], default: [] },
  reportingToRole: { type: String, default: "Founder", maxlength: 120 },
  operationalTools: { type: [String], default: [] },
  approvalPolicy: { type: new Schema({ defaultRequired: { type: Boolean, default: true }, sensitiveActions: { type: [String], default: ["finance.payment", "finance.refund", "production.deploy", "access.permissions.change", "external.message.send"] }, autonomousActions: { type: [String], default: [] } }, { _id: false }), default: () => ({}) },
  memorySettings: { type: new Schema({ enabled: { type: Boolean, default: true }, scope: { type: String, enum: ["role", "private", "shared"], default: "role" }, retentionDays: { type: Number, min: 1 }, writeRequiresApproval: { type: Boolean, default: true } }, { _id: false }), default: () => ({}) },
  performanceTargets: { type: [new Schema({ metric: { type: String, required: true }, target: { type: String, required: true }, reviewCadence: { type: String, enum: ["daily", "weekly", "monthly"], default: "weekly" } }, { _id: false })], default: [] },
  operatingStatus: { type: String, enum: ["draft", "ready", "paused", "needs_review"], default: "draft", index: true },
  lastReadinessCheckAt: Date,
}, { timestamps: true });
AIAgentSchema.index({ department: 1, enabled: 1 });

export interface AITask extends Document {
  agentId: Types.ObjectId;
  agentMemoryKey?: string;
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
  agentMemoryKey: { type: String, maxlength: 300, index: true },
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
