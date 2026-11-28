import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export interface IAIAutomationSchedule extends Document {
  agentId: Types.ObjectId;
  createdBy: string;
  title: string;
  prompt: string;
  intervalMinutes: number;
  enabled: boolean;
  nextRunAt: Date;
  lastRunAt?: Date;
  lastTaskId?: Types.ObjectId;
  lastError?: string;
}

const AIAutomationScheduleSchema = new Schema<IAIAutomationSchedule>({
  agentId: { type: Schema.Types.ObjectId, ref: "AIAgent", required: true, unique: true, index: true },
  createdBy: { type: String, required: true, maxlength: 100 },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  prompt: { type: String, required: true, trim: true, maxlength: 12000 },
  intervalMinutes: { type: Number, required: true, min: 15, max: 10080, default: 1440 },
  enabled: { type: Boolean, default: true, index: true },
  nextRunAt: { type: Date, required: true, index: true },
  lastRunAt: Date,
  lastTaskId: { type: Schema.Types.ObjectId, ref: "AITask" },
  lastError: { type: String, maxlength: 2000 },
}, { timestamps: true });

AIAutomationScheduleSchema.index({ enabled: 1, nextRunAt: 1 });
const AIAutomationSchedule: Model<IAIAutomationSchedule> =
  models.AIAutomationSchedule || model<IAIAutomationSchedule>("AIAutomationSchedule", AIAutomationScheduleSchema);
export default AIAutomationSchedule;
