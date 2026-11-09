import { Schema, model, models, type Document, type Model } from "mongoose";

export type AnalyticsEventName =
  | "contact_form_submitted"
  | "whatsapp_click"
  | "email_click"
  | "book_call_click"
  | "calendly_event_scheduled"
  | "contact_cta_click"
  | "portfolio_click"
  | "service_click"
  | "newsletter_signup_click"
  | "cta_click";

export interface IAnalyticsEvent extends Document {
  eventId: string;
  eventName: AnalyticsEventName;
  visitorId?: string;
  sessionId?: string;
  path: string;
  target?: string;
  placement?: string;
  itemType?: string;
  itemSlug?: string;
  isInternal: boolean;
  createdAt: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventName: { type: String, required: true, index: true },
    visitorId: { type: String, index: true },
    sessionId: { type: String, index: true },
    path: { type: String, required: true, index: true },
    target: { type: String, maxlength: 500 },
    placement: { type: String, maxlength: 80 },
    itemType: { type: String, maxlength: 80 },
    itemSlug: { type: String, maxlength: 160 },
    isInternal: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AnalyticsEventSchema.index({ createdAt: -1, isInternal: 1 });
AnalyticsEventSchema.index({ eventName: 1, createdAt: -1, isInternal: 1 });

const AnalyticsEvent: Model<IAnalyticsEvent> =
  models.AnalyticsEvent || model<IAnalyticsEvent>("AnalyticsEvent", AnalyticsEventSchema);

export default AnalyticsEvent;
