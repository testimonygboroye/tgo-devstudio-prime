"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface RoleItem {
  _id: string;
  name: string;
  hierarchyLevel: number;
  isFounderRole: boolean;
}

export default function RolesListClient() {
  const pathname = usePathname();
  const basePathSegment = `/${pathname.split("/").filter(Boolean)[0]}`;
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (data.status === "ok") setRoles(data.roles);
      setIsLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      {isLoading && <p className="text-neutral-400">Loading...</p>}
      <div className="space-y-2">
        {roles.map((role) => (
          <Link
            key={role._id}
            href={role.isFounderRole ? "#" : `${basePathSegment}/roles/${role._id}`}
            className={`block rounded-lg border border-base-800 bg-base-900 p-4 ${
              role.isFounderRole ? "cursor-not-allowed opacity-60" : "hover:border-brand-cyan-400"
            }`}
            onClick={(e) => role.isFounderRole && e.preventDefault()}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-100">{role.name}</span>
              <span className="text-xs text-neutral-500">Level {role.hierarchyLevel}</span>
            </div>
            {role.isFounderRole && (
              <p className="mt-1 text-xs text-neutral-500">Founder role — cannot be edited</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
