import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import BusinessOrganization from "@/models/BusinessOrganization";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!session.role?.isFounderRole) return NextResponse.json({ error: "Founder access required." }, { status: 403 });
  const query = (request.nextUrl.searchParams.get("q") || "").trim().slice(0, 80);
  if (query.length < 2) return NextResponse.json({ results: [] }, { headers: { "Cache-Control": "private, no-store" } });
  await connectToDatabase();
  const expression = new RegExp(escapeRegex(query), "i");
  const [organizations, users] = await Promise.all([
    BusinessOrganization.find({ $or: [{ name: expression }, { slug: expression }] }).sort({ createdAt: -1 }).limit(6).select("name slug type status").lean(),
    User.find({ $or: [{ name: expression }, { email: expression }] }).sort({ createdAt: -1 }).limit(6).select("name email accountType").lean(),
  ]);
  const results = [
    ...organizations.map((item) => ({ id: String(item._id), type: "organization", title: item.name, subtitle: `${item.type} · ${item.status}`, href: "/businesses" })),
    ...users.map((item) => ({ id: String(item._id), type: "user", title: item.name, subtitle: item.accountType === "client" ? `Client · ${item.email}` : item.email, href: item.accountType === "client" ? "/clients" : "/users" })),
  ];
  const response = NextResponse.json({ results });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
