"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import Link from "next/link";

export default function ClientEmailVerification({ token }: { token: string }) {
  const [status, setStatus] = useState<"checking"|"success"|"error">(token ? "checking" : "error");
  const [message, setMessage] = useState(token ? "Verifying your email address…" : "This verification link is incomplete.");
  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch("/api/client/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Verification failed."); return data; })
      .then(data => { if (active) { setStatus("success"); setMessage(data.message); } })
      .catch(error => { if (active) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Verification failed."); } });
    return () => { active = false; };
  }, [token]);
  return <main className="flex min-h-screen items-center justify-center bg-[#080d20] px-5 py-12 text-white"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[.05] p-8 text-center shadow-2xl"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-200">{status==="checking"?<LoaderCircle className="animate-spin"/>:status==="success"?<CheckCircle2/>:<CircleAlert/>}</div><h1 className="mt-5 text-2xl font-bold">{status==="success"?"Email verified":status==="error"?"Verification unsuccessful":"Confirming your email"}</h1><p className="mt-3 text-sm leading-6 text-slate-300">{message}</p>{status==="success"&&<Link href="/client/login" className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold">Continue to sign in</Link>}{status==="error"&&<Link href="/client/login" className="mt-6 inline-flex rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold">Return to sign in</Link>}</section></main>;
}
