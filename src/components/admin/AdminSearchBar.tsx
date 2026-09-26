"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

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
    <div className="relative w-full max-w-sm">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="input-premium pl-10 text-sm"
      />
    </div>
  );
}
