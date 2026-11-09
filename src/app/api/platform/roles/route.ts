import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import BusinessRole from "@/models/BusinessRole";
import BusinessMembership from "@/models/BusinessMembership";
import PlatformAuditEvent from "@/models/PlatformAuditEvent";
import { isPlatformPermission, PLATFORM_PERMISSION_CATALOG } from "@/platform/permissions/catalog";

export const dynamic = "force-dynamic";
const SCOPES = ["global", "self", "department", "team", "project", "client"] as const;

async function requireFounder() {
  const session = await getServerSession();
  if (!session) return { session: null, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  if (!session.role?.isFounderRole) return { session: null, response: NextResponse.json({ error: "Founder access required." }, { status: 403 }) };
  return { session, response: null };
}

function validateRoleInput(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 500) : "";
  const slug = name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
  if (name.length < 2 || name.length > 100 || !slug) return { error: "Role name must contain 2–100 characters." } as const;
  if (!Array.isArray(body.permissionGrants) || body.permissionGrants.length > 120) return { error: "Provide a valid permission grant list." } as const;
  const permissionGrants: { permission: string; scope: typeof SCOPES[number]; resourceIds: string[] }[] = [];
  for (const item of body.permissionGrants) {
    if (!item || typeof item !== "object") return { error: "A permission grant is malformed." } as const;
    const grant = item as Record<string, unknown>;
    const permission = typeof grant.permission === "string" ? grant.permission : "";
    const scope = typeof grant.scope === "string" ? grant.scope : "";
    if (!isPlatformPermission(permission) || !SCOPES.includes(scope as typeof SCOPES[number])) return { error: "A permission or scope is not in the platform catalogue." } as const;
    const resourceIds = Array.isArray(grant.resourceIds) ? grant.resourceIds.filter((id): id is string => typeof id === "string" && id.length <= 160).slice(0, 100) : [];
    permissionGrants.push({ permission, scope: scope as typeof SCOPES[number], resourceIds });
  }
  const deniedPermissions = Array.isArray(body.deniedPermissions) ? body.deniedPermissions.filter((value): value is string => typeof value === "string" && isPlatformPermission(value)) : [];
  if (Array.isArray(body.deniedPermissions) && deniedPermissions.length !== body.deniedPermissions.length) return { error: "A denied permission is not in the platform catalogue." } as const;
  return { value: { name, slug, description, permissionGrants, deniedPermissions } } as const;
}

export async function GET() {
  const auth = await requireFounder();
  if (auth.response) return auth.response;
  await connectToDatabase();
  const roles = await BusinessRole.find({}).sort({ name: 1 }).select("name slug description permissionGrants deniedPermissions isSystemRole createdAt updatedAt").lean();
  const response = NextResponse.json({
    roles: roles.map((role) => ({ ...role, id: String(role._id), _id: undefined })),
    permissionCatalogue: PLATFORM_PERMISSION_CATALOG,
  });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export async function POST(request: NextRequest) {
  const auth = await requireFounder();
  if (auth.response || !auth.session) return auth.response || NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const validated = validateRoleInput(body);
  if ("error" in validated) return NextResponse.json({ error: validated.error }, { status: 400 });
  await connectToDatabase();
  try {
    const role = await BusinessRole.create(validated.value);
    await PlatformAuditEvent.create({
      actorType: "human", actorId: String(auth.session.user._id), actorLabel: auth.session.user.name,
      action: "business_role.created", module: "governance", targetType: "business-role", targetId: String(role._id),
      outcome: "success", metadata: { slug: role.slug, grantCount: role.permissionGrants.length },
    });
    return NextResponse.json({ role: { id: String(role._id), name: role.name, slug: role.slug, description: role.description, permissionGrants: role.permissionGrants, deniedPermissions: role.deniedPermissions, isSystemRole: role.isSystemRole } }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return NextResponse.json({ error: "A business role with this name already exists." }, { status: 409 });
    console.error("[platform.roles] create failed", error);
    return NextResponse.json({ error: "Business role could not be created." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireFounder();
  if (auth.response || !auth.session) return auth.response || NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const id = typeof body.id === "string" ? body.id : "";
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "A valid business role is required." }, { status: 400 });
  const validated = validateRoleInput(body);
  if ("error" in validated) return NextResponse.json({ error: validated.error }, { status: 400 });
  await connectToDatabase();
  const existing = await BusinessRole.findById(id);
  if (!existing) return NextResponse.json({ error: "Business role not found." }, { status: 404 });
  if (existing.isSystemRole) return NextResponse.json({ error: "System roles are protected from editing." }, { status: 403 });
  existing.set(validated.value);
  await existing.save();
  await PlatformAuditEvent.create({
    actorType: "human", actorId: String(auth.session.user._id), actorLabel: auth.session.user.name,
    action: "business_role.updated", module: "governance", targetType: "business-role", targetId: id,
    outcome: "success", metadata: { slug: existing.slug, grantCount: existing.permissionGrants.length },
  });
  return NextResponse.json({ role: { id: String(existing._id), name: existing.name, slug: existing.slug, description: existing.description, permissionGrants: existing.permissionGrants, deniedPermissions: existing.deniedPermissions, isSystemRole: existing.isSystemRole } });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireFounder();
  if (auth.response || !auth.session) return auth.response || NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id") || "";
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "A valid business role is required." }, { status: 400 });
  await connectToDatabase();
  const role = await BusinessRole.findById(id);
  if (!role) return NextResponse.json({ error: "Business role not found." }, { status: 404 });
  if (role.isSystemRole) return NextResponse.json({ error: "System roles cannot be deleted." }, { status: 403 });
  const assignments = await BusinessMembership.countDocuments({ roleIds: role._id });
  if (assignments > 0) return NextResponse.json({ error: "This role is assigned to one or more members. Reassign those members before deleting it." }, { status: 409 });
  await role.deleteOne();
  await PlatformAuditEvent.create({
    actorType: "human", actorId: String(auth.session.user._id), actorLabel: auth.session.user.name,
    action: "business_role.deleted", module: "governance", targetType: "business-role", targetId: id,
    outcome: "success", metadata: { slug: role.slug },
  });
  return NextResponse.json({ success: true });
}
