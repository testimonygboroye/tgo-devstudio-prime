"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldAlert } from "lucide-react";

export default function ClientRegistrationVerification({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function verify() {
      if (!token) { if (active) { setError("The verification link is missing. Request a new one."); setStatus("error"); } return; }
      try {
        const response = await fetch("/api/client/register/verify", {
          method: "POST", headers: { "Content-Type": "application/json" },
          credentials: "same-origin", cache: "no-store", body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Email verification failed.");
        if (active) router.replace("/client/register/complete");
      } catch (cause) {
        if (active) { setError(cause instanceof Error ? cause.message : "Email verification failed."); setStatus("error"); }
      }
    }
    void verify();
    return () => { active = false; };
  }, [token, router]);
  return <main className="flex min-h-screen items-center justify-center bg-[#080d20] px-5 py-12 text-white">
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[.04] p-8 text-center shadow-2xl">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">{status === "loading" ? <LoaderCircle className="animate-spin" size={26}/> : <ShieldAlert size={26}/>}</div>
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">TGO DevStudio · Client Portal</p>
      <h1 className="mt-3 text-2xl font-bold">{status === "loading" ? "Verifying your email" : "Verification could not be completed"}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-300">{status === "loading" ? "Please wait while we securely confirm your email address. You will be taken to the next registration step automatically." : error}</p>
      {status === "error" && <a href="/client/register" className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white">Return to registration</a>}
    </section>
  </main>;
}
