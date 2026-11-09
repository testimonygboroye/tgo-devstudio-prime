import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import ClientEnquiry from "@/models/ClientEnquiry";
import ClientActivity from "@/models/ClientActivity";
import PlatformNotification from "@/models/PlatformNotification";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client") return NextResponse.json({ error: "Client sign-in required." }, { status: 401 });
  await connectToDatabase();
  const enquiries = await ClientEnquiry.find({ clientId: session.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json({ enquiries: enquiries.map((item) => ({
    id: String(item._id), subject: item.subject, message: item.message, category: item.category,
    status: item.status, priority: item.priority, createdAt: item.createdAt.toISOString(),
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
  const enquiry = await ClientEnquiry.create({ clientId: session.user._id, subject, message, category });
  await Promise.all([
    ClientActivity.create({ clientId: session.user._id, actorId: session.user._id, actorType: "client", action: "client.enquiry_created", summary: `Submitted an enquiry: ${subject}`, metadata: { enquiryId: String(enquiry._id), category } }),
    PlatformNotification.create({ recipientId: session.user._id, category: "client-enquiry", title: "Enquiry received", body: `We received “${subject}” and will follow up in your portal.`, href: "/client/enquiries", metadata: { enquiryId: String(enquiry._id) } }),
  ]);
  return NextResponse.json({ ok: true, enquiry: { id: String(enquiry._id), status: enquiry.status } }, { status: 201 });
}
