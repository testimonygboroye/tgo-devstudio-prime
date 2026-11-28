"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Clock3, Pause, Play, RefreshCw, Save, ShieldCheck } from "lucide-react";

type Agent = { id:string; name:string; role:string; department:string; enabled:boolean; operationalStatus:string; providerId:string; modelName:string; readinessIssues:string[] };
type Schedule = { id:string; agentId:string; title:string; prompt:string; intervalMinutes:number; enabled:boolean; nextRunAt:string; lastRunAt:string|null; lastTaskId:string|null; lastError:string };
type Data = { agents:Agent[]; schedules:Schedule[] };

const input = "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/50";
const intervalLabel = (minutes:number) => minutes < 60 ? `Every ${minutes} minutes` : minutes % 1440 === 0 ? `Every ${minutes/1440} day(s)` : `Every ${minutes/60} hour(s)`;
const dateLabel = (value?:string|null) => value ? new Date(value).toLocaleString() : "Not run yet";

export default function AIAutomationScheduler() {
  const [data,setData] = useState<Data>({agents:[],schedules:[]});
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [form,setForm] = useState({agentId:"",title:"Daily operational review",prompt:"Review the information explicitly provided in this task. Produce a concise report with findings, risks, recommended next steps and decisions that require founder approval. Do not claim to have accessed external systems or live data.",intervalMinutes:1440});

  const load = useCallback(async(silent=false) => {
    try {
      const response = await fetch("/api/platform/ai-automation",{cache:"no-store"});
      const json = await response.json();
      if(!response.ok) throw new Error(json.error || "Could not load AI automation schedules.");
      setData({agents:json.agents||[],schedules:json.schedules||[]});
      setError("");
    } catch(e) { setError(e instanceof Error?e.message:"Could not load AI automation schedules."); }
    finally { if(!silent) setLoading(false); }
  },[]);

  useEffect(()=>{
    void load();
    const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void load(true);},5000);
    const onVisible=()=>{if(document.visibilityState==="visible")void load(true);};
    document.addEventListener("visibilitychange",onVisible);
    return ()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",onVisible);};
  },[load]);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setNotice("");setError("");
    try {
      const response=await fetch("/api/platform/ai-automation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const json=await response.json();
      if(!response.ok) throw new Error(json.error||"Could not save automation schedule.");
      setNotice("Recurring schedule saved. The first run will be picked up by the scheduler on its next five-minute cycle.");
      await load(true);
    } catch(e) {setError(e instanceof Error?e.message:"Could not save automation schedule.");}
    finally {setBusy(false);}
  }

  async function toggle(schedule:Schedule) {
    setBusy(true);setNotice("");setError("");
    try {
      const response=await fetch("/api/platform/ai-automation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:schedule.enabled?"disable":"enable",scheduleId:schedule.id})});
      const json=await response.json();if(!response.ok)throw new Error(json.error||"Could not update schedule.");
      setNotice(schedule.enabled?"Automation paused.":"Automation resumed.");await load(true);
    } catch(e){setError(e instanceof Error?e.message:"Could not update schedule.");}
    finally{setBusy(false);}
  }

  const eligible=data.agents.filter(a=>a.enabled&&a.operationalStatus==="ready"&&a.providerId&&a.modelName);
  return <section className="space-y-4 rounded-2xl border border-cyan-400/20 bg-slate-950/50 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-cyan-300"><Clock3 size={15}/> Recurring AI employee automation</p><h2 className="mt-1 text-lg font-semibold text-white">Scheduled work and automatic reports</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">Set a recurring text-only assignment for an enabled, readiness-verified employee with an exact tested provider/model. The scheduler checks every five minutes. Scheduled runs cannot publish, send messages, spend money, change records or deploy; those actions remain approval-gated.</p></div>
      <button type="button" onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300"><RefreshCw size={14}/> Refresh</button>
    </div>
    {error&&<div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</div>}
    {notice&&<div role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</div>}
    <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
      <form onSubmit={submit} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
        <h3 className="font-semibold text-white">Create or update a schedule</h3>
        <label className="block text-xs text-slate-400">AI employee<select className={input+" mt-1"} required value={form.agentId} onChange={e=>setForm({...form,agentId:e.target.value})}><option value="">Select a ready employee</option>{eligible.map(a=><option key={a.id} value={a.id}>{a.name} · {a.department}</option>)}</select></label>
        <label className="block text-xs text-slate-400">Task title<input className={input+" mt-1"} required maxLength={180} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
        <label className="block text-xs text-slate-400">Instructions<textarea className={input+" mt-1 min-h-32"} required minLength={20} maxLength={12000} value={form.prompt} onChange={e=>setForm({...form,prompt:e.target.value})}/></label>
        <label className="block text-xs text-slate-400">Repeat<select className={input+" mt-1"} value={form.intervalMinutes} onChange={e=>setForm({...form,intervalMinutes:Number(e.target.value)})}><option value={15}>Every 15 minutes</option><option value={30}>Every 30 minutes</option><option value={60}>Every hour</option><option value={360}>Every 6 hours</option><option value={720}>Every 12 hours</option><option value={1440}>Daily</option><option value={10080}>Weekly</option></select></label>
        <button disabled={busy||eligible.length===0} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"><Save size={16}/> Save recurring assignment</button>
        {eligible.length===0&&<p className="text-xs text-amber-200">No AI employees currently meet the operational requirements. Verify the employee's provider/model and readiness first.</p>}
      </form>
      <div className="space-y-3">
        <h3 className="font-semibold text-white">Current schedules <span className="text-xs font-normal text-slate-500">· auto-refreshes every 5 seconds</span></h3>
        {loading?<p className="text-sm text-slate-400">Loading schedules…</p>:data.schedules.length===0?<p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-400">No recurring schedules configured yet.</p>:data.schedules.map(schedule=>{
          const agent=data.agents.find(a=>a.id===schedule.agentId);
          return <article key={schedule.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-white">{schedule.title}</p><p className="mt-1 text-xs text-slate-400">{agent?.name||"AI employee"} · {intervalLabel(schedule.intervalMinutes)}</p></div><span className={"rounded-full px-2 py-1 text-[10px] uppercase "+(schedule.enabled?"bg-emerald-400/10 text-emerald-300":"bg-slate-700 text-slate-300")}>{schedule.enabled?"Active":"Paused"}</span></div>
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-slate-400">{schedule.prompt}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500"><p>Next run: <span className="block text-slate-300">{dateLabel(schedule.nextRunAt)}</span></p><p>Last run: <span className="block text-slate-300">{dateLabel(schedule.lastRunAt)}</span></p></div>
            {schedule.lastError&&<p className="mt-2 rounded-lg bg-rose-400/10 p-2 text-xs text-rose-200">Last issue: {schedule.lastError}</p>}
            <button type="button" disabled={busy} onClick={()=>void toggle(schedule)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200">{schedule.enabled?<><Pause size={14}/> Pause automation</>:<><Play size={14}/> Resume automation</>}</button>
          </article>;
        })}
      </div>
    </div>
    <div className="flex items-start gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3 text-xs leading-5 text-emerald-100"><ShieldCheck size={16} className="mt-0.5 shrink-0"/> Every scheduled run is recorded in the AI task history and provider diagnostics. Provider failures, disabled employees, readiness failures and daily token-budget limits are reported rather than silently marked complete.</div>
  </section>;
}
