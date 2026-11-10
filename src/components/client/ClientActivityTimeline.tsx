"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, CircleAlert } from "lucide-react";

type Item={id:string;action:string;summary:string;actorType:string;createdAt:string};
const filters=[{id:"all",label:"Overview"},{id:"account",label:"Account"},{id:"communication",label:"Communication"},{id:"projects",label:"Projects"},{id:"finance",label:"Finance"},{id:"security",label:"Security"}];
function belongs(item:Item,filter:string) {
  if(filter==="all")return true;
  const action=item.action.toLowerCase();
  const patterns:Record<string,string[]>={account:["account","profile","email","phone","client."],communication:["enquiry","support","notification","message","reply"],projects:["project","service","order","deliverable","milestone"],finance:["payment","invoice","receipt","refund","credit","finance"],security:["login","password","two_factor","session","security","verification"]};
  return (patterns[filter]||[]).some(word=>action.includes(word));
}
export default function ClientActivityTimeline(){
 const [items,setItems]=useState<Item[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [activeFilter,setActiveFilter]=useState("all");const filterBar=useRef<HTMLDivElement>(null);const scrollLeft=useRef(0);
 useEffect(()=>{let active=true;fetch("/api/client/activity",{cache:"no-store"}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||"Activity could not be loaded.");return data;}).then(data=>{if(active)setItems(data.activities||[]);}).catch(c=>{if(active)setError(c instanceof Error?c.message:"Activity could not be loaded.");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 const visible=useMemo(()=>items.filter(item=>belongs(item,activeFilter)),[items,activeFilter]);
 function selectFilter(id:string){scrollLeft.current=filterBar.current?.scrollLeft||0;setActiveFilter(id);requestAnimationFrame(()=>{if(filterBar.current)filterBar.current.scrollLeft=scrollLeft.current;});}
 return <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5 sm:p-6">
  <div className="flex items-center gap-3"><span className="rounded-xl bg-cyan-400/10 p-3 text-cyan-200"><Activity size={19}/></span><div><h2 className="font-bold text-white">Your account timeline</h2><p className="text-xs text-slate-400">A chronological record of important account interactions.</p></div></div>
  <div ref={filterBar} className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">{filters.map(filter=><button key={filter.id} type="button" aria-pressed={activeFilter===filter.id} onClick={()=>selectFilter(filter.id)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${activeFilter===filter.id?"border-violet-300/50 bg-violet-500/25 text-white shadow-[0_0_18px_rgba(139,92,246,.18)]":"border-white/10 bg-white/[.03] text-slate-400 hover:border-white/20 hover:bg-white/[.07] hover:text-white"}`}>{filter.label}</button>)}</div>
  {error&&<p role="alert" className="mt-4 flex items-center gap-2 text-sm text-rose-200"><CircleAlert size={15}/>{error}</p>}
  {loading?<p className="mt-5 text-sm text-slate-400">Loading activity…</p>:<div className="mt-4 space-y-5">{visible.length?visible.map(item=><article key={item.id} className="relative flex gap-4"><span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><Activity size={14}/></span><div className="min-w-0 flex-1 border-b border-white/5 pb-4"><p className="text-sm font-medium text-slate-100">{item.summary}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{item.actorType} · {item.action.replaceAll("_"," ")}</p><p className="mt-1 text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</p></div></article>):<div className="py-12 text-center"><Activity className="mx-auto text-slate-500"/><p className="mt-3 text-sm font-semibold text-white">{items.length?"No activity in this category":"No activity recorded yet"}</p><p className="mt-1 text-xs text-slate-400">{items.length?"Choose another filter to see more activity.":"Your account events will appear here as you use the portal."}</p></div>}</div>}
 </section>;
}
