"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface AdminSearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  basePath: string;
}

export default function AdminSearchBar({ placeholder = "Search...", defaultValue = "", basePath }: AdminSearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (value) params.set("q", value);
      params.set("page", "1");
      router.push(`${basePath}?${params.toString()}`);
    }, 400);

    return () => clearTimeout(timeout);
  }, [value, basePath, router]);

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-xs rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-brand-cyan-400"
    />
  );
}
