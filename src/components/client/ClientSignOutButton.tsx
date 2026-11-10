"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function ClientSignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    if (busy) return;
    const confirmed = window.confirm("Are you sure you want to sign out of your TGO DevStudio client portal?");
    if (!confirmed) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/client/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return <button type="button" onClick={signOut} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-50"><LogOut size={14}/><span className="hidden sm:inline">{busy ? "Signing out…" : "Sign out"}</span></button>;
}
