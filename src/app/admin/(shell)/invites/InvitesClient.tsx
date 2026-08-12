"use client";

import { useState, useEffect, useCallback } from "react";

interface RoleOption {
  _id: string;
  name: string;
}

interface InviteItem {
  _id: string;
  email: string;
  role: { name: string } | string;
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

  const load = useCallback(async () => {
    setIsLoading(true);
    const [rolesRes, invitesRes] = await Promise.all([fetch("/api/roles"), fetch("/api/invites")]);
    const rolesData = await rolesRes.json();
    const invitesData = await invitesRes.json();
    if (rolesData.status === "ok") setRoles(rolesData.roles);
    if (invitesData.status === "ok") setInvites(invitesData.invites);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSendInvite(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSending(true);

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, roleId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Failed to send invite.");
      setIsSending(false);
      return;
    }

    setSuccessMessage(`Invite sent to ${email}.`);
    setEmail("");
    setRoleId("");
    setIsSending(false);
    load();
  }

  return (
    <div className="max-w-xl">
      <form onSubmit={handleSendInvite} className="space-y-4 rounded-lg border border-base-800 bg-base-900 p-4">
        <div>
          <label className="block text-sm text-neutral-400">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-950 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
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
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {successMessage && <p className="text-sm text-brand-cyan-300">{successMessage}</p>}
        <button
          type="submit"
          disabled={isSending}
          className="rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950 disabled:opacity-60"
        >
          {isSending ? "Sending..." : "Send Invite"}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Sent Invites</h2>
        {isLoading && <p className="mt-2 text-sm text-neutral-400">Loading...</p>}
        {!isLoading && invites.length === 0 && <p className="mt-2 text-sm text-neutral-400">No invites sent yet.</p>}
        <div className="mt-3 space-y-2">
          {invites.map((invite) => {
            const roleName = typeof invite.role === "string" ? invite.role : invite.role.name;
            const status = invite.usedAt
              ? "Used"
              : new Date(invite.expiresAt).getTime() < Date.now()
              ? "Expired"
              : "Pending";
            return (
              <div key={invite._id} className="rounded-md border border-base-800 bg-base-900 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-100">{invite.email}</span>
                  <span className="text-xs text-neutral-500">{status}</span>
                </div>
                <p className="text-xs text-neutral-500">{roleName}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
