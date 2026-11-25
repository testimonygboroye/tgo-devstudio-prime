import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authorizePlatformPermission } from "@/lib/platform/authorize";
import { connectToDatabase } from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import SupportSettings from "@/models/SupportSettings";
import { AIChatbotConfig } from "@/models/AIChatbot";
import { runProviderCompletionWithFallback } from "@/lib/ai/provider-runtime";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 50;

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function safeDiagnostic(error: unknown) {
  return (error instanceof Error ? error.message : "Unknown AI provider error.")
    .replace(/(?:AIza[0-9A-Za-z_-]{20,}|sk-ant-[0-9A-Za-z_-]{16,}|sk-[0-9A-Za-z_-]{16,})/g, "[redacted]")
    .replace(/(Bearer[ ]+)[^ ,;]+/gi, "$1[redacted]")
    .slice(0, 500);
}

export async function POST(request: NextRequest) {
  const auth = await authorizePlatformPermission("support.tickets.manage");
  if (!auth.allowed) return fail("You do not have permission to use AI support assistance.", auth.reason === "unauthenticated" ? 401 : 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request body.");
  }
  if (typeof body.ticketId !== "string" || !Types.ObjectId.isValid(body.ticketId)) {
    return fail("A valid support ticket id is required.");
  }

  await connectToDatabase();
  const [ticket, settings, assistantConfig] = await Promise.all([
    SupportTicket.findById(body.ticketId).populate("clientId", "name email").lean(),
    SupportSettings.findOne({ key: "global" }).lean(),
    AIChatbotConfig.findOne({ scope: "admin", enabled: true }).lean(),
  ]);
  if (!ticket) return fail("Support ticket not found.", 404);
  if (settings?.aiEnabled === false) return fail("AI assistance is disabled in support settings.", 403);
  if (!assistantConfig) {
    return fail("AI support assistance is not connected. Configure and enable the verified admin assistant under AI & Automation → AI Chatbot Configuration.", 503);
  }

  const history = (ticket.messages || []).slice(-18).map((message) => ({
    sender: message.senderType,
    body: String(message.body).slice(0, 2500),
  }));
  const system = "You are TGO DevStudio's internal customer-support drafting assistant. Draft a concise, empathetic, accurate reply for a human support agent to review. Never claim an action was completed unless the ticket history proves it. Never ask for passwords, one-time codes, secret keys, payment card details, or unnecessary personal data. Do not invent policies, delivery dates, refunds, or technical facts. If information is missing, ask one clear question. Do not send messages, change ticket status, issue refunds, or make commitments. Output only the suggested customer-facing reply.";
  const prompt = JSON.stringify({
    customerName: (ticket.clientId as { name?: string })?.name || "Client",
    ticketReference: ticket.reference,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    description: ticket.description,
    conversation: history,
  });

  try {
    const completion = await runProviderCompletionWithFallback(
      String(assistantConfig.providerId),
      assistantConfig.modelName,
      system,
      prompt,
      "admin",
    );
    const draft = completion.text.trim().slice(0, 8000);
    if (!draft) return fail("The configured AI provider returned an empty support draft.", 502);

    await writePlatformAuditEvent({
      actorType: "human",
      actorId: String(auth.session!.user._id),
      actorLabel: auth.session!.user.name,
      action: "support.ai_draft_generated",
      module: "support",
      targetType: "support_ticket",
      targetId: String(ticket._id),
      outcome: "success",
      metadata: {
        reference: ticket.reference,
        providerId: completion.providerId || String(assistantConfig.providerId),
        model: completion.model || assistantConfig.modelName,
        fallbackUsed: Boolean(completion.fallbackUsed),
        inputTokens: completion.inputTokens,
        outputTokens: completion.outputTokens,
      },
    });
    return NextResponse.json({ ok: true, draft, requiresHumanReview: true, provider: completion.providerId, fallbackUsed: Boolean(completion.fallbackUsed) });
  } catch (error) {
    const diagnostic = safeDiagnostic(error);
    try {
      await writePlatformAuditEvent({
        actorType: "human",
        actorId: String(auth.session!.user._id),
        actorLabel: auth.session!.user.name,
        action: "support.ai_draft_failed",
        module: "support",
        targetType: "support_ticket",
        targetId: String(ticket._id),
        outcome: "failure",
        metadata: { reference: ticket.reference, diagnostic },
      });
    } catch {
      // Preserve the safe API failure even if audit storage is unavailable.
    }
    return fail("AI support drafting failed: " + diagnostic, 502);
  }
}
