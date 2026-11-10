"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";

export default function ClientRegistrationCompleteForm() {
  const router = useRouter();
  const [firstName,setFirstName]=useState("");
  const [middleName,setMiddleName]=useState("");
  const [lastName,setLastName]=useState("");
  const [password,setPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [showConfirm,setShowConfirm]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  async function submit(event:React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      if(password!==confirmPassword) throw new Error("The passwords do not match.");
      const response=await fetch("/api/client/register/complete",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({firstName,middleName,lastName,password,confirmPassword})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||"Account creation failed.");
      setSuccess(data.message||"Your client account has been created.");
      window.setTimeout(()=>{router.replace("/client/login?registered=1");router.refresh();},900);
    } catch(cause) { setError(cause instanceof Error?cause.message:"Account creation failed."); }
    finally { setBusy(false); }
  }
  const input="mt-2 w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10";
  return <main className="flex min-h-screen items-center justify-center bg-[#080d20] px-5 py-12 text-white">
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(104,64,220,.24),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(34,211,238,.12),transparent_35%)]"/>
    <section className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b1229]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="mb-7"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"><ShieldCheck size={24}/></div><p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">TGO DevStudio · Client Portal</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Complete your account</h1><p className="mt-2 text-sm leading-6 text-slate-300">Your email has been verified. Add your name and create a secure password to finish registration.</p><div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.07] px-3 py-2 text-xs text-emerald-200"><CheckCircle2 size={14}/>Email verified</div></div>
      {error&&<p role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
      {success&&<p role="status" className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{success}</p>}
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm text-slate-200">First name<div className="relative"><UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input required minLength={2} maxLength={60} autoComplete="given-name" value={firstName} onChange={e=>setFirstName(e.target.value)} className={input+" pl-10"} placeholder="First name"/></div></label>
        <label className="block text-sm text-slate-200">Middle name <span className="text-xs text-slate-500">(optional)</span><input maxLength={60} autoComplete="additional-name" value={middleName} onChange={e=>setMiddleName(e.target.value)} className={input} placeholder="Middle name"/></label>
        <label className="block text-sm text-slate-200">Last name<input required minLength={2} maxLength={60} autoComplete="family-name" value={lastName} onChange={e=>setLastName(e.target.value)} className={input} placeholder="Last name"/></label>
        <label className="block text-sm text-slate-200">Password<div className="relative"><LockKeyhole size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input required type={showPassword?"text":"password"} minLength={12} maxLength={72} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className={input+" pl-10 pr-12"} placeholder="At least 12 characters"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
        <label className="block text-sm text-slate-200">Confirm password<div className="relative"><LockKeyhole size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input required type={showConfirm?"text":"password"} minLength={12} maxLength={72} autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className={input+" pl-10 pr-12"} placeholder="Enter the same password again"/><button type="button" onClick={()=>setShowConfirm(v=>!v)} aria-label={showConfirm?"Hide confirm password":"Show confirm password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showConfirm?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
        <p className="text-xs leading-5 text-slate-400">Use 12–72 UTF-8 bytes with at least one uppercase letter, one lowercase letter and one number.</p>
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:opacity-60">{busy?"Creating account…":"Complete sign up"}<ArrowRight size={17}/></button>
      </form>
    </section>
  </main>;
}
