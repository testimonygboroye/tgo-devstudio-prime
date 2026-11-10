"use client";
import {useCallback,useEffect,useState} from "react";
import {Network,Archive,RefreshCw} from "lucide-react";
type Row={id:string;name?:string;title?:string;departmentName?:string;status:string;level?:number;head?:string;managerName?:string};
type Directory={departments:Row[];teams:Row[];positions:Row[]};
export default function WorkforceStructureDirectory(){
 const [data,setData]=useState<Directory>({departments:[],teams:[],positions:[]});
 const [busy,setBusy]=useState("");const [error,setError]=useState("");
 const load=useCallback(async()=>{const response=await fetch("/api/platform/workforce",{cache:"no-store"});const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not load structure.");setData(result);},[]);
 useEffect(()=>{const timer=window.setTimeout(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Could not load structure."));},0);return()=>window.clearTimeout(timer);},[load]);
 async function toggle(type:string,row:Row){setBusy(row.id);setError("");try{const response=await fetch("/api/platform/workforce/structure/"+row.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,status:row.status==="active"?"archived":"active"})});const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not update record.");await load();}catch(e){setError(e instanceof Error?e.message:"Could not update record.");}finally{setBusy("");}}
 const groups=[{type:"department",label:"Departments",rows:data.departments.map(x=>({...x,title:x.name}))},{type:"team",label:"Teams",rows:data.teams.map(x=>({...x,title:x.name}))},{type:"position",label:"Positions",rows:data.positions}];
 return <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
  <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Network className="text-cyan-400"/><h2 className="font-semibold text-[var(--text-primary)]">Organizational structure</h2></div><button onClick={()=>void load()} aria-label="Refresh structure" className="rounded-lg border border-[var(--border-subtle)] p-2 text-[var(--text-secondary)]"><RefreshCw size={15}/></button></div>
  <p className="mt-1 text-xs text-[var(--text-muted)]">Departments form the top-level structure; teams and positions belong to a department. Archived records remain in history and cannot be selected for new assignments.</p>
  {error&&<p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>}
  <div className="mt-4 grid gap-4 lg:grid-cols-3">
   {groups.map(group=><div key={group.type} className="space-y-2">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{group.label} ({group.rows.length})</h3>
    {group.rows.length ? <div className="space-y-2">{group.rows.map(row=><article key={row.id} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--bg-surface-2)] p-3">
     <div className="min-w-0"><p className="truncate text-sm font-medium text-[var(--text-primary)]">{row.title}</p><p className="truncate text-[10px] text-[var(--text-muted)]">{row.departmentName||row.head||row.managerName||"Company-wide"}{row.level?" · Level "+row.level:""}</p><p className="text-[10px] uppercase text-cyan-300">{row.status}</p></div>
     <button disabled={busy===row.id} onClick={()=>void toggle(group.type,row)} title={row.status==="active"?"Archive":"Reactivate"} className="rounded-lg border border-[var(--border-subtle)] p-2 text-[var(--text-secondary)] disabled:opacity-40"><Archive size={14}/></button>
    </article>)}</div> : <p className="rounded-lg border border-dashed border-[var(--border-subtle)] p-4 text-xs text-[var(--text-muted)]">No records yet.</p>}
   </div>)}
  </div>
 </section>;
}
