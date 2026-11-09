import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import BusinessOrganization from "@/models/BusinessOrganization";
import PlatformAuditEvent from "@/models/PlatformAuditEvent";

export const dynamic = "force-dynamic";

function isFounder(session: Awaited<ReturnType<typeof getServerSession>>) {
  return Boolean(session?.role?.isFounderRole);
}

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isFounder(session)) return NextResponse.json({ error: "Founder access required." }, { status: 403 });
  await connectToDatabase();
  const organizations = await BusinessOrganization.find({})
    .sort({ createdAt: -1 })
    .select("name slug type status website contactEmail createdAt updatedAt")
    .lean();
  return NextResponse.json({ organizations: organizations.map((item) => ({ ...item, _id: String(item._id), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })) }, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isFounder(session)) return NextResponse.json({ error: "Founder access required." }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const type = body.type;
  const contactEmail = typeof body.contactEmail === "string" ? body.contactEmail.trim().toLowerCase() : "";
  const website = typeof body.website === "string" ? body.website.trim() : "";
  if (!name || name.length > 140) return NextResponse.json({ error: "Enter an organization name (maximum 140 characters)." }, { status: 400 });
  if (!["internal", "client", "partner", "vendor"].includes(String(type))) return NextResponse.json({ error: "Choose a valid organization type." }, { status: 400 });
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return NextResponse.json({ error: "Enter a valid contact email." }, { status: 400 });
  if (website && !/^https:\/\//i.test(website)) return NextResponse.json({ error: "Website must use https://." }, { status: 400 });

  const slug = name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160);
  if (!slug) return NextResponse.json({ error: "Organization name must contain letters or numbers." }, { status: 400 });
  await connectToDatabase();
  try {
    const organization = await BusinessOrganization.create({
      name, slug, type, contactEmail: contactEmail || undefined,
      website: website || undefined,
      notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : undefined,
      createdBy: session.user._id,
    });
    await PlatformAuditEvent.create({
      actorType: "human", actorId: String(session.user._id), actorLabel: session.user.name,
      action: "organization.created", module: "business-ecosystem",
      targetType: "business-organization", targetId: String(organization._id),
      outcome: "success", metadata: { type: organization.type, slug: organization.slug },
    });
    return NextResponse.json({ organization: { _id: String(organization._id), name: organization.name, slug: organization.slug, type: organization.type, status: organization.status, contactEmail: organization.contactEmail, website: organization.website, createdAt: organization.createdAt.toISOString() } }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return NextResponse.json({ error: "An organization with this name already exists." }, { status: 409 });
    console.error("[platform.organizations] create failed", error);
    return NextResponse.json({ error: "Organization could not be created." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isFounder(session)) return NextResponse.json({ error: "Founder access required." }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const id = typeof body.id === "string" ? body.id : "";
  const status = body.status;
  if (!/^[a-f\d]{24}$/i.test(id) || !["active", "suspended"].includes(String(status))) {
    return NextResponse.json({ error: "A valid organization and status are required." }, { status: 400 });
  }
  await connectToDatabase();
  const organization = await BusinessOrganization.findByIdAndUpdate(id, { $set: { status } }, { new: true }).select("name slug type status").lean();
  if (!organization) return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  await PlatformAuditEvent.create({
    actorType: "human", actorId: String(session.user._id), actorLabel: session.user.name,
    action: "organization.status_changed", module: "business-ecosystem",
    targetType: "business-organization", targetId: id, outcome: "success",
    metadata: { status },
  });
  return NextResponse.json({ organization: { ...organization, _id: String(organization._id) } });
}
