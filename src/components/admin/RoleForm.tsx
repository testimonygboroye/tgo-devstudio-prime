"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MANAGED_CONTENT_TYPES } from "@/lib/constants/contentTypes";

interface PermissionSet {
  create: boolean;
  edit: boolean;
  publish: boolean;
  delete: boolean;
  viewAnalytics: boolean;
}

const EMPTY_PERMISSION: PermissionSet = {
  create: false,
  edit: false,
  publish: false,
  delete: false,
  viewAnalytics: false,
};

interface RoleFormProps {
  mode: "create" | "edit";
  roleId?: string;
  initialData?: {
    name: string;
    hierarchyLevel: number;
    canManageUsers: boolean;
    canBanUsers: boolean;
    canDeleteUsers: boolean;
    requiresTwoFactor: boolean;
    contentPermissions: Record<string, PermissionSet>;
  };
}

export default function RoleForm({ mode, roleId, initialData }: RoleFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || "");
  const [hierarchyLevel, setHierarchyLevel] = useState(initialData?.hierarchyLevel ?? 100);
  const [canManageUsers, setCanManageUsers] = useState(initialData?.canManageUsers ?? false);
  const [canBanUsers, setCanBanUsers] = useState(initialData?.canBanUsers ?? false);
  const [canDeleteUsers, setCanDeleteUsers] = useState(initialData?.canDeleteUsers ?? false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(initialData?.requiresTwoFactor ?? false);
  const [permissions, setPermissions] = useState<Record<string, PermissionSet>>(
    () => {
      const base: Record<string, PermissionSet> = {};
      MANAGED_CONTENT_TYPES.forEach((ct) => {
        base[ct.key] = initialData?.contentPermissions?.[ct.key] || { ...EMPTY_PERMISSION };
      });
      return base;
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  function togglePermission(contentType: string, field: keyof PermissionSet) {
    setPermissions((prev) => ({
      ...prev,
      [contentType]: { ...prev[contentType], [field]: !prev[contentType][field] },
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const endpoint = mode === "create" ? "/api/roles" : `/api/roles/${roleId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          hierarchyLevel: Number(hierarchyLevel),
          canManageUsers,
          canBanUsers,
          canDeleteUsers,
          requiresTwoFactor,
          contentPermissions: permissions,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save role.");
        return;
      }

      router.push("../roles");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div>
        <label className="block text-sm text-neutral-400">Role Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full max-w-md rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Hierarchy Level</label>
        <input
          required
          type="number"
          value={hierarchyLevel}
          onChange={(e) => setHierarchyLevel(Number(e.target.value))}
          className="mt-1 w-full max-w-xs rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Lower number = higher authority (Founder is always 0). Must be higher than your own
          role's level. Anyone can only invite, promote, or manage roles below their own level.
        </p>
      </div>

      <div className="rounded-lg border border-base-800 bg-base-900 p-4">
        <p className="text-sm font-semibold text-neutral-100">Admin Powers</p>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" checked={canManageUsers} onChange={(e) => setCanManageUsers(e.target.checked)} />
            Can manage users (invite, assign roles)
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" checked={canBanUsers} onChange={(e) => setCanBanUsers(e.target.checked)} />
            Can suspend / reinstate users
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" checked={canDeleteUsers} onChange={(e) => setCanDeleteUsers(e.target.checked)} />
            Can permanently delete users
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" checked={requiresTwoFactor} onChange={(e) => setRequiresTwoFactor(e.target.checked)} />
            Requires two-factor authentication
          </label>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-neutral-100">Content Permissions</p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-base-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-800 bg-base-900 text-left text-xs uppercase tracking-widest text-neutral-500">
                <th className="px-3 py-2">Content Type</th>
                <th className="px-3 py-2 text-center">Create</th>
                <th className="px-3 py-2 text-center">Edit</th>
                <th className="px-3 py-2 text-center">Publish</th>
                <th className="px-3 py-2 text-center">Delete</th>
                <th className="px-3 py-2 text-center">View</th>
              </tr>
            </thead>
            <tbody>
              {MANAGED_CONTENT_TYPES.map((ct) => (
                <tr key={ct.key} className="border-b border-base-800 last:border-0">
                  <td className="px-3 py-2 text-neutral-100">{ct.label}</td>
                  {(["create", "edit", "publish", "delete", "viewAnalytics"] as const).map((field) => (
                    <td key={field} className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={permissions[ct.key]?.[field] || false}
                        onChange={() => togglePermission(ct.key, field)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-md brand-gradient-bg px-5 py-2 text-sm font-semibold text-base-950 disabled:opacity-60"
      >
        {isSaving ? "Saving..." : mode === "create" ? "Create Role" : "Save Changes"}
      </button>
    </form>
  );
}
