import { randomUUID } from "node:crypto";
import { connectToDatabase } from "@/lib/db";
import Role from "@/models/Role";
import User from "@/models/User";
import ClientProfile from "@/models/ClientProfile";
import ClientActivity from "@/models/ClientActivity";
import { hashPassword } from "@/lib/auth/passwords";

export async function ensureClientRole() {
  let role = await Role.findOne({ slug: "client" });
  if (!role) {
    role = await Role.create({
      name: "Client", slug: "client", hierarchyLevel: 1000, isSystemRole: true,
      isFounderRole: false, canManageRoles: false, canManageUsers: false,
      canBanUsers: false, canDeleteUsers: false, requiresTwoFactor: false,
      contentPermissions: new Map(),
    });
  }
  return role;
}

export async function createClientIdentity(input: {
  name: string; email: string; password?: string; googleSub?: string; source: "self_registration" | "google";
}) {
  await connectToDatabase();
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) throw new Error("An account with this email already exists. Sign in or use the account selector.");
  const role = await ensureClientRole();
  const user = await User.create({
    name: input.name.trim(), email: input.email.toLowerCase(),
    passwordHash: await hashPassword(input.password || randomUUID()),
    googleSub: input.googleSub, role: role._id, accountType: "client",
    isEmailVerified: input.source === "google", emailVerifiedAt: input.source === "google" ? new Date() : undefined,
    authProviders: input.source === "google" ? ["google"] : ["password"],
  });
  await ClientProfile.create({ userId: user._id, lifecycle: "onboarding", onboardingStatus: "not_started", source: input.source });
  await ClientActivity.create({
    clientId: user._id, actorId: user._id, actorType: "client",
    action: "client.account_created", summary: "Client account created.",
    metadata: { source: input.source },
  });
  return user;
}
