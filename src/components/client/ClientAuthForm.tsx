"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GoogleSignInButton from "@/components/shared/GoogleSignInButton";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

type Props = { mode: "login" | "register"; rememberedEmails?: string[]; googleTempToken?: string; oauthError?: string };
const oauthMessages: Record<string,string> = {
  google_unavailable:"Google sign-in is not configured yet.",
  google_state_invalid:"Google sign-in could not be validated. Please try again.",
  google_exchange_failed:"Google could not complete sign-in. Please try again.",
  google_profile_failed:"Google account details could not be verified.",
  google_email_unverified:"Your Google email address must be verified before continuing.",
  google_account_conflict:"This Google email is linked to a different account type or identity. Use the correct existing sign-in method.",
  google_account_unavailable:"This client account is unavailable. Contact TGO DevStudio support.",
  google_sign_in_failed:"Google sign-in could not be completed. Please try again.",
  two_factor_expired:"Your two-factor sign-in session expired. Start sign-in again.",
};

export default function ClientAuthForm({ mode, rememberedEmails = [], googleTempToken = "", oauthError = "" }: Props) {
  const router = useRouter();
  const [email,setEmail] = useState(rememberedEmails[0] || "");
  const [password,setPassword] = useState("");
  const [showPassword,setShowPassword] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState(oauthMessages[oauthError] || "");
  const [message,setMessage] = useState("");
  const [canResend,setCanResend] = useState(false);
  const [tempToken,setTempToken] = useState(googleTempToken);
  const [twoFactorCode,setTwoFactorCode] = useState("");
  const [backupCodeMode,setBackupCodeMode] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage(""); setCanResend(false);
    try {
      if (mode === "register") {
        const response = await fetch("/api/client/register/request-verification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not send the verification link.");
        setMessage(data.message || "Check your inbox for the verification link.");
        return;
      }
      const response = await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,audience:"client"})});
      const data = await response.json();
      if (!response.ok) {
        setCanResend(data.error === "emailVerificationRequired" || data.code === "emailVerificationRequired");
        throw new Error(data.message || data.error || "Sign-in failed.");
      }
      if (data.status === "2fa_required") { setTempToken(data.tempToken); setMessage("Enter the authentication code from your authenticator app to finish signing in."); return; }
      router.replace("/client/dashboard"); router.refresh();
    } catch(cause) { setError(cause instanceof Error?cause.message:"Something went wrong."); }
    finally { setBusy(false); }
  }

  async function verifyTwoFactor(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response=await fetch("/api/auth/verify-2fa",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tempToken,code:twoFactorCode,isBackupCode:backupCodeMode})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.message||data.error||"Authentication code was not accepted.");
      router.replace("/client/dashboard");router.refresh();
    } catch(cause) {setError(cause instanceof Error?cause.message:"Two-factor verification failed.");}
    finally {setBusy(false);}
  }

  async function resendVerification() {
    setBusy(true);setError("");setMessage("");
    try {
      const response=await fetch("/api/client/resend-verification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||"Could not resend verification.");
      setMessage(data.message||"If an unverified client account exists, a verification email has been sent.");
      setCanResend(false);
    } catch(cause) {setError(cause instanceof Error?cause.message:"Could not resend verification.");}
    finally {setBusy(false);}
  }

  const inputClass="mt-2 w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10";
  const iconInputClass="mt-2 w-full rounded-xl border border-white/10 bg-white/[.06] py-3 pl-10 pr-12 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400";
  return <div className="mx-auto w-full max-w-lg">
    <div className="mb-8 text-center sm:text-left"><div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/15 text-violet-200 sm:mx-0"><ShieldCheck size={24}/></div><p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">TGO DevStudio · Client Portal</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{mode==="login"?"Welcome back":"Create your client account"}</h1><p className="mt-2 text-sm leading-6 text-slate-300">{mode==="login"?"Sign in to follow your requests and manage your relationship with TGO DevStudio.":"Start with your email address, or verify it instantly with Google. You will add your name and password in the next step."}</p></div>
    {error&&<div role="alert" className="mb-4 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm leading-5 text-rose-200">{error}</div>}
    {message&&<div role="status" className="mb-4 flex gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm leading-5 text-emerald-200"><CheckCircle2 size={18} className="shrink-0"/>{message}</div>}
    {tempToken?<form onSubmit={verifyTwoFactor} className="space-y-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/[.04] p-4"><h2 className="text-sm font-semibold text-white">Two-factor verification</h2><p className="text-xs leading-5 text-slate-400">{backupCodeMode?"Enter one of your unused backup codes.":"Enter the six-digit code from your authenticator app."}</p><input required autoFocus value={twoFactorCode} onChange={e=>setTwoFactorCode(e.target.value)} inputMode={backupCodeMode?"text":"numeric"} autoComplete="one-time-code" className={inputClass+" text-center text-lg tracking-[.3em]"} placeholder={backupCodeMode?"Backup code":"000000"}/><button disabled={busy} className="w-full rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?"Verifying…":"Verify and continue"}</button><button type="button" onClick={()=>{setBackupCodeMode(v=>!v);setTwoFactorCode("");}} className="w-full text-xs text-cyan-300 hover:underline">{backupCodeMode?"Use authenticator code instead":"Use a backup code instead"}</button><button type="button" onClick={()=>{setTempToken("");setTwoFactorCode("");setMessage("");}} className="w-full text-xs text-slate-400 hover:text-white">Back to sign in</button></form>:<form onSubmit={submit} className="space-y-4">
      <label className="block text-sm text-slate-200">Email address<div className="relative"><Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input required type="email" maxLength={254} value={email} onChange={e=>{setEmail(e.target.value);setCanResend(false);}} autoComplete="email" className={iconInputClass} placeholder="you@example.com"/></div></label>
      {mode==="login"&&<label className="block text-sm text-slate-200">Password<div className="relative"><LockKeyhole size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input required type={showPassword?"text":"password"} minLength={1} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" className={iconInputClass} placeholder="Your password"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>}
      <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:opacity-60">{busy?"Please wait…":mode==="login"?"Sign in to client portal":"Send email verification link"}<ArrowRight size={17}/></button>
    </form>}
    {mode==="login"&&!tempToken&&canResend&&<div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-4"><p className="text-sm font-semibold text-amber-100">Email verification required</p><p className="mt-1 text-xs leading-5 text-slate-300">You have an account that has not been verified yet. Resending sends a fresh, time-limited activation link to the email address above.</p><button type="button" disabled={busy||!email} onClick={resendVerification} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-300/15 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-300/20 disabled:opacity-50">{busy?"Sending…":"Resend verification email"}</button></div>}
    {!tempToken&&<div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[.2em] text-slate-500"><span className="h-px flex-1 bg-white/10"/>{mode==="register"?"or verify instantly with":"or continue with"}<span className="h-px flex-1 bg-white/10"/></div>}
    {!tempToken&&mode==="register"&&<div className="space-y-2"><GoogleSignInButton endpoint="/api/client/register/google" payload={{verifyOnly:true}} showRememberedAccount={false} onError={setError} onResult={()=>{setError("");router.replace("/client/register/complete");router.refresh();}}/><p className="text-center text-xs leading-5 text-slate-400">Google verifies your email securely. Your name and password are collected on the next screen. No separate email link is required.</p></div>}
    {!tempToken&&mode==="login"&&<GoogleSignInButton endpoint="/api/client/auth/google-login" onError={setError} onResult={data=>{setError("");if(data.status==="2fa_required"){setTempToken(data.tempToken);setMessage("Enter your two-factor authentication code to finish signing in.");return;}router.replace("/client/dashboard");router.refresh();}}/>}
    {!tempToken&&<p className="mt-6 text-center text-sm text-slate-400">{mode==="login"?"New to TGO DevStudio?":"Already have an account?"} <Link className="font-semibold text-cyan-300 hover:underline" href={mode==="login"?"/client/register":"/client/login"}>{mode==="login"?"Create an account":"Sign in"}</Link></p>}
    <p className="mt-6 text-center text-[11px] leading-5 text-slate-500">Your account is protected by TGO DevStudio identity and security controls.</p>
  </div>;
}
