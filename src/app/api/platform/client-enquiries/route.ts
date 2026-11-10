import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import ClientEnquiry from "@/models/ClientEnquiry";
import ClientActivity from "@/models/ClientActivity";
import PlatformNotification from "@/models/PlatformNotification";
import User from "@/models/User";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!session.role.isFounderRole) return NextResponse.json({ error: "Founder access required." }, { status: 403 });
  await connectToDatabase();
  const status = request.nextUrl.searchParams.get("status") || "";
  const filter: Record<string, unknown> = {};
  if (["new", "in_review", "responded", "closed"].includes(status)) filter.status = status;
  const enquiries = await ClientEnquiry.find(filter).populate("clientId", "name email").populate("assignedTo", "name email").sort({ createdAt: -1 }).limit(250).lean();
  const staff = await User.find({ accountType: { $ne: "client" }, isBanned: false }).select("name email").sort({ name: 1 }).limit(100).lean();
  return NextResponse.json({ staff: staff.map(user => ({ id: String(user._id), name: user.name, email: user.email })), enquiries: enquiries.map(item => {
    const client = item.clientId && typeof item.clientId === "object" && "email" in item.clientId ? item.clientId as unknown as { _id: unknown; name: string; email: string } : null;
    const assignee = item.assignedTo && typeof item.assignedTo === "object" && "email" in item.assignedTo ? item.assignedTo as unknown as { _id: unknown; name: string; email: string } : null;
    return { id: String(item._id), clientId: client ? String(client._id) : String(item.clientId), clientName: client?.name || "Client", clientEmail: client?.email || "", subject: item.subject, message: item.message, category: item.category, status: item.status, priority: item.priority, response: item.response || "", assignedTo: assignee ? String(assignee._id) : "", assigneeName: assignee?.name || "", createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() };
  }) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!session.role.isFounderRole) return NextResponse.json({ error: "Founder access required." }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof body.id !== "string" || !Types.ObjectId.isValid(body.id)) return NextResponse.json({ error: "A valid enquiry id is required." }, { status: 400 });
  if (body.status !== undefined && !["new", "in_review", "responded", "closed"].includes(String(body.status))) return NextResponse.json({ error: "Invalid enquiry status." }, { status: 400 });
  if (body.priority !== undefined && !["low", "normal", "high"].includes(String(body.priority))) return NextResponse.json({ error: "Invalid priority." }, { status: 400 });
  if (body.response !== undefined && (typeof body.response !== "string" || body.response.trim().length > 5000)) return NextResponse.json({ error: "Response must be 5,000 characters or fewer." }, { status: 400 });
  await connectToDatabase();
  const enquiry = await ClientEnquiry.findById(body.id);
  if (!enquiry) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
  if (body.assignedTo !== undefined) {
    if (body.assignedTo === null || body.assignedTo === "") enquiry.assignedTo = undefined;
    else {
      if (typeof body.assignedTo !== "string" || !Types.ObjectId.isValid(body.assignedTo)) return NextResponse.json({ error: "Choose a valid staff account." }, { status: 400 });
      const assignee = await User.findOne({ _id: body.assignedTo, accountType: { $ne: "client" }, isBanned: false });
      if (!assignee) return NextResponse.json({ error: "Choose an active staff account." }, { status: 400 });
      enquiry.assignedTo = assignee._id;
    }
  }
  const changed: string[] = [];
  if (body.status !== undefined && enquiry.status !== body.status) { enquiry.status = body.status as typeof enquiry.status; changed.push("status"); }
  if (body.priority !== undefined && enquiry.priority !== body.priority) { enquiry.priority = body.priority as typeof enquiry.priority; changed.push("priority"); }
  if (body.response !== undefined) {
    const responseText = (body.response as string).trim();
    if (responseText !== (enquiry.response || "")) {
      enquiry.response = responseText || undefined;
      changed.push("response");
      if (responseText) {
        enquiry.respondedAt = new Date();
        enquiry.respondedBy = session.user._id;
        if (body.status === undefined && enquiry.status !== "closed" && enquiry.status !== "responded") {
          enquiry.status = "responded";
          changed.push("status");
        }
      }
    }
  }
  if (body.assignedTo !== undefined) changed.push("assignedTo");
  if (!changed.length) return NextResponse.json({ ok: true, message: "No changes were needed." });
  await enquiry.save();
  const client = await User.findById(enquiry.clientId).select("name email");
  const summary = enquiry.response ? `Our team responded to your enquiry “${enquiry.subject}”.` : `Your enquiry “${enquiry.subject}” was updated to ${enquiry.status.replace("_", " ")}.`;
  await Promise.all([
    ClientActivity.create({ clientId: enquiry.clientId, actorId: session.user._id, actorType: "staff", action: "client.enquiry_updated", summary: enquiry.response && changed.includes("response") ? `The team responded to your enquiry: ${enquiry.subject}` : `Enquiry updated by the team: ${enquiry.subject}`, metadata: { enquiryId: String(enquiry._id), changed } }),
    PlatformNotification.create({ recipientId: enquiry.clientId, category: "client-enquiry", title: enquiry.response && changed.includes("response") ? "Your enquiry has a response" : "Enquiry update", body: enquiry.response && changed.includes("response") ? `${summary} ${enquiry.response.slice(0, 240)}` : summary, href: "/client/enquiries", metadata: { enquiryId: String(enquiry._id) } }),
    ...(enquiry.assignedTo ? [PlatformNotification.create({ recipientId: enquiry.assignedTo, category: "client-enquiry-assignment", title: "Client enquiry assigned", body: `You are assigned to “${enquiry.subject}” for ${client?.name || "a client"}.`, href: "/admin/client-enquiries", metadata: { enquiryId: String(enquiry._id), clientId: String(enquiry.clientId) } })] : []),
    writePlatformAuditEvent({ actorType: "human", actorId: String(session.user._id), actorLabel: session.user.name, action: "client.enquiry_admin_updated", module: "clients", targetType: "client-enquiry", targetId: String(enquiry._id), outcome: "success", metadata: { changed, status: enquiry.status, priority: enquiry.priority, clientId: String(enquiry.clientId) } }),
  ]);
  return NextResponse.json({ ok: true, message: "Enquiry updated and client notified.", client: client ? { name: client.name, email: client.email } : null });
}
