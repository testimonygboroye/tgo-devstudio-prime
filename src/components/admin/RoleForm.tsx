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
  const [permissions, setPermissions] = useState<Record<string, PermissionSet>>(() => {
    const base: Record<string, PermissionSet> = {};
    MANAGED_CONTENT_TYPES.forEach((ct) => {
      base[ct.key] = initialData?.contentPermissions?.[ct.key] || { ...EMPTY_PERMISSION };
    });
    return base;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  function togglePermission(contentType: string, field: keyof PermissionSet) {
    setPermissions((prev) => ({
      ...prev,
      [contentType]: { ...prev[contentType], [field]: !prev[contentType][field] },
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSavedMessage("");
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-base-800 bg-base-900/50 p-6 shadow-xl space-y-6 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-neutral-100">
          {mode === "create" ? "New Role & Permissions" : "Edit Role & Permissions"}
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Role Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Content Editor"
              className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300">Hierarchy Level</label>
            <input
              required
              type="number"
              value={hierarchyLevel}
              onChange={(e) => setHierarchyLevel(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
            />
            <p className="mt-1.5 text-xs text-neutral-400">
              Lower number = higher authority (Founder is 0).
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-base-800 bg-base-950 p-5 space-y-3">
          <p className="text-sm font-semibold text-neutral-200">Admin Powers</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 text-sm text-neutral-300 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={canManageUsers}
                onChange={(e) => setCanManageUsers(e.target.checked)}
                className="h-4 w-4 rounded border-base-800 bg-base-900 text-brand-cyan-400 focus:ring-brand-cyan-400/20"
              />
              Can manage users (invite, assign roles)
            </label>
            <label className="flex items-center gap-3 text-sm text-neutral-300 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={canBanUsers}
                onChange={(e) => setCanBanUsers(e.target.checked)}
                className="h-4 w-4 rounded border-base-800 bg-base-900 text-brand-cyan-400 focus:ring-brand-cyan-400/20"
              />
              Can suspend / reinstate users
            </label>
            <label className="flex items-center gap-3 text-sm text-neutral-300 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={canDeleteUsers}
                onChange={(e) => setCanDeleteUsers(e.target.checked)}
                className="h-4 w-4 rounded border-base-800 bg-base-900 text-brand-cyan-400 focus:ring-brand-cyan-400/20"
              />
              Can permanently delete users
            </label>
            <label className="flex items-center gap-3 text-sm text-neutral-300 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={requiresTwoFactor}
                onChange={(e) => setRequiresTwoFactor(e.target.checked)}
                className="h-4 w-4 rounded border-base-800 bg-base-900 text-brand-cyan-400 focus:ring-brand-cyan-400/20"
              />
              Requires two-factor authentication
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-neutral-200">Content Permissions</p>
          <div className="overflow-x-auto rounded-lg border border-base-800 bg-base-950">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-800 bg-base-900 text-left text-xs uppercase tracking-wider text-neutral-400">
                  <th className="px-4 py-3">Content Type</th>
                  <th className="px-4 py-3 text-center">Create</th>
                  <th className="px-4 py-3 text-center">Edit</th>
                  <th className="px-4 py-3 text-center">Publish</th>
                  <th className="px-4 py-3 text-center">Delete</th>
                  <th className="px-4 py-3 text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-800">
                {MANAGED_CONTENT_TYPES.map((ct) => (
                  <tr key={ct.key} className="hover:bg-base-900/50 transition">
                    <td className="px-4 py-3 font-medium text-neutral-200">{ct.label}</td>
                    {(["create", "edit", "publish", "delete", "viewAnalytics"] as const).map((field) => (
                      <td key={field} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={permissions[ct.key]?.[field] || false}
                          onChange={() => togglePermission(ct.key, field)}
                          className="h-4 w-4 rounded border-base-800 bg-base-900 text-brand-cyan-400 focus:ring-brand-cyan-400/20 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-400">{error}</p>}
        {savedMessage && <p className="text-sm font-medium text-brand-cyan-300">{savedMessage}</p>}

        <div className="pt-4 border-t border-base-800 flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg brand-gradient-bg px-6 py-2.5 text-sm font-semibold text-base-950 shadow-md transition hover:opacity-90 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : mode === "create" ? "Create Role" : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
