import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IAIWorkspace extends Document {
  name: string; description: string; department: string; active: boolean; createdBy: string; createdAt: Date; updatedAt: Date;
}
const WorkspaceSchema = new Schema<IAIWorkspace>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: "", maxlength: 1000 },
  department: { type: String, default: "Operations", maxlength: 100 },
  active: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
}, { timestamps: true });
WorkspaceSchema.index({ department: 1, active: 1 });

export interface IAIMemory extends Document {
  title: string; content: string; scope: "shared" | "agent"; agentId?: Types.ObjectId; workspaceId?: Types.ObjectId;
  tags: string[]; source: string; active: boolean; expiresAt?: Date; createdBy: string; updatedAt: Date;
}
const MemorySchema = new Schema<IAIMemory>({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  content: { type: String, required: true, maxlength: 12000 },
  scope: { type: String, enum: ["shared", "agent"], default: "shared" },
  agentId: { type: Schema.Types.ObjectId, ref: "AIAgent" },
  workspaceId: { type: Schema.Types.ObjectId, ref: "AIWorkspace" },
  tags: { type: [String], default: [] },
  source: { type: String, default: "founder_knowledge", maxlength: 120 },
  active: { type: Boolean, default: true },
  expiresAt: Date,
  createdBy: { type: String, required: true },
}, { timestamps: true });
MemorySchema.index({ active: 1, workspaceId: 1, agentId: 1, updatedAt: -1 });
MemorySchema.index({ tags: 1, active: 1 });

export const AIWorkspace: Model<IAIWorkspace> = models.AIWorkspace || model<IAIWorkspace>("AIWorkspace", WorkspaceSchema);
export const AIMemory: Model<IAIMemory> = models.AIMemory || model<IAIMemory>("AIMemory", MemorySchema);
