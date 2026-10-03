import {
  Schema,
  model,
  models,
  Document,
  Model,
} from "mongoose";

export interface IPageView extends Document {
  path: string;
  visitorId: string;
  sessionId?: string;
  userAgent: string;
  referrer?: string;

  host?: string;
  deploymentProvider?: string;

  language?: string;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;

  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  timezone?: string;

  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;

  createdAt: Date;
}

const PageViewSchema = new Schema<IPageView>(
  {
    path: {
      type: String,
      required: true,
      index: true,
    },

    visitorId: {
      type: String,
      required: true,
      index: true,
    },

    sessionId: {
      type: String,
      index: true,
    },

    userAgent: {
      type: String,
      required: true,
    },

    referrer: String,

    host: {
      type: String,
      index: true,
    },

    deploymentProvider: {
      type: String,
      index: true,
    },

    language: String,
    deviceType: String,
    browser: String,
    operatingSystem: String,

    country: {
      type: String,
      index: true,
    },

    countryCode: {
      type: String,
      index: true,
    },

    region: {
      type: String,
      index: true,
    },

    city: {
      type: String,
      index: true,
    },

    timezone: String,

    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmTerm: String,
    utmContent: String,
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

PageViewSchema.index({
  createdAt: -1,
});

PageViewSchema.index({
  visitorId: 1,
  createdAt: -1,
});

PageViewSchema.index({
  host: 1,
  createdAt: -1,
});

PageViewSchema.index({
  deploymentProvider: 1,
  createdAt: -1,
});

PageViewSchema.index({
  countryCode: 1,
  region: 1,
  city: 1,
});

const PageView: Model<IPageView> =
  models.PageView ||
  model<IPageView>("PageView", PageViewSchema);

export default PageView;
