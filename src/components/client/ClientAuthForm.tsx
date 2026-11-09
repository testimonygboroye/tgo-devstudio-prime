"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";

export default function ClientAuthForm({ mode, rememberedEmails = [] }: { mode: "login" | "register"; rememberedEmails?: string[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(rememberedEmails[0] || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "register") {
        const response = await fetch("/api/client/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Registration failed.");
        setMessage(data.message || "Check your email to verify your account.");
        return;
      }
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, audience: "client" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Sign-in failed.");
      if (data.status === "2fa_required") {
        setError("Two-factor authentication is enabled for this account. Use the secure two-factor sign-in flow from the main sign-in page, then return to your client portal.");
        return;
      }
      router.replace("/client/dashboard"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  async function resendVerification() {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/client/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not resend verification.");
      setMessage(data.message);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not resend verification."); }
    finally { setBusy(false); }
  }

  return <div className="w-full max-w-md">
    <div className="mb-8"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/15 text-violet-200"><ShieldCheck size={24}/></div>
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">TGO DevStudio · Client Portal</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{mode === "login" ? "Welcome back" : "Create your client account"}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-300">{mode === "login" ? "Sign in to follow your enquiries and manage your relationship with TGO DevStudio." : "Create a secure account to access your client workspace and keep your conversations in one place."}</p>
    </div>
    {error && <div role="alert" className="mb-4 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</div>}
    {message && <div role="status" className="mb-4 flex gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-200"><CheckCircle2 size={18} className="shrink-0"/>{message}</div>}
    {mode === "login" && rememberedEmails.length > 0 && <div className="mb-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[.05] p-3"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-cyan-200/70">Continue as an account</p><div className="space-y-2">{rememberedEmails.map(account=><button key={account} type="button" onClick={() => setEmail(account)} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs transition ${email===account?"border-cyan-300/40 bg-cyan-300/10 text-cyan-100":"border-white/10 text-slate-300 hover:bg-white/5"}`}><span className="truncate">{account}</span>{email===account?<span className="text-[10px]">Selected</span>:<ArrowRight size={14}/>}</button>)}</div></div>}
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" && <label className="block text-sm text-slate-200">Full name<div className="relative mt-2"><UserRound size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} autoComplete="name" className="w-full rounded-xl border border-white/10 bg-white/[.06] py-3 pl-10 pr-4 text-white outline-none focus:border-violet-400" placeholder="Your full name"/></div></label>}
      <label className="block text-sm text-slate-200">Email address<div className="relative mt-2"><Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input required type="email" maxLength={254} value={email} onChange={e=>{setEmail(e.target.value);}} autoComplete="email" className="w-full rounded-xl border border-white/10 bg-white/[.06] py-3 pl-10 pr-4 text-white outline-none focus:border-violet-400" placeholder="you@example.com"/></div></label>
      <label className="block text-sm text-slate-200">Password<div className="relative mt-2"><LockKeyhole size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input required type={showPassword?"text":"password"} minLength={mode==="register"?12:1} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="register"?"new-password":"current-password"} className="w-full rounded-xl border border-white/10 bg-white/[.06] py-3 pl-10 pr-12 text-white outline-none focus:border-violet-400" placeholder={mode==="register"?"At least 12 characters":"Your password"}/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
      {mode === "register" && <p className="text-xs leading-5 text-slate-400">Use at least 12 characters, including uppercase, lowercase and a number. We will send a verification link to your email.</p>}
      <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:opacity-60">{busy?"Please wait…":mode==="login"?"Sign in to client portal":"Create client account"}<ArrowRight size={17}/></button>
    </form>
    {mode === "login" && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs"><button type="button" disabled={busy||!email} onClick={resendVerification} className="text-cyan-300 hover:underline disabled:opacity-40">Resend verification email</button><button type="button" onClick={()=>{setEmail("");setPassword("");}} className="text-slate-400 hover:text-white">Use another account</button></div>}
    <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[.2em] text-slate-500"><span className="h-px flex-1 bg-white/10"/>or continue with<span className="h-px flex-1 bg-white/10"/></div>
    <a href="/api/client/auth/google" className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700">G</span>Continue with Google</a>
    <p className="mt-6 text-center text-sm text-slate-400">{mode==="login"?"New to TGO DevStudio?":"Already have an account?"} <Link className="font-semibold text-cyan-300 hover:underline" href={mode==="login"?"/client/register":"/client/login"}>{mode==="login"?"Create an account":"Sign in"}</Link></p>
    <p className="mt-6 text-center text-[11px] leading-5 text-slate-500">Your account is protected by TGO DevStudio identity and security controls.</p>
  </div>;
}
