import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface IMarketBenchmark {
  low: number;
  high: number;
  typical: number;
  currency: string;
  checkedAt?: Date;
  methodology?: string;
  sources: Array<{ label: string; url: string; note?: string }>;
}
export interface IServicePackage {
  key: string;
  name: string;
  summary: string;
  price: number;
  currency: string;
  billingModel: "fixed" | "hourly" | "monthly" | "custom";
  deliveryDays: number;
  revisions: number;
  features: string[];
  deliverables: string[];
  exclusions: string[];
  addOns: Array<{ key: string; name: string; description: string; price: number; currency: string; optional: boolean }>;
  originalPrice?: number;
  promotionPrice?: number;
  promotionStartsAt?: Date;
  promotionEndsAt?: Date;
  promotionDescription?: string;
  enabled: boolean;
}
export interface ICommercialService extends Document {
  name: string;
  slug: string;
  family: string;
  familySlug: string;
  category: string;
  categorySlug: string;
  summary: string;
  description: string;
  problemSolved: string;
  useCases: string[];
  targetCustomers: string[];
  scope: string[];
  technologies: string[];
  process: string[];
  deliverables: string[];
  exclusions: string[];
  estimatedTimeline: string;
  marketBenchmark: IMarketBenchmark;
  status: "draft" | "published" | "archived";
  pricingModel: "fixed" | "from" | "custom";
  currency: string;
  packages: IServicePackage[];
  customRequestEnabled: boolean;
  consultationEnabled: boolean;
  deliveryTemplate?: string;
  version: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
const SourceSchema = new Schema({ label: { type: String, required: true, maxlength: 160 }, url: { type: String, required: true, maxlength: 1000 }, note: { type: String, default: "", maxlength: 500 } }, { _id: false });
const BenchmarkSchema = new Schema<IMarketBenchmark>({
  low: { type: Number, min: 0, default: 0 },
  high: { type: Number, min: 0, default: 0 },
  typical: { type: Number, min: 0, default: 0 },
  currency: { type: String, default: "NGN", uppercase: true },
  checkedAt: Date,
  methodology: { type: String, default: "", maxlength: 2000 },
  sources: { type: [SourceSchema], default: [] },
}, { _id: false });
const AddOnSchema = new Schema({
  key: { type: String, required: true, trim: true, maxlength: 80 },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", maxlength: 1000 },
  price: { type: Number, min: 0, required: true },
  currency: { type: String, default: "NGN", uppercase: true },
  optional: { type: Boolean, default: true },
}, { _id: false });
const PackageSchema = new Schema<IServicePackage>({
  key: { type: String, required: true, trim: true, maxlength: 100 },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  summary: { type: String, default: "", maxlength: 500 },
  price: { type: Number, min: 0, default: 0 },
  currency: { type: String, default: "NGN", uppercase: true },
  billingModel: { type: String, enum: ["fixed", "hourly", "monthly", "custom"], default: "fixed" },
  deliveryDays: { type: Number, min: 0, default: 0 },
  revisions: { type: Number, min: 0, default: 0 },
  features: { type: [String], default: [] },
  deliverables: { type: [String], default: [] },
  exclusions: { type: [String], default: [] },
  addOns: { type: [AddOnSchema], default: [] },
  originalPrice: { type: Number, min: 0 },
  promotionPrice: { type: Number, min: 0 },
  promotionStartsAt: Date,
  promotionEndsAt: Date,
  promotionDescription: { type: String, default: "", maxlength: 500 },
  enabled: { type: Boolean, default: true },
}, { _id: false });
const D = new Schema<ICommercialService>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
  family: { type: String, default: "Software & Digital Product Engineering", trim: true, maxlength: 120 },
  familySlug: { type: String, default: "software-digital-product-engineering", lowercase: true, trim: true, maxlength: 160, index: true },
  category: { type: String, required: true, trim: true, maxlength: 120 },
  categorySlug: { type: String, default: "", lowercase: true, trim: true, maxlength: 160, index: true },
  summary: { type: String, required: true, trim: true, maxlength: 500 },
  description: { type: String, required: true, trim: true, maxlength: 20000 },
  problemSolved: { type: String, default: "", maxlength: 3000 },
  useCases: { type: [String], default: [] },
  targetCustomers: { type: [String], default: [] },
  scope: { type: [String], default: [] },
  technologies: { type: [String], default: [] },
  process: { type: [String], default: [] },
  deliverables: { type: [String], default: [] },
  exclusions: { type: [String], default: [] },
  estimatedTimeline: { type: String, default: "", maxlength: 160 },
  marketBenchmark: { type: BenchmarkSchema, default: () => ({ currency: "NGN", sources: [] }) },
  status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
  pricingModel: { type: String, enum: ["fixed", "from", "custom"], default: "custom" },
  currency: { type: String, default: "NGN", uppercase: true },
  packages: { type: [PackageSchema], default: [] },
  customRequestEnabled: { type: Boolean, default: true },
  consultationEnabled: { type: Boolean, default: true },
  deliveryTemplate: { type: String, maxlength: 120 },
  version: { type: Number, default: 1, min: 1 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
D.index({ status: 1, familySlug: 1, categorySlug: 1, name: 1 });
const M: Model<ICommercialService> = models.CommercialService || model<ICommercialService>("CommercialService", D);
export default M;
