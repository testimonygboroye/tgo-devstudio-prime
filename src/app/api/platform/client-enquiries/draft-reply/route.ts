import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import ClientEnquiry from "@/models/ClientEnquiry";
import { AIChatbotConfig } from "@/models/AIChatbot";
import { AIProvider } from "@/models/AIWorkforce";
import Service from "@/models/Service";
import PageContent from "@/models/PageContent";
import { runProviderCompletionWithFallback } from "@/lib/ai/provider-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!session.role?.isFounderRole) return NextResponse.json({ error: "Founder access required." }, { status: 403 });

  const body = await request.json().catch(() => null) as null | Record<string, unknown>;
  const enquiryId = String(body?.enquiryId || "");
  if (!Types.ObjectId.isValid(enquiryId)) return NextResponse.json({ error: "A valid enquiry is required." }, { status: 400 });

  await connectToDatabase();
  const [enquiry, config, services, policies] = await Promise.all([
    ClientEnquiry.findById(enquiryId).populate("clientId", "name").lean(),
    AIChatbotConfig.findOne({ scope: "admin", enabled: true }).lean(),
    Service.find({ publishStatus: "published" }).select("title summary").sort({ displayOrder: 1 }).limit(30).lean(),
    PageContent.find({ type: { $in: ["about", "privacy-policy", "terms-of-service", "usage-policy"] } }).select("title content").limit(8).lean(),
  ]);
  if (!enquiry) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
  if (!config) return NextResponse.json({ error: "Enable and configure the internal AI assistant before generating enquiry drafts." }, { status: 409 });
  const primary = await AIProvider.findOne({ _id: config.providerId, enabled: true, lastTestStatus: "success" });
  if (!primary) return NextResponse.json({ error: "The configured primary AI provider is not currently verified. Check AI Workforce provider settings." }, { status: 409 });

  const client = enquiry.clientId as unknown as { name?: string } | null;
  const system = [
    "You draft a professional customer-enquiry reply for TGO DevStudio Prime.",
    "Write a warm, clear, specific response that addresses the customer's actual question.",
    "Use only the supplied enquiry and published TGO service/policy context. Never invent prices, delivery dates, guarantees, discounts, legal positions, technical commitments or account actions.",
    "If a detail is missing, ask a concise clarifying question or say a team member will confirm it.",
    "Do not claim that a payment, booking, project change, refund, or other operation has been completed.",
    "Return only the reply text. Do not include a subject line, analysis, provider details, or a note that AI wrote it.",
  ].join("\n");
  const prompt = [
    "Customer name: " + String(client?.name || "Customer"),
    "Enquiry subject: " + enquiry.subject,
    "Enquiry category: " + enquiry.category,
    "Customer message:",
    enquiry.message,
    "Existing staff response (may be empty; improve it only if useful):",
    String(enquiry.response || ""),
    "Published services:",
    JSON.stringify(services),
    "Published company and policy context:",
    JSON.stringify(policies.map(page => ({ title: page.title, content: String(page.content || "").slice(0, 2500) }))),
    "Draft a reply that the authorised staff member will review and edit before sending.",
  ].join("\n\n");

  try {
    const completion = await runProviderCompletionWithFallback(String(config.providerId), config.modelName, system, prompt, "admin");
    const draft = completion.text.trim().slice(0, 5000);
    if (!draft) throw new Error("The AI provider returned an empty draft.");
    return NextResponse.json({ draft, message: "AI draft generated. Review and edit it before saving or sending." }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const diagnostic = error instanceof Error ? error.message.slice(0, 1200) : "AI provider request failed.";
    return NextResponse.json({ error: "AI draft generation failed. " + diagnostic }, { status: 502, headers: { "Cache-Control": "private, no-store" } });
  }
}
