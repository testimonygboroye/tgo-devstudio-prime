import { connectToDatabase } from "@/lib/db";
import PlatformNotification from "@/models/PlatformNotification";
import type { Types } from "mongoose";
import { sanitizePlatformMetadata } from "@/platform/audit/sanitize";
import User from "@/models/User";
import Role from "@/models/Role";
import { getAdminBasePath } from "@/lib/adminPath";

export interface CreatePlatformNotificationInput {
  recipientId: string | Types.ObjectId;
  category: string;
  title: string;
  body: string;
  href?: string;
  actionLabel?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  requiresAction?: boolean;
  dedupeKey?: string;
  sourceType?: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
}

const NOTIFICATION_PERMISSION_BY_CATEGORY: Record<string, string> = {
  "recruitment-application": "jobApplications",
  applications: "jobApplications",
  "consultation-request": "consultations",
  "project-change-request": "projectChanges",
  "client-project-review": "reviews",
  "testimonial-review": "reviews",
  reviews: "reviews",
  "customer-support": "customerSupport",
  "customer-support-reply": "customerSupport",
  "customer-support-status": "customerSupport",
  "support-assignment": "customerSupport",
  "support-escalation": "customerSupport",
  "customer-enquiry": "contactSubmissions",
  contact: "contactSubmissions",
  "ai-task-completed": "aiWorkforce",
  "ai-task-failed": "aiWorkforce",
  "ai-approval": "aiWorkforce",
  "project-deliverable": "projects",
  "project-milestone": "projects",
  "project-status": "projects",
  "project-task": "projects",
  "project-created": "projects",
  "project-assignment": "projects",
  "proposal-issued": "commercial",
  "quote-issued": "commercial",
  "contract-issued": "commercial",
  "order-created": "commercial",
  "invoice-issued": "finance",
  "payment-failed": "finance",
  "payment-confirmed": "finance",
  "payment-received": "finance",
  "refund-failed": "finance",
  "refund-processed": "finance",
};

async function roleRecipients(category: string) {
  await connectToDatabase();
  const permissionKey = NOTIFICATION_PERMISSION_BY_CATEGORY[category];
  const roleFilter: Record<string, unknown> = permissionKey
    ? { $or: [{ isFounderRole: true }, { [`contentPermissions.${permissionKey}.viewAnalytics`]: true }] }
    : { isFounderRole: true };
  const roles = await Role.find(roleFilter).select("_id isFounderRole").lean();
  if (!roles.length) return [];
  const roleById = new Map(roles.map((role) => [String(role._id), Boolean(role.isFounderRole)]));
  const users = await User.find({ role: { $in: roles.map((role) => role._id) }, accountType: "staff", isBanned: false }).select("_id role").lean();
  return users.map((user) => ({ id: String(user._id), isFounder: roleById.get(String(user.role)) === true }));
}

async function notifyUsersDirect(ids: Array<string | Types.ObjectId>, input: Omit<CreatePlatformNotificationInput, "recipientId">) {
  await connectToDatabase();
  const unique = [...new Set(ids.map(String))].filter((id) => /^[a-f0-9]{24}$/i.test(id));
  return Promise.all(unique.map((recipientId) => {
    const safeHref = input.href && input.href.startsWith("/") && !input.href.startsWith("//") ? input.href : undefined;
    const safe = { ...input, recipientId, href: safeHref, metadata: sanitizePlatformMetadata(input.metadata || {}) as Record<string, unknown> };
    if (input.dedupeKey) return PlatformNotification.findOneAndUpdate(
      { recipientId, dedupeKey: input.dedupeKey },
      { $setOnInsert: safe },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return PlatformNotification.create(safe);
  }));
}

/** Direct recipients plus founder and every active staff role granted View permission for the event's module. */
export async function notifyUsers(ids: Array<string | Types.ObjectId>, input: Omit<CreatePlatformNotificationInput, "recipientId">) {
  return notifyUsersDirect(ids, input);
}

export async function createPlatformNotification(input: CreatePlatformNotificationInput) {
  const { recipientId, ...rest } = input;
  return notifyUsersDirect([recipientId], rest);
}

export async function notifyUser(id: string | Types.ObjectId, input: Omit<CreatePlatformNotificationInput, "recipientId">) {
  return notifyUsersDirect([id], input);
}

export async function notifyRole(roleSlug: string, input: Omit<CreatePlatformNotificationInput, "recipientId">) {
  await connectToDatabase();
  const role = await Role.findOne({ slug: roleSlug }).select("_id").lean();
  if (!role) return [];
  const users = await User.find({ role: role._id, accountType: "staff", isBanned: false }).select("_id").lean();
  return notifyUsersDirect(users.map((user) => user._id), input);
}

export async function notifyAccountType(accountType: "staff" | "client", input: Omit<CreatePlatformNotificationInput, "recipientId">) {
  await connectToDatabase();
  const users = await User.find({ accountType, isBanned: false }).select("_id").lean();
  return notifyUsersDirect(users.map((user) => user._id), input);
}

/** Explicit founder-facing producer; module viewers are included automatically. */
export async function notifyFounders(input: Omit<CreatePlatformNotificationInput, "recipientId">) {
  const recipients = await roleRecipients(input.category);
  return Promise.all(recipients.map((recipient) => notifyUsersDirect(
    [recipient.id],
    recipient.isFounder
      ? input
      : { ...input, href: getAdminBasePath() + "/notifications", actionLabel: "View notification details" }
  )));
}
