import { Schema, model, models, Document, Types } from "mongoose";
import type { Model } from "mongoose";

export interface IHomeSettings extends Document {
  heroHeadline: string;
  heroSubheadline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  caseStudiesLabel: string;
  caseStudiesHeading: string;
  servicesLabel: string;
  servicesHeading: string;
  processLabel: string;
  processHeading: string;
  teamLabel: string;
  teamHeading: string;
  testimonialsLabel: string;
  testimonialsHeading: string;
  blogLabel: string;
  blogHeading: string;
  careersLabel: string;
  careersHeading: string;
  careersNoRolesMessage: string;
  finalCtaHeading: string;
  finalCtaDescription: string;
  finalCtaButtonLabel: string;
  statOneValue: string;
  statOneLabel: string;
  statTwoValue: string;
  statTwoLabel: string;
  statThreeValue: string;
  statThreeLabel: string;
  lastUpdatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HomeSettingsSchema = new Schema<IHomeSettings>(
  {
    heroHeadline: { type: String, required: true, trim: true, maxlength: 150 },
    heroSubheadline: { type: String, required: true, trim: true, maxlength: 300 },
    primaryCtaLabel: { type: String, required: true, trim: true, maxlength: 50 },
    primaryCtaHref: { type: String, required: true, trim: true },
    secondaryCtaLabel: { type: String, required: true, trim: true, maxlength: 50 },
    secondaryCtaHref: { type: String, required: true, trim: true },
    caseStudiesLabel: { type: String, default: "Selected Work", maxlength: 50 },
    caseStudiesHeading: { type: String, default: "Featured Case Studies", maxlength: 100 },
    servicesLabel: { type: String, default: "Capabilities", maxlength: 50 },
    servicesHeading: { type: String, default: "What We Do", maxlength: 100 },
    processLabel: { type: String, default: "Approach", maxlength: 50 },
    processHeading: { type: String, default: "How We Work", maxlength: 100 },
    teamLabel: { type: String, default: "People", maxlength: 50 },
    teamHeading: { type: String, default: "The Team", maxlength: 100 },
    testimonialsLabel: { type: String, default: "Testimonials", maxlength: 50 },
    testimonialsHeading: { type: String, default: "What People Say", maxlength: 100 },
    blogLabel: { type: String, default: "Insights", maxlength: 50 },
    blogHeading: { type: String, default: "From the Blog", maxlength: 100 },
    careersLabel: { type: String, default: "Careers", maxlength: 50 },
    careersHeading: { type: String, default: "We're Building Something Worth Joining", maxlength: 150 },
    careersNoRolesMessage: {
      type: String,
      default: "No open roles right now — but we're always building our culture and team.",
      maxlength: 200,
    },
    finalCtaHeading: { type: String, default: "Ready to Build Something Real?", maxlength: 150 },
    finalCtaDescription: {
      type: String,
      default: "Let's talk about what you're building and how TGO DevStudio can help bring it to life.",
      maxlength: 300,
    },
    finalCtaButtonLabel: { type: String, default: "Start a Conversation", maxlength: 50 },
    statOneValue: { type: String, default: "1+", maxlength: 20 },
    statOneLabel: { type: String, default: "Years Active", maxlength: 50 },
    statTwoValue: { type: String, default: "5+", maxlength: 20 },
    statTwoLabel: { type: String, default: "Projects Shipped", maxlength: 50 },
    statThreeValue: { type: String, default: "10+", maxlength: 20 },
    statThreeLabel: { type: String, default: "Technologies Mastered", maxlength: 50 },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const HomeSettings: Model<IHomeSettings> =
  models.HomeSettings || model<IHomeSettings>("HomeSettings", HomeSettingsSchema);

export default HomeSettings;
