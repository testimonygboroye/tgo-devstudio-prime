"use client";
import { useState } from "react";
import TurnstileWidget from "@/components/public/TurnstileWidget";

const field = "mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400";
export default function DataDeletionRequestForm() {
  const [form,setForm]=useState({name:"",email:"",accountIdentifier:"",service:"client-portal",details:"",companyWebsite:""});
  const [token,setToken]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [reference,setReference]=useState("");
  async function submit(event:React.FormEvent){
    event.preventDefault();setError("");
    if(!token){setError("Complete the security verification first.");return;}
    setBusy(true);
    try{
      const response=await fetch("/api/privacy/deletion-requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,turnstileToken:token})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.message||"We could not submit your request.");
      setReference(String(data.reference||""));setForm({name:"",email:"",accountIdentifier:"",service:"client-portal",details:"",companyWebsite:""});setToken("");
    }catch(err){setError(err instanceof Error?err.message:"Request submission failed.");}
    finally{setBusy(false);}
  }
  if(reference)return <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6"><p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Request received</p><h3 className="mt-2 text-xl font-bold text-[var(--text-primary)]">Your reference: {reference}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Keep this reference number. Our team will review your request and may contact you to verify your identity before processing it.</p><button onClick={()=>setReference("")} className="mt-4 rounded-xl border border-emerald-300/30 px-4 py-2 text-sm font-semibold text-emerald-200">Submit another request</button></div>;
  return <form onSubmit={submit} className="space-y-4">
    <input tabIndex={-1} aria-hidden="true" autoComplete="off" className="hidden" value={form.companyWebsite} onChange={e=>setForm({...form,companyWebsite:e.target.value})}/>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-[var(--text-secondary)]">Full name<input required maxLength={120} className={field} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label className="text-sm text-[var(--text-secondary)]">Email address<input required type="email" maxLength={254} className={field} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-[var(--text-secondary)]">TGO service<select className={field} value={form.service} onChange={e=>setForm({...form,service:e.target.value})}><option value="client-portal">Client portal</option><option value="website">Public website</option><option value="whatsapp">WhatsApp communication</option><option value="other">Other TGO service</option></select></label><label className="text-sm text-[var(--text-secondary)]">Account identifier<input required maxLength={180} className={field} placeholder="Account email, phone number or request reference" value={form.accountIdentifier} onChange={e=>setForm({...form,accountIdentifier:e.target.value})}/></label></div>
    <label className="block text-sm text-[var(--text-secondary)]">Describe what you want us to locate or delete<textarea required minLength={15} maxLength={3000} rows={5} className={field} placeholder="Tell us which account, communication channel or information is involved. Do not include passwords or secret keys." value={form.details} onChange={e=>setForm({...form,details:e.target.value})}/></label>
    <TurnstileWidget onVerify={setToken} onExpire={()=>setToken("")}/>
    {error&&<p role="alert" className="text-sm text-rose-400">{error}</p>}
    <button disabled={busy||!token} className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?"Submitting securely…":"Submit privacy request"}</button>
    <p className="text-xs leading-5 text-[var(--text-muted)]">Submitting this form does not automatically delete information. We verify requests and assess legal, security and record-retention requirements before processing.</p>
  </form>;
}
