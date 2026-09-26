import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import Role from "@/models/Role";
import { Shield, UserCheck, Key, BarChart3, ArrowUpRight, Layers } from "lucide-react";
import Link from "next/link";
import { getAdminBasePath } from "@/lib/adminPath";

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  const canManageRoles = session!.role.canManageRoles;
  const basePath = getAdminBasePath();

  if (canManageRoles) {
    await connectToDatabase();
  }
  const roles = canManageRoles
    ? await Role.find().sort({ createdAt: 1 }).lean()
    : [];

  const currentRoleId = session!.role._id?.toString();

  return (
    <div className="space-y-8">
      {/* Welcome Hero Card */}
      <div className="surface-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-brand-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-8 w-48 h-48 rounded-full bg-brand-cyan-400/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-violet-600/15 px-3 py-1 text-xs font-semibold text-brand-cyan-300 border border-brand-violet-600/30 mb-3">
              <span className="h-2 w-2 rounded-full bg-brand-cyan-400 animate-pulse" />
              Secure CMS Control Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-[var(--text-primary)] tracking-tight">
              Welcome back, <span className="brand-gradient-text">{session!.user.name}</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl">
              You are authenticated securely as <span className="font-semibold text-[var(--text-primary)]">{session!.user.email}</span> with role <span className="text-brand-cyan-400 font-semibold">{session!.role.name}</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`${basePath}/analytics`}
              className="btn-premium-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-violet-600/20"
            >
              <BarChart3 size={16} />
              View Analytics
            </Link>
            <Link
              href={`${basePath}/security`}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
            >
              <Key size={16} className="text-brand-cyan-400" />
              Security & 2FA
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Navigation / Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href={`${basePath}/blog`} className="surface-card rounded-xl p-5 hover:border-brand-cyan-400/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-brand-violet-600/10 text-brand-cyan-400 border border-brand-violet-600/20 group-hover:scale-110 transition-transform">
              <Layers size={20} />
            </div>
            <ArrowUpRight size={16} className="text-[var(--text-muted)] group-hover:text-brand-cyan-400 transition-colors" />
          </div>
          <h3 className="font-display font-semibold text-[var(--text-primary)]">Manage Content</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Blog posts, case studies, services, team & FAQ items.</p>
        </Link>

        <Link href={`${basePath}/users`} className="surface-card rounded-xl p-5 hover:border-brand-cyan-400/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-brand-cyan-400/10 text-brand-cyan-400 border border-brand-cyan-400/20 group-hover:scale-110 transition-transform">
              <UserCheck size={20} />
            </div>
            <ArrowUpRight size={16} className="text-[var(--text-muted)] group-hover:text-brand-cyan-400 transition-colors" />
          </div>
          <h3 className="font-display font-semibold text-[var(--text-primary)]">Users & Invites</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Manage platform administrators and onboarding invites.</p>
        </Link>

        <Link href={`${basePath}/messages`} className="surface-card rounded-xl p-5 hover:border-brand-cyan-400/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-brand-violet-600/10 text-brand-cyan-400 border border-brand-violet-600/20 group-hover:scale-110 transition-transform">
              <Shield size={20} />
            </div>
            <ArrowUpRight size={16} className="text-[var(--text-muted)] group-hover:text-brand-cyan-400 transition-colors" />
          </div>
          <h3 className="font-display font-semibold text-[var(--text-primary)]">Inquiries & Messages</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Review contact submissions, applications & messages.</p>
        </Link>

        <Link href={`${basePath}/audit-log`} className="surface-card rounded-xl p-5 hover:border-brand-cyan-400/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-brand-cyan-400/10 text-brand-cyan-400 border border-brand-cyan-400/20 group-hover:scale-110 transition-transform">
              <BarChart3 size={20} />
            </div>
            <ArrowUpRight size={16} className="text-[var(--text-muted)] group-hover:text-brand-cyan-400 transition-colors" />
          </div>
          <h3 className="font-display font-semibold text-[var(--text-primary)]">Audit Logs</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Track security events, admin actions and page views.</p>
        </Link>
      </div>

      {/* Role Management Section */}
      {canManageRoles ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
              <Shield size={20} className="text-brand-cyan-400" />
              Role & Permissions Matrix
            </h2>
            <Link
              href={`${basePath}/roles`}
              className="text-xs font-semibold text-brand-cyan-400 hover:underline"
            >
              Manage Roles →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => {
              const isCurrentUserRole = role._id.toString() === currentRoleId;
              return (
                <div
                  key={role._id.toString()}
                  className={`surface-card rounded-xl p-5 transition-all ${
                    isCurrentUserRole
                      ? "border-brand-cyan-400/60 shadow-lg shadow-brand-cyan-400/5"
                      : "border-[var(--border-subtle)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-bold text-base text-[var(--text-primary)]">{role.name}</span>
                    <div className="flex items-center gap-2">
                      {isCurrentUserRole && (
                        <span className="rounded-full bg-brand-cyan-400/15 px-2.5 py-0.5 text-xs font-semibold text-brand-cyan-300 border border-brand-cyan-400/30">
                          Your role
                        </span>
                      )}
                      {role.isFounderRole && (
                        <span className="rounded-full bg-brand-violet-600/20 px-2.5 py-0.5 text-xs font-semibold text-brand-cyan-300 border border-brand-violet-600/30">
                          Founder
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                    <div>
                      <span className="block text-[var(--text-muted)] font-mono uppercase text-[10px]">Manage Roles</span>
                      <span className={`font-semibold ${role.canManageRoles ? "text-emerald-400" : "text-[var(--text-secondary)]"}`}>
                        {role.canManageRoles ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[var(--text-muted)] font-mono uppercase text-[10px]">Manage Users</span>
                      <span className={`font-semibold ${role.canManageUsers ? "text-emerald-400" : "text-[var(--text-secondary)]"}`}>
                        {role.canManageUsers ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[var(--text-muted)] font-mono uppercase text-[10px]">Requires 2FA</span>
                      <span className={`font-semibold ${role.requiresTwoFactor ? "text-brand-cyan-400" : "text-[var(--text-secondary)]"}`}>
                        {role.requiresTwoFactor ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="surface-card rounded-xl p-5 border-[var(--border-subtle)]">
            <span className="font-display font-semibold text-[var(--text-primary)]">Your role: {session!.role.name}</span>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Role management and advanced matrix configuration are restricted to roles with corresponding permissions.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
