import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { connectToDatabase } from "@/lib/db";
import DataDeletionRequest from "@/models/DataDeletionRequest";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { sendAdminPush } from "@/lib/push/server";
import { getAdminBasePath } from "@/lib/adminPath";
import { after } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as null | Record<string, unknown>;
  if (!body) return NextResponse.json({ status: "error", message: "Invalid request." }, { status: 400 });
  if (String(body.companyWebsite || "").trim()) return NextResponse.json({ status: "ok", message: "Your request has been received." }, { status: 201 });
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const accountIdentifier = String(body.accountIdentifier || "").trim();
  const service = String(body.service || "");
  const details = String(body.details || "").trim();
  const token = String(body.turnstileToken || "");
  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !accountIdentifier || accountIdentifier.length > 180 || details.length < 15 || details.length > 3000 || !["website","client-portal","whatsapp","other"].includes(service)) {
    return NextResponse.json({ status: "error", message: "Complete all required fields with valid information. Describe the request in at least 15 characters." }, { status: 400 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!await verifyTurnstileToken(token, ip)) return NextResponse.json({ status: "error", message: "Human verification failed. Please complete the challenge and try again." }, { status: 400 });
  await connectToDatabase();
  const recent = await DataDeletionRequest.countDocuments({ email, createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } });
  if (recent >= 3) return NextResponse.json({ status: "error", message: "Too many requests were submitted recently. Please try again later." }, { status: 429 });
  const reference = "TGO-PRIV-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + randomUUID().slice(0,8).toUpperCase();
  const item = await DataDeletionRequest.create({ reference, name, email, accountIdentifier, service, details, status: "received" });
  after(async () => {
    try { await sendAdminPush({ title: "New privacy request", body: reference + " · " + name, url: getAdminBasePath() + "/privacy-requests", category: "system", tag: reference }); } catch (error) { console.error("[Privacy] Admin notification failed:", error); }
  });
  return NextResponse.json({ status: "ok", reference, message: "Your privacy request has been received. Keep this reference number for follow-up. We may contact you to verify your identity before taking action." }, { status: 201 });
}
