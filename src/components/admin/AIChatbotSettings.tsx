"use client";
import { useCallback, useEffect, useState } from "react";
import { Bot, RefreshCw, Save, ShieldCheck, Activity } from "lucide-react";
import { notify } from "@/lib/platform/toast";
type Scope = "public" | "client" | "admin";
type Row = { scope: Scope; enabled: boolean; welcomeMessage: string };
type Provider = { id: string; name: string; provider: string; lastTestedModel: string };
const scopes: Array<{scope:Scope;title:string;description:string;welcome:string}> = [
 {scope:"public",title:"Public website assistant",description:"Answers public website, published services, company information and public navigation questions. It cannot access private client or staff records.",welcome:"Welcome to TGO DevStudio. How can I help?"},
 {scope:"client",title:"Client portal assistant",description:"Answers public questions and the authenticated client's own account information. It cannot access another client's data or perform business actions.",welcome:"Hello. How can I help with your TGO client account?"},
 {scope:"admin",title:"Internal admin assistant",description:"Provides read-only guidance for the signed-in authorised staff member. It cannot perform business operations or disclose another person's private records.",welcome:"Hello. How can I help with TGO operations?"},
];
export default function AIChatbotSettings(){
 const [rows,setRows]=useState<Row[]>(scopes.map(item=>({scope:item.scope,enabled:false,welcomeMessage:item.welcome})));
 const [providers,setProviders]=useState<Provider[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  setLoading(true);
  try{
   const response=await fetch("/api/platform/ai-chatbots/config",{cache:"no-store"});
   const data=await response.json();if(!response.ok)throw new Error(data.message||"Could not load assistant settings.");
   setProviders(data.providers||[]);
   setRows(scopes.map(item=>{const saved=(data.configs||[]).find((row:Row)=>row.scope===item.scope);return {scope:item.scope,enabled:Boolean(saved?.enabled),welcomeMessage:saved?.welcomeMessage||item.welcome};}));
  }catch(error){notify(error instanceof Error?error.message:"Could not load assistant settings.","error");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 function update(scope:Scope,patch:Partial<Row>){setRows(current=>current.map(row=>row.scope===scope?{...row,...patch}:row));}
 async function save(){
  setBusy(true);
  try{
   const response=await fetch("/api/platform/ai-chatbots/config",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({configs:rows})});
   const data=await response.json();if(!response.ok)throw new Error(data.message||"Could not save assistant settings.");
   notify(data.message||"Assistant settings saved.","success");await load();
  }catch(error){notify(error instanceof Error?error.message:"Could not save assistant settings.","error");}
  finally{setBusy(false);}
 }
 return <div className="space-y-5">
  <header className="rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_85%_10%,rgba(46,197,240,.2),transparent_30%),linear-gradient(125deg,#10162f,#211647_55%,#101b35)] p-6 text-white sm:p-8">
   <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><Bot size={16}/> AI experience governance</div>
   <h1 className="mt-3 text-3xl font-bold">Three dedicated assistants</h1>
   <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Public, client and admin assistants use the same TGO-owned global model ranking. TGO automatically chooses the highest-ranked available model across every enabled, live-tested provider and falls back across providers when a model fails. No assistant is pinned to one primary provider.</p>
  </header>
  <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
   <div className="flex items-center justify-between gap-3"><div><p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"><Activity size={16} className="text-cyan-400"/> Global provider pool</p><p className="mt-1 text-xs text-[var(--text-muted)]">Only enabled providers that passed a live-generation test are eligible.</p></div><button onClick={()=>void load()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 text-xs"><RefreshCw size={14}/> Refresh</button></div>
   <div className="mt-3 flex flex-wrap gap-2">{providers.map(provider=><span key={provider.id} className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">{provider.name} · {provider.lastTestedModel||"model catalogue"}</span>)}{!providers.length&&<p className="text-xs text-amber-300">No enabled, live-tested provider is available. Run a live-generation test in AI Workforce to activate the provider pool.</p>}</div>
  </section>
  {loading?<div className="rounded-2xl border border-[var(--border-subtle)] p-8 text-sm text-[var(--text-secondary)]">Loading assistant configuration…</div>:<div className="space-y-4">{rows.map(row=>{const meta=scopes.find(item=>item.scope===row.scope)!;return <section key={row.scope} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-[var(--text-primary)]">{meta.title}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{meta.description}</p></div><label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={row.enabled} onChange={event=>update(row.scope,{enabled:event.target.checked})}/> Enabled</label></div><label className="mt-4 block text-xs font-medium text-[var(--text-secondary)]">Welcome message<input className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-2.5 text-sm text-[var(--text-primary)]" maxLength={300} value={row.welcomeMessage} onChange={event=>update(row.scope,{welcomeMessage:event.target.value})}/></label><div className="mt-4 flex items-start gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3 text-xs leading-5 text-[var(--text-secondary)]"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-cyan-300"/>Provider routing is automatic and globally ranked. Audience policy and conversation history remain separate for this assistant.</div></section>})}</div>}
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4"><p className="max-w-2xl text-xs leading-5 text-[var(--text-secondary)]">Assistants are read-only. They cannot create, edit, approve, publish, send, refund or change business records. Client data remains scoped to the authenticated client.</p><button onClick={()=>void save()} disabled={busy||loading} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16}/>{busy?"Saving…":"Save assistant settings"}</button></div>
 </div>;
}
