import { Schema, model, models, type Model, type Document } from "mongoose";

export interface ILaunchSettings extends Document {
  enabled: boolean;
  launchDate?: Date;
  title: string;
  description: string;
  videoUrl: string;
  flyerUrl: string;
  afterLaunchVideoUrl: string;
  afterLaunchFlyerUrl: string;
  videoSeconds: number;
  flyerSeconds: number;
  updatedAt: Date;
}

const LaunchSettingsSchema = new Schema<ILaunchSettings>({
  enabled: { type: Boolean, default: false },
  launchDate: { type: Date },
  title: { type: String, default: "Something exceptional is launching", maxlength: 140 },
  description: { type: String, default: "A new chapter in intelligent digital experiences is almost here.", maxlength: 400 },
  videoUrl: { type: String, default: "" },
  flyerUrl: { type: String, default: "" },
  afterLaunchVideoUrl: { type: String, default: "" },
  afterLaunchFlyerUrl: { type: String, default: "" },
  videoSeconds: { type: Number, default: 8, min: 1, max: 60 },
  flyerSeconds: { type: Number, default: 8, min: 1, max: 60 },
}, { timestamps: true });

const LaunchSettings: Model<ILaunchSettings> = models.LaunchSettings || model<ILaunchSettings>("LaunchSettings", LaunchSettingsSchema);
export default LaunchSettings;
