"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import RoleForm from "@/components/admin/RoleForm";

interface RoleData {
  name: string;
  hierarchyLevel: number;
  canManageUsers: boolean;
  canBanUsers: boolean;
  canDeleteUsers: boolean;
  requiresTwoFactor: boolean;
  contentPermissions: Record<string, { create: boolean; edit: boolean; publish: boolean; delete: boolean; viewAnalytics: boolean }>;
}

export default function EditRoleClient() {
  const params = useParams();
  const [role, setRole] = useState<RoleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/roles/${params.id}`);
      const data = await res.json();
      if (data.status === "ok") {
        setRole({
          name: data.role.name,
          hierarchyLevel: data.role.hierarchyLevel,
          canManageUsers: data.role.canManageUsers,
          canBanUsers: data.role.canBanUsers,
          canDeleteUsers: data.role.canDeleteUsers,
          requiresTwoFactor: data.role.requiresTwoFactor,
          contentPermissions: data.role.contentPermissions || {},
        });
      }
      setIsLoading(false);
    }
    load();
  }, [params.id]);

  if (isLoading) return <p className="text-neutral-400">Loading...</p>;
  if (!role) return <p className="text-red-400">Role not found.</p>;

  return <RoleForm mode="edit" roleId={params.id as string} initialData={role} />;
}
