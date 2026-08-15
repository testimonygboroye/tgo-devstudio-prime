"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface RoleOption {
  _id: string;
  name: string;
  hierarchyLevel: number;
}

interface UserDetail {
  name: string;
  email: string;
  isBanned: boolean;
  role: { _id: string; name: string; hierarchyLevel: number };
}

export default function UserEditClient() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [confirmAction, setConfirmAction] = useState<"ban" | "unban" | "delete" | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  async function load() {
    const [userRes, rolesRes] = await Promise.all([
      fetch(`/api/users/${params.id}`),
      fetch("/api/roles"),
    ]);
    const userData = await userRes.json();
    const rolesData = await rolesRes.json();
    if (userData.status === "ok") {
      setUser(userData.user);
      setName(userData.user.name);
      setRoleId(userData.user.role._id);
    }
    if (rolesData.status === "ok") setRoles(rolesData.roles);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setMessage("");

    const res = await fetch(`/api/users/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, roleId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Failed to update user.");
      setIsSaving(false);
      return;
    }

    if (data.roleChangeOutcome === "pending") {
      setMessage("Role upgrade submitted — the user must accept it before it takes effect. Both of you have been notified.");
    } else if (data.roleChangeOutcome === "applied") {
      setMessage("Role change applied immediately. Both of you have been notified.");
    } else {
      setMessage("User updated.");
    }
    setIsSaving(false);
    load();
  }

  const CONFIRM_WORDS: Record<string, string> = {
    ban: "SUSPEND",
    unban: "REINSTATE",
    delete: "DELETE",
  };

  function openConfirm(action: "ban" | "unban" | "delete") {
    setConfirmAction(action);
    setConfirmText("");
    setError("");
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    if (confirmText !== CONFIRM_WORDS[confirmAction]) {
      setError(`You must type ${CONFIRM_WORDS[confirmAction]} exactly to confirm.`);
      return;
    }

    setIsConfirming(true);
    setError("");

    if (confirmAction === "delete") {
      const res = await fetch(`/api/users/${params.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to delete user.");
        setIsConfirming(false);
        return;
      }
      router.push("../users");
      return;
    }

    const res = await fetch(`/api/users/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banAction: confirmAction === "ban" ? "ban" : "unban" }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Action failed.");
      setIsConfirming(false);
      return;
    }

    setMessage(confirmAction === "ban" ? "User suspended." : "User reinstated.");
    setConfirmAction(null);
    setIsConfirming(false);
    load();
  }

  if (isLoading) return <p className="text-neutral-400">Loading...</p>;
  if (!user) return <p className="text-red-400">User not found.</p>;

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm text-neutral-400">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Email</label>
        <p className="mt-1 text-neutral-500">{user.email}</p>
      </div>

      {user.isBanned && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-300">
          This account is currently suspended.
        </div>
      )}

      <div>
        <label className="block text-sm text-neutral-400">Role</label>
        <select
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        >
          {roles.map((role) => (
            <option key={role._id} value={role._id}>
              {role.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-500">
          Assigning a lower-authority role applies immediately. Assigning a higher-authority role
          requires the user's acceptance and notifies both of you either way.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-brand-cyan-300">{message}</p>}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="rounded-md brand-gradient-bg px-5 py-2 text-sm font-semibold text-base-950 disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>

      <div className="mt-8 space-y-2 border-t border-base-800 pt-6">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Danger Zone</p>
        <div className="flex flex-wrap gap-2">
          {!user.isBanned ? (
            <button
              onClick={() => openConfirm("ban")}
              className="rounded-md border border-amber-500/50 px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/10"
            >
              Suspend User
            </button>
          ) : (
            <button
              onClick={() => openConfirm("unban")}
              className="rounded-md border border-green-500/50 px-4 py-2 text-sm text-green-300 hover:bg-green-500/10"
            >
              Reinstate User
            </button>
          )}
          <button
            onClick={() => openConfirm("delete")}
            className="rounded-md border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
          >
            Delete User
          </button>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-xl border border-base-800 bg-base-950 p-6">
            <p className="font-semibold text-neutral-100">
              {confirmAction === "delete"
                ? "Permanently delete this user?"
                : confirmAction === "ban"
                ? "Suspend this user's access?"
                : "Reinstate this user's access?"}
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              Type <span className="font-mono font-bold text-red-300">{CONFIRM_WORDS[confirmAction]}</span> below to confirm.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-3 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isConfirming ? "Processing..." : "Confirm"}
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="rounded-md border border-base-800 px-4 py-2 text-sm text-neutral-100 hover:bg-base-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
