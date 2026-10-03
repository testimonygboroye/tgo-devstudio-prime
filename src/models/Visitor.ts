import {
  Schema,
  model,
  models,
  Document,
  Model,
} from "mongoose";

export type VisitorStatus =
  | "new"
  | "returning"
  | "active"
  | "highly-active"
  | "constant"
  | "dormant";

export interface IVisitor extends Document {
  visitorId: string;

  displayName?: string;
  email?: string;
  gender?: string;

  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  timezone?: string;

  preciseLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    capturedAt: Date;
  };

  deviceType?: string;
  deviceModel?: string;
  browser?: string;
  browserVersion?: string;
  operatingSystem?: string;
  operatingSystemVersion?: string;

  language?: string;
  languages?: string[];

  screenWidth?: number;
  screenHeight?: number;
  viewportWidth?: number;
  viewportHeight?: number;

  isStandalonePwa?: boolean;
  cookiesEnabled?: boolean;

  firstReferrer?: string;
  latestReferrer?: string;
  firstPath?: string;
  latestPath?: string;

  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;

  deploymentHost?: string;
  deploymentProvider?: string;

  firstSeen: Date;
  lastSeen: Date;

  totalPageViews: number;
  totalSessions: number;
  activeDays: number;

  status: VisitorStatus;

  createdAt: Date;
  updatedAt: Date;
}

const VisitorSchema = new Schema<IVisitor>(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    displayName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    gender: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      trim: true,
      index: true,
    },

    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },

    region: {
      type: String,
      trim: true,
      index: true,
    },

    city: {
      type: String,
      trim: true,
      index: true,
    },

    postalCode: {
      type: String,
      trim: true,
      index: true,
    },

    timezone: {
      type: String,
      trim: true,
    },

    preciseLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      capturedAt: Date,
    },

    deviceType: {
      type: String,
      index: true,
    },

    deviceModel: String,

    browser: {
      type: String,
      index: true,
    },

    browserVersion: String,

    operatingSystem: {
      type: String,
      index: true,
    },

    operatingSystemVersion: String,

    language: String,
    languages: [String],

    screenWidth: Number,
    screenHeight: Number,
    viewportWidth: Number,
    viewportHeight: Number,

    isStandalonePwa: Boolean,
    cookiesEnabled: Boolean,

    firstReferrer: String,
    latestReferrer: String,
    firstPath: String,
    latestPath: String,

    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmTerm: String,
    utmContent: String,

    deploymentHost: {
      type: String,
      index: true,
    },

    deploymentProvider: {
      type: String,
      index: true,
    },

    firstSeen: {
      type: Date,
      required: true,
      index: true,
    },

    lastSeen: {
      type: Date,
      required: true,
      index: true,
    },

    totalPageViews: {
      type: Number,
      default: 0,
    },

    totalSessions: {
      type: Number,
      default: 0,
    },

    activeDays: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "new",
        "returning",
        "active",
        "highly-active",
        "constant",
        "dormant",
      ],
      default: "new",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

VisitorSchema.index({ totalPageViews: -1 });
VisitorSchema.index({ lastSeen: -1 });
VisitorSchema.index({ activeDays: -1 });
VisitorSchema.index({
  status: 1,
  lastSeen: -1,
});
VisitorSchema.index({
  countryCode: 1,
  region: 1,
  city: 1,
});
VisitorSchema.index({
  deploymentProvider: 1,
  deploymentHost: 1,
});

const Visitor: Model<IVisitor> =
  models.Visitor ||
  model<IVisitor>("Visitor", VisitorSchema);

export default Visitor;
