import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import ClientProfile from "@/models/ClientProfile";
import ClientActivity from "@/models/ClientActivity";
import BusinessOrganization from "@/models/BusinessOrganization";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const dynamic = "force-dynamic";
function isFounder(session: Awaited<ReturnType<typeof getServerSession>>) { return Boolean(session?.role?.isFounderRole); }

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isFounder(session)) return NextResponse.json({ error: "Founder access required." }, { status: 403 });
  await connectToDatabase();
  const q = (request.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);
  const lifecycle = request.nextUrl.searchParams.get("lifecycle") || "";
  const query: Record<string, unknown> = { accountType: "client" };
  if (q.length >= 2) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [{ name: { $regex: safe, $options: "i" } }, { email: { $regex: safe, $options: "i" } }];
  }
  const userIds = await User.find(query).select("_id name email isEmailVerified isBanned createdAt updatedAt").sort({ createdAt: -1 }).limit(200).lean();
  const ids = userIds.map(user => user._id);
  const profileQuery: Record<string, unknown> = { userId: { $in: ids } };
  if (["lead", "onboarding", "active", "at_risk", "inactive"].includes(lifecycle)) profileQuery.lifecycle = lifecycle;
  const profiles = await ClientProfile.find(profileQuery).populate("organizationId", "name").lean();
  const byUser = new Map(profiles.map(profile => [String(profile.userId), profile]));
  const clients = userIds.filter(user => !lifecycle || byUser.has(String(user._id))).map(user => {
    const profile = byUser.get(String(user._id));
    const org = profile?.organizationId && typeof profile.organizationId === "object" && "name" in profile.organizationId ? profile.organizationId as unknown as { _id: unknown; name: string } : null;
    return {
      id: String(user._id), name: user.name, email: user.email, emailVerified: user.isEmailVerified,
      suspended: user.isBanned, createdAt: user.createdAt.toISOString(),
      profileId: profile ? String(profile._id) : null, lifecycle: profile?.lifecycle || "onboarding",
      segments: profile?.segments || [], onboardingStatus: profile?.onboardingStatus || "not_started",
      organization: org ? { id: String(org._id), name: org.name } : null,
      phone: profile?.phone || "", country: profile?.country || "",
    };
  });
  const organizations = await BusinessOrganization.find({ type: "client", status: "active" }).select("name slug").sort({ name: 1 }).lean();
  return NextResponse.json({ clients, organizations: organizations.map(item => ({ id: String(item._id), name: item.name })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isFounder(session)) return NextResponse.json({ error: "Founder access required." }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof body.clientId !== "string") return NextResponse.json({ error: "Client id is required." }, { status: 400 });
  if (body.suspended !== undefined && typeof body.suspended !== "boolean") return NextResponse.json({ error: "Suspended must be a boolean." }, { status: 400 });
  const allowedLifecycle = ["lead", "onboarding", "active", "at_risk", "inactive"];
  const allowedOnboarding = ["not_started", "in_progress", "completed"];
  if (body.lifecycle !== undefined && !allowedLifecycle.includes(String(body.lifecycle))) return NextResponse.json({ error: "Invalid lifecycle." }, { status: 400 });
  if (body.onboardingStatus !== undefined && !allowedOnboarding.includes(String(body.onboardingStatus))) return NextResponse.json({ error: "Invalid onboarding status." }, { status: 400 });
  if (body.segments !== undefined && (!Array.isArray(body.segments) || body.segments.length > 30 || body.segments.some(value => typeof value !== "string" || value.trim().length > 40))) return NextResponse.json({ error: "Segments must be up to 30 labels of 40 characters each." }, { status: 400 });
  await connectToDatabase();
  const user = await User.findOne({ _id: body.clientId, accountType: "client" });
  if (!user) return NextResponse.json({ error: "Client account not found." }, { status: 404 });
  const changes: Record<string, unknown> = {};
  if (body.suspended !== undefined) {
    user.isBanned = body.suspended;
    user.bannedAt = body.suspended ? new Date() : undefined;
    await user.save();
    changes.accountStatus = body.suspended ? "suspended" : "active";
  }
  if (body.lifecycle !== undefined) changes.lifecycle = body.lifecycle;
  if (body.onboardingStatus !== undefined) changes.onboardingStatus = body.onboardingStatus;
  if (body.segments !== undefined) changes.segments = [...new Set((body.segments as string[]).map(value => value.trim().toLowerCase()).filter(Boolean))];
  if (body.organizationId !== undefined) {
    if (body.organizationId === null || body.organizationId === "") changes.organizationId = undefined;
    else {
      const org = await BusinessOrganization.findOne({ _id: body.organizationId, type: "client", status: "active" });
      if (!org) return NextResponse.json({ error: "Choose an active client organization." }, { status: 400 });
      changes.organizationId = org._id;
    }
  }
  if (Object.keys(changes).length === 0) return NextResponse.json({ error: "No valid changes supplied." }, { status: 400 });
  const profile = await ClientProfile.findOneAndUpdate({ userId: user._id }, { $set: changes, $setOnInsert: { userId: user._id, source: "admin_created" } }, { new: true, upsert: true, runValidators: true });
  await Promise.all([
    ClientActivity.create({ clientId: user._id, actorId: session.user._id, actorType: "staff", action: "client.admin_updated", summary: "Client record updated by an administrator.", metadata: { fields: Object.keys(changes) } }),
    writePlatformAuditEvent({ actorType: "human", actorId: String(session.user._id), actorLabel: session.user.name, action: "client.profile_admin_updated", module: "clients", targetType: "client", targetId: String(user._id), outcome: "success", metadata: { fields: Object.keys(changes) } }),
  ]);
  return NextResponse.json({ ok: true, profileId: String(profile._id) });
}
