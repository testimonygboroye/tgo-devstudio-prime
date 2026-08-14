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

  useEffect(() => {
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
      setMessage("Role upgrade submitted — the user must accept it before it takes effect.");
    } else if (data.roleChangeOutcome === "applied") {
      setMessage("Role change applied immediately.");
    } else {
      setMessage("User updated.");
    }
    setIsSaving(false);
  }

  if (isLoading) return <p className="text-neutral-400">Loading...</p>;
  if (!user) return <p className="text-red-400">User not found.</p>;

  const selectedRole = roles.find((r) => r._id === roleId);
  const isUpgrade = selectedRole && selectedRole.hierarchyLevel < user.role.hierarchyLevel;
  const isDowngrade = selectedRole && selectedRole.hierarchyLevel > user.role.hierarchyLevel;

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
        {isDowngrade && (
          <p className="mt-1 text-xs text-neutral-500">This change will apply immediately.</p>
        )}
        {isUpgrade && (
          <p className="mt-1 text-xs text-brand-cyan-300">
            This is an upgrade — the user will be notified by email and site message, and must
            accept before it takes effect.
          </p>
        )}
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
    </div>
  );
}
