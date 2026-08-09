import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import Role from "@/models/Role";

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  const canManageRoles = session!.role.canManageRoles;

  let roles: Awaited<ReturnType<typeof Role.find>> = [];
  if (canManageRoles) {
    await connectToDatabase();
    roles = await Role.find().sort({ createdAt: 1 }).lean();
  }

  const currentRoleId = session!.role._id?.toString();

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Overview</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">
        Welcome, {session!.user.name.split(" ")[0]}
      </h1>
      <p className="mt-2 text-neutral-100/70">
        Signed in as {session!.user.email} — role: {session!.role.name}
      </p>

      {canManageRoles ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-neutral-100">Roles</h2>
          <div className="mt-4 space-y-3">
            {roles.map((role) => {
              const isCurrentUserRole = role._id.toString() === currentRoleId;
              return (
                <div
                  key={role._id.toString()}
                  className={`rounded-lg border p-4 ${
                    isCurrentUserRole
                      ? "border-brand-cyan-400/60 bg-base-900"
                      : "border-base-800 bg-base-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-100">{role.name}</span>
                    <div className="flex items-center gap-2">
                      {isCurrentUserRole && (
                        <span className="rounded-full bg-brand-cyan-400/20 px-2 py-0.5 text-xs text-brand-cyan-300">
                          Your role
                        </span>
                      )}
                      {role.isFounderRole && (
                        <span className="rounded-full bg-brand-violet-600/20 px-2 py-0.5 text-xs text-brand-cyan-300">
                          Founder
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-neutral-400">
                    Manage roles: {role.canManageRoles ? "Yes" : "No"} · Manage users:{" "}
                    {role.canManageUsers ? "Yes" : "No"} · Requires 2FA:{" "}
                    {role.requiresTwoFactor ? "Yes" : "No"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="mt-10">
          <div className="rounded-lg border border-base-800 bg-base-900 p-4">
            <span className="font-semibold text-neutral-100">Your role: {session!.role.name}</span>
            <p className="mt-1 text-sm text-neutral-400">
              Role management is restricted to roles with that permission.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
