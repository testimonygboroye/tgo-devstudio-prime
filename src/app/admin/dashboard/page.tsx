import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import { connectToDatabase } from "@/lib/db";
import Role from "@/models/Role";
import LogoutButton from "./LogoutButton";

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  const basePath = getAdminBasePath();

  if (!session) {
    redirect(`${basePath}/login`);
  }

  await connectToDatabase();
  const roles = await Role.find().sort({ createdAt: 1 }).lean();

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              TGO DevStudio Prime — Admin
            </p>
            <h1 className="mt-1 text-3xl font-bold brand-gradient-text">
              Welcome, {session.user.name.split(" ")[0]}
            </h1>
          </div>
          <LogoutButton />
        </div>

        <p className="mt-2 text-neutral-100/70">
          Signed in as {session.user.email} — role: {session.role.name}
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-neutral-100">Roles</h2>
          <div className="mt-4 space-y-3">
            {roles.map((role) => (
              <div
                key={role._id.toString()}
                className="rounded-lg border border-base-800 bg-base-900 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-100">{role.name}</span>
                  {role.isFounderRole && (
                    <span className="rounded-full bg-brand-violet-600/20 px-2 py-0.5 text-xs text-brand-cyan-300">
                      Founder
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-neutral-400">
                  Manage roles: {role.canManageRoles ? "Yes" : "No"} · Manage users:{" "}
                  {role.canManageUsers ? "Yes" : "No"} · Requires 2FA:{" "}
                  {role.requiresTwoFactor ? "Yes" : "No"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
