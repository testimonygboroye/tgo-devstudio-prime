"use client";
import { useEffect, useState } from "react";
type FormState={enabled:boolean;launchDate:string;title:string;description:string;videoUrl:string;flyerUrl:string;afterLaunchVideoUrl:string;afterLaunchFlyerUrl:string;videoSeconds:number;flyerSeconds:number};
const empty:FormState={enabled:false,launchDate:"",title:"Something exceptional is launching",description:"A new chapter in intelligent digital experiences is almost here.",videoUrl:"",flyerUrl:"",afterLaunchVideoUrl:"",afterLaunchFlyerUrl:"",videoSeconds:8,flyerSeconds:8};
const fields:[keyof FormState,string,string][]=[["videoUrl","Coming-soon ad video","video"],["flyerUrl","Launch announcement flyer","image"],["afterLaunchVideoUrl","Permanent homepage video (optional)","video"],["afterLaunchFlyerUrl","Permanent homepage flyer (optional)","image"]];
export default function LaunchControlClient(){
 const [form,setForm]=useState<FormState>(empty),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[uploading,setUploading]=useState(""),[message,setMessage]=useState(""),[error,setError]=useState("");
 useEffect(()=>{(async()=>{try{const r=await fetch("/api/launch-settings");const d=await r.json();if(d.settings){const date=d.settings.launchDate?new Date(d.settings.launchDate):null;setForm({...empty,...d.settings,launchDate:date&&!Number.isNaN(date.getTime())?new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16):""});}}catch{setError("Could not load launch settings.");}finally{setLoading(false);}})();},[]);
 function set<K extends keyof FormState>(key:K,value:FormState[K]){setForm(old=>({...old,[key]:value}));}
 async function upload(key:keyof FormState,file?:File){if(!file)return;setUploading(key);setError("");setMessage("");try{const data=new FormData();data.append("file",file);data.append("folder","launch");const r=await fetch("/api/media/upload",{method:"POST",body:data});const result=await r.json();if(!r.ok)throw new Error(result.message||"Upload failed.");set(key,result.url as never);setMessage(file.name+" uploaded successfully.");}catch(e){setError(e instanceof Error?e.message:"Upload failed.");}finally{setUploading("");}}
 async function save(){setSaving(true);setError("");setMessage("");try{const r=await fetch("/api/launch-settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,launchDate:form.launchDate?new Date(form.launchDate).toISOString():null})});const d=await r.json();if(!r.ok)throw new Error(d.message||"Could not save launch settings.");setMessage("Launch settings saved.");}catch(e){setError(e instanceof Error?e.message:"Save failed.");}finally{setSaving(false);}}
 if(loading)return <p className="text-neutral-400">Loading launch settings…</p>;
 return <div className="max-w-3xl space-y-6">
  <div className="rounded-2xl border border-brand-cyan-400/20 bg-brand-cyan-400/5 p-4 text-sm text-neutral-300">Upload an animated launch video and/or flyer. The public site displays the video and flyer in rotation, then changes to the permanent media after the launch date. The countdown updates every second and includes years, months, days, hours, minutes and seconds.</div>
  <label className="flex items-center gap-3 rounded-xl border border-base-800 bg-base-900 p-4"><input type="checkbox" checked={form.enabled} onChange={e=>set("enabled",e.target.checked)} className="h-5 w-5 accent-cyan-400"/><span><strong className="block text-neutral-100">Enable launch showcase</strong><span className="text-xs text-neutral-400">Turn the launch section on or off independently of the homepage hero.</span></span></label>
  <section className="space-y-4 rounded-2xl border border-base-800 bg-base-950 p-5">
   <h2 className="text-lg font-semibold text-neutral-100">Launch announcement</h2>
   <label className="block text-sm text-neutral-400">Launch date and time<input type="datetime-local" value={form.launchDate} onChange={e=>set("launchDate",e.target.value)} className="mt-1 w-full rounded-lg border border-base-700 bg-base-900 px-3 py-3 text-neutral-100"/></label>
   <label className="block text-sm text-neutral-400">Announcement title<input value={form.title} onChange={e=>set("title",e.target.value)} className="mt-1 w-full rounded-lg border border-base-700 bg-base-900 px-3 py-3 text-neutral-100"/></label>
   <label className="block text-sm text-neutral-400">Description<textarea rows={3} value={form.description} onChange={e=>set("description",e.target.value)} className="mt-1 w-full rounded-lg border border-base-700 bg-base-900 px-3 py-3 text-neutral-100"/></label>
  </section>
  <section className="space-y-4 rounded-2xl border border-base-800 bg-base-950 p-5">
   <h2 className="text-lg font-semibold text-neutral-100">Launch and permanent media</h2>
   {fields.map(([key,label,kind])=><div key={key} className="space-y-2 border-b border-base-800 pb-4 last:border-0">
    <label className="block text-sm font-medium text-neutral-300">{label}</label>
    <input type="file" accept={kind==="video"?"video/mp4,video/webm,video/quicktime":"image/jpeg,image/png,image/webp,image/avif"} onChange={e=>void upload(key,e.target.files?.[0])} className="block w-full text-xs text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-base-800 file:px-3 file:py-2 file:text-neutral-100"/>
    {uploading===key&&<p className="text-xs text-cyan-300">Uploading…</p>}
    <input value={String(form[key]||"")} onChange={e=>set(key,e.target.value as never)} placeholder="Or paste a secure media URL" className="w-full rounded-lg border border-base-700 bg-base-900 px-3 py-2 text-sm text-neutral-100"/>
    {form[key]&&<p className="break-all text-xs text-neutral-500">{String(form[key])}</p>}
   </div>)}
   <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-neutral-400">Video display seconds<input type="number" min="1" max="60" value={form.videoSeconds} onChange={e=>set("videoSeconds",Number(e.target.value))} className="mt-1 w-full rounded-lg border border-base-700 bg-base-900 px-3 py-2 text-neutral-100"/></label><label className="text-sm text-neutral-400">Flyer display seconds<input type="number" min="1" max="60" value={form.flyerSeconds} onChange={e=>set("flyerSeconds",Number(e.target.value))} className="mt-1 w-full rounded-lg border border-base-700 bg-base-900 px-3 py-2 text-neutral-100"/></label></div>
  </section>
  {error&&<p role="alert" className="text-sm text-red-400">{error}</p>}{message&&<p className="text-sm text-cyan-300">{message}</p>}
  <button onClick={save} disabled={saving||Boolean(uploading)} className="rounded-full brand-gradient-bg px-6 py-3 font-semibold text-base-950 disabled:opacity-50">{saving?"Saving…":"Save launch settings"}</button>
 </div>;
}
