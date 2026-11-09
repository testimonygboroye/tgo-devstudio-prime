import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import ClientEnquiry from "@/models/ClientEnquiry";
import ClientActivity from "@/models/ClientActivity";
import PlatformNotification from "@/models/PlatformNotification";
import ClientProfile from "@/models/ClientProfile";
import Role from "@/models/Role";
import User from "@/models/User";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client") return NextResponse.json({ error: "Client sign-in required." }, { status: 401 });
  await connectToDatabase();
  const enquiries = await ClientEnquiry.find({ clientId: session.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json({ enquiries: enquiries.map((item) => ({
    id: String(item._id), subject: item.subject, message: item.message, category: item.category,
    status: item.status, priority: item.priority, response: item.response || "", respondedAt: item.respondedAt?.toISOString() || null, createdAt: item.createdAt.toISOString(),
  })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client" || !session.user.isEmailVerified) return NextResponse.json({ error: "Verified client sign-in required." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const category = body.category;
  if (subject.length < 4 || subject.length > 180 || message.length < 10 || message.length > 5000) return NextResponse.json({ error: "Enter a subject (4–180 characters) and message (10–5,000 characters)." }, { status: 400 });
  if (!["general", "service", "project", "billing", "support"].includes(String(category))) return NextResponse.json({ error: "Choose a valid enquiry category." }, { status: 400 });
  await connectToDatabase();
  const recentCount = await ClientEnquiry.countDocuments({ clientId: session.user._id, createdAt: { $gte: new Date(Date.now() - 60_000) } });
  if (recentCount >= 3) return NextResponse.json({ error: "You have submitted several requests recently. Please wait a minute before sending another." }, { status: 429 });
  const profile = await ClientProfile.findOne({ userId: session.user._id }).select("organizationId");
  const enquiry = await ClientEnquiry.create({ clientId: session.user._id, organizationId: profile?.organizationId, subject, message, category });
  const founderRoles = await Role.find({ isFounderRole: true }).select("_id");
  const founders = founderRoles.length ? await User.find({ role: { $in: founderRoles.map(role => role._id) }, isBanned: false }).select("_id") : [];
  await Promise.all([
    ClientActivity.create({ clientId: session.user._id, actorId: session.user._id, actorType: "client", action: "client.enquiry_created", summary: `Submitted an enquiry: ${subject}`, metadata: { enquiryId: String(enquiry._id), category } }),
    PlatformNotification.create({ recipientId: session.user._id, category: "client-enquiry", title: "Enquiry received", body: `We received “${subject}” and will follow up in your portal.`, href: "/client/enquiries", metadata: { enquiryId: String(enquiry._id) } }),
    PlatformNotification.insertMany(founders.map(founder => ({ recipientId: founder._id, category: "client-enquiry", title: "New client enquiry", body: `${session.user.name} submitted: ${subject}`, href: "/admin/client-enquiries", metadata: { enquiryId: String(enquiry._id), clientId: String(session.user._id) } }))),
    writePlatformAuditEvent({ actorType: "human", actorId: String(session.user._id), actorLabel: session.user.name, action: "client.enquiry_created", module: "clients", targetType: "client-enquiry", targetId: String(enquiry._id), outcome: "success", metadata: { category, organizationId: profile?.organizationId ? String(profile.organizationId) : null } }),
  ]);
  return NextResponse.json({ ok: true, enquiry: { id: String(enquiry._id), status: enquiry.status } }, { status: 201 });
}
