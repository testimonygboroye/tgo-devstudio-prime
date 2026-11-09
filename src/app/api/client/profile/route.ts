import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import ClientProfile from "@/models/ClientProfile";
import ClientActivity from "@/models/ClientActivity";
import { connectToDatabase } from "@/lib/db";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client" || !session.user.isEmailVerified) return NextResponse.json({ error: "Verified client sign-in required." }, { status: 401 });
  await connectToDatabase();
  const profile = await ClientProfile.findOne({ userId: session.user._id }).populate("organizationId", "name slug").lean();
  return NextResponse.json({
    profile: profile ? {
      id: String(profile._id), phone: profile.phone || "", jobTitle: profile.jobTitle || "",
      website: profile.website || "", country: profile.country || "", timezone: profile.timezone || "",
      lifecycle: profile.lifecycle, segments: profile.segments, onboardingStatus: profile.onboardingStatus,
      organization: profile.organizationId && typeof profile.organizationId === "object" && "name" in profile.organizationId ? {
        name: profile.organizationId.name, slug: profile.organizationId.slug,
      } : null,
    } : null,
    user: { name: session.user.name, email: session.user.email, emailVerified: session.user.isEmailVerified },
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client") return NextResponse.json({ error: "Client sign-in required." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const allowed = ["phone", "jobTitle", "website", "country", "timezone"] as const;
  const values: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== "string" || String(body[key]).length > (key === "website" ? 300 : 120)) return NextResponse.json({ error: "One or more profile fields are invalid." }, { status: 400 });
      values[key] = String(body[key]).trim();
    }
  }
  if (values.website && !/^https:\/\//i.test(values.website)) return NextResponse.json({ error: "Website must use https://." }, { status: 400 });
  await connectToDatabase();
  const current = await ClientProfile.findOne({ userId: session.user._id });
  if (!current) return NextResponse.json({ error: "Client profile not found." }, { status: 404 });
  const merged = { phone: values.phone ?? current.phone ?? "", country: values.country ?? current.country ?? "", timezone: values.timezone ?? current.timezone ?? "" };
  const onboardingStatus = merged.phone && merged.country && merged.timezone ? "completed" : "in_progress";
  const profile = await ClientProfile.findOneAndUpdate({ userId: session.user._id }, { $set: { ...values, onboardingStatus } }, { new: true, runValidators: true });
  if (!profile) return NextResponse.json({ error: "Client profile not found." }, { status: 404 });
  await ClientActivity.create({ clientId: session.user._id, actorId: session.user._id, actorType: "client", action: "client.profile_updated", summary: "Client updated their profile.", metadata: { fields: Object.keys(values) } });
  return NextResponse.json({ ok: true, message: "Profile updated." });
}
