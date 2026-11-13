"use client";

import { useState, useEffect, useCallback } from "react";

interface RoleOption {
  _id: string;
  name: string;
  hierarchyLevel: number;
}

interface InviteItem {
  _id: string;
  email: string;
  role: { name: string } | string;
  invitedBy: { name: string } | string;
  approvalStatus: "pending" | "approved" | "rejected";
  usedAt?: string;
  expiresAt: string;
}

export default function InvitesClient() {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesRes, invitesRes] = await Promise.all([fetch("/api/roles", { cache: "no-store" }), fetch("/api/invites", { cache: "no-store" })]);
      const rolesData = await rolesRes.json();
      const invitesData = await invitesRes.json();
      if (!rolesRes.ok || rolesData.status !== "ok") throw new Error(rolesData.message || "Could not load available roles.");
      if (!invitesRes.ok || invitesData.status !== "ok") throw new Error(invitesData.message || "Could not load invitations.");
      setRoles(rolesData.roles || []);
      setInvites(invitesData.invites || []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load invitations. Please retry.");
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSendInvite(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSending(true);

    try {
      const res = await fetch("/api/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), roleId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send invite.");
      setSuccessMessage(data.message || `Invite submitted for ${email}.`);
      setEmail(""); setRoleId("");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not submit the invitation."); }
    finally { setIsSending(false); }
  }

  async function handleDecision(inviteId: string, decision: "approve" | "reject") {
    setDecidingId(inviteId);
    setError("");
    try {
      const res = await fetch(`/api/invites/${inviteId}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Could not ${decision} this invitation.`);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update invitation."); }
    finally { setDecidingId(null); }
  }

  const STATUS_STYLES: Record<string, string> = {
    pending: "bg-brand-cyan-400/20 text-brand-cyan-300",
    approved: "bg-green-500/20 text-green-300",
    rejected: "bg-red-500/20 text-red-300",
  };

  return (
    <div className="max-w-4xl space-y-7">
      <form onSubmit={handleSendInvite} className="space-y-5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#141b30] to-[#0c1120] p-5 shadow-[0_20px_60px_rgba(0,0,0,.25)] sm:p-6">
        <div>
          <label className="block text-sm text-neutral-400">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-neutral-100 outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Role</label>
          <select
            required
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-950 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role._id} value={role._id}>
                {role.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            You can only invite people into roles below your own in the hierarchy. All invites
            require approval before being sent.
          </p>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {successMessage && <p className="text-sm text-brand-cyan-300">{successMessage}</p>}
        <button
          type="submit"
          disabled={isSending}
          className="rounded-xl brand-gradient-bg px-5 py-3 text-sm font-semibold text-base-950 shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:opacity-60"
        >
          {isSending ? "Submitting..." : "Submit Invite for Approval"}
        </button>
      </form>

      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-cyan-300">Team access</p><h2 className="mt-1 text-xl font-semibold text-white">Invitation activity</h2></div><span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs text-slate-300">{invites.length} total</span></div>
        {isLoading && <p className="mt-2 text-sm text-neutral-400">Loading...</p>}
        {!isLoading && invites.length === 0 && <p className="mt-2 text-sm text-neutral-400">No invites yet.</p>}
        <div className="mt-3 space-y-2">
          {invites.map((invite) => {
            const roleName = typeof invite.role === "string" ? invite.role : invite.role.name;
            const inviterName = typeof invite.invitedBy === "string" ? invite.invitedBy : invite.invitedBy.name;
            return (
              <div key={invite._id} className="rounded-2xl border border-white/10 bg-[#11182a]/85 p-4 text-sm shadow-[0_12px_35px_rgba(0,0,0,.16)]">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-100">{invite.email}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[invite.approvalStatus]}`}>
                    {invite.approvalStatus}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  {roleName} · invited by {inviterName}
                </p>
                {invite.approvalStatus === "pending" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleDecision(invite._id, "approve")}
                      disabled={decidingId === invite._id}
                      className="rounded-md border border-brand-cyan-400/50 px-3 py-1 text-xs text-brand-cyan-300 hover:bg-brand-cyan-400/10 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDecision(invite._id, "reject")}
                      disabled={decidingId === invite._id}
                      className="rounded-md border border-red-500/50 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
