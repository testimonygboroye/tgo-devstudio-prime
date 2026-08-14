"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: { name: string } | string;
}

export default function UsersClient() {
  const pathname = usePathname();
  const basePathSegment = `/${pathname.split("/").filter(Boolean)[0]}`;
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.status === "ok") setUsers(data.users);
      setIsLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      {isLoading && <p className="text-neutral-400">Loading...</p>}
      {!isLoading && users.length === 0 && <p className="text-neutral-400">No users found.</p>}
      <div className="space-y-2">
        {users.map((user) => {
          const roleName = typeof user.role === "string" ? user.role : user.role.name;
          return (
            <Link
              key={user._id}
              href={`${basePathSegment}/users/${user._id}`}
              className="block rounded-lg border border-base-800 bg-base-900 p-4 hover:border-brand-cyan-400"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-100">{user.name}</span>
                <span className="text-xs text-brand-cyan-300">{roleName}</span>
              </div>
              <p className="mt-1 text-sm text-neutral-400">{user.email}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
