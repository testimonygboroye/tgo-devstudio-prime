import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import BusinessMembership from "@/models/BusinessMembership";
import BusinessRole from "@/models/BusinessRole";
import {
  evaluatePlatformPermission,
  type PlatformPermissionGrant,
  type PlatformResourceContext,
} from "@/platform/authorization/evaluate";

export async function authorizePlatformPermission(
  permission: string,
  resource?: PlatformResourceContext
) {
  const session = await getServerSession();
  if (!session) {
    return { allowed: false as const, reason: "unauthenticated" as const, session: null };
  }

  if (session.role.isFounderRole) {
    return {
      allowed: true as const,
      reason: "founder" as const,
      session,
    };
  }

  await connectToDatabase();
  const membership = await BusinessMembership.findOne({
    userId: session.user._id,
    status: "active",
  }).lean();

  if (!membership || !membership.roleIds?.length) {
    return { allowed: false as const, reason: "no-membership" as const, session };
  }

  const roles = await BusinessRole.find({ _id: { $in: membership.roleIds } })
    .select("permissionGrants deniedPermissions")
    .lean();

  const grants = roles.flatMap((role) =>
    (role.permissionGrants || []).map((grant) => ({
      permission: grant.permission,
      scope: grant.scope,
      resourceIds: grant.resourceIds || [],
    }))
  ) as PlatformPermissionGrant[];

  const deniedPermissions = roles.flatMap((role) => role.deniedPermissions || []);
  const decision = evaluatePlatformPermission(
    {
      userId: String(session.user._id),
      departmentIds: membership.departmentIds || [],
      teamIds: membership.teamIds || [],
      grants,
      deniedPermissions,
    },
    permission,
    resource
  );

  return { ...decision, session };
}
