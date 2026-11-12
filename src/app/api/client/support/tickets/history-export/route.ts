import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client" || !session.user.isEmailVerified) {
    return NextResponse.json({ error: "Verified client sign-in required." }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;
  const ticketId = params.get("ticketId") || "";
  const allTime = params.get("allTime") === "true";
  const fromValue = params.get("from") || "";
  const toValue = params.get("to") || "";
  if (!Types.ObjectId.isValid(ticketId)) return NextResponse.json({ error: "A valid support request is required." }, { status: 400 });
  if (!allTime && (!fromValue || !toValue || !Number.isFinite(Date.parse(fromValue)) || !Number.isFinite(Date.parse(toValue)))) {
    return NextResponse.json({ error: "Choose a valid start and end date, or select all time." }, { status: 400 });
  }
  const from = allTime ? undefined : new Date(fromValue);
  const to = allTime ? undefined : new Date(toValue);
  if (from && to && (from > to || to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ error: "The date range is invalid or exceeds 366 days." }, { status: 400 });
  }

  await connectToDatabase();
  const ticket = await SupportTicket.findOne({ _id: ticketId, clientId: session.user._id }).lean();
  if (!ticket) return NextResponse.json({ error: "Support request not found." }, { status: 404 });
  const messages = (ticket.messages || []).filter((message) => {
    const createdAt = new Date(message.createdAt).getTime();
    return (!from || createdAt >= from.getTime()) && (!to || createdAt <= to.getTime() + 24 * 60 * 60 * 1000 - 1);
  });
  const archive = {
    format: "tgo-client-support-archive",
    version: 1,
    exportedAt: new Date().toISOString(),
    range: allTime ? { allTime: true } : { allTime: false, from: from?.toISOString(), to: to?.toISOString() },
    ticket: {
      id: String(ticket._id),
      reference: ticket.reference,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    },
    totalMessages: messages.length,
    messages: messages.map((message) => ({
      id: String(message._id || ""),
      senderType: message.senderType,
      body: message.body,
      attachments: message.attachments || [],
      createdAt: message.createdAt,
    })),
  };
  return new NextResponse(JSON.stringify(archive, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tgo-' + ticket.reference.toLowerCase() + '-history.json"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
