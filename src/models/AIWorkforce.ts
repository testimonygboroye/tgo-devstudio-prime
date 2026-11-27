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
AIProviderSchema.index({ apiKeyFingerprint: 1 }, { unique: true, partialFilterExpression: { apiKeyFingerprint: { $type: "string" }, archivedAt: { $exists: false } } });

export interface IAIAgent extends Document {
  name: string;
  role: string;
  department: string;
  jobTitle?: string;
  workspaceId?: Types.ObjectId;
  memoryKey?: string;
  positionId?: Types.ObjectId;
  assignedUserId?: Types.ObjectId;
  reportsToAgentId?: Types.ObjectId;
  reportsToRole?: string;
  description: string;
  responsibilities: string[];
  deliverables: string[];
  providerId?: Types.ObjectId;
  modelName: string;
  fallbackModelNames: string[];
  systemInstructions: string;
  permissions: string[];
  toolAllowlist: string[];
  requiresApproval: boolean;
  approvalRequirements: string[];
  autonomyLevel: "draft_only" | "approved_tasks" | "bounded";
  memoryConfig: {
    enabled: boolean;
    identityKey: string;
    sharedMemoryScopes: string[];
    privateMemoryEnabled: boolean;
    retentionDays: number;
  };
  executionConfig: {
    maxConcurrentTasks: number;
    maxRetries: number;
    timeoutSeconds: number;
    maxDailyTokens: number;
    maxDailySpendNaira: number;
    scheduleEnabled: boolean;
  };
  performanceTargets: Array<{ metric: string; target: number; unit: string }>;
  operationalStatus: "not_configured" | "needs_review" | "ready" | "suspended";
  lastReadinessCheckAt?: Date;
  lastReadinessIssues: string[];
  requiresHumanReview: boolean;
  maxDailyTokens: number;
  enabled: boolean;
  disabledAt?: Date;
  createdBy: string;
}
const MemoryConfigSchema = new Schema({
  enabled: { type: Boolean, default: true },
  identityKey: { type: String, maxlength: 300 },
  sharedMemoryScopes: { type: [String], default: ["company-approved"] },
  privateMemoryEnabled: { type: Boolean, default: true },
  retentionDays: { type: Number, default: 365, min: 1, max: 3650 },
}, { _id: false });
const ExecutionConfigSchema = new Schema({
  maxConcurrentTasks: { type: Number, default: 1, min: 1, max: 10 },
  maxRetries: { type: Number, default: 2, min: 0, max: 10 },
  timeoutSeconds: { type: Number, default: 120, min: 10, max: 900 },
  maxDailyTokens: { type: Number, default: 100000, min: 5000, max: 1000000 },
  maxDailySpendNaira: { type: Number, default: 0, min: 0 },
  scheduleEnabled: { type: Boolean, default: false },
}, { _id: false });
const PerformanceTargetSchema = new Schema({
  metric: { type: String, required: true, maxlength: 80 },
  target: { type: Number, required: true },
  unit: { type: String, required: true, maxlength: 40 },
}, { _id: false });
const AIAgentSchema = new Schema<IAIAgent>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  role: { type: String, required: true, maxlength: 100 },
  department: { type: String, required: true, maxlength: 100 },
  jobTitle: { type: String, trim: true, maxlength: 120 },
  workspaceId: { type: Schema.Types.ObjectId, ref: "AIWorkspace" },
  memoryKey: { type: String, maxlength: 300, index: true },
  positionId: { type: Schema.Types.ObjectId, ref: "Position", index: true },
  assignedUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  reportsToAgentId: { type: Schema.Types.ObjectId, ref: "AIAgent", index: true },
  reportsToRole: { type: String, maxlength: 120 },
  description: { type: String, default: "", maxlength: 2000 },
  responsibilities: { type: [String], default: [] },
  deliverables: { type: [String], default: [] },
  providerId: { type: Schema.Types.ObjectId, ref: "AIProvider", required: false, index: true },
  modelName: { type: String, default: "", maxlength: 120 },
  fallbackModelNames: { type: [String], default: [] },
  systemInstructions: { type: String, required: true, maxlength: 20000 },
  permissions: { type: [String], default: [] },
  toolAllowlist: { type: [String], default: [] },
  requiresApproval: { type: Boolean, default: true },
  approvalRequirements: { type: [String], default: ["external_communications", "financial_actions", "production_changes", "permission_changes", "legal_or_hr_decisions"] },
  autonomyLevel: { type: String, enum: ["draft_only", "approved_tasks", "bounded"], default: "draft_only" },
  memoryConfig: { type: MemoryConfigSchema, default: () => ({}) },
  executionConfig: { type: ExecutionConfigSchema, default: () => ({}) },
  performanceTargets: { type: [PerformanceTargetSchema], default: [] },
  operationalStatus: { type: String, enum: ["not_configured", "needs_review", "ready", "suspended"], default: "not_configured", index: true },
  lastReadinessCheckAt: Date,
  lastReadinessIssues: { type: [String], default: [] },
  requiresHumanReview: { type: Boolean, default: true },
  maxDailyTokens: { type: Number, default: 100000, min: 5000, max: 1000000 },
  enabled: { type: Boolean, default: false },
  disabledAt: { type: Date, default: undefined, index: true },
  createdBy: { type: String, required: true },
}, { timestamps: true });
AIAgentSchema.index({ department: 1, enabled: 1 });
AIAgentSchema.index({ operationalStatus: 1, department: 1 });

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
