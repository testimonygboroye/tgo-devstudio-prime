"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";
type Toast = { id: number; message: string; kind: "success"|"error"|"info"|"warning"; duration: number };
const styles = {
 success: "border-emerald-400/30 bg-slate-950 text-emerald-100",
 error: "border-rose-400/30 bg-slate-950 text-rose-100",
 info: "border-cyan-400/30 bg-slate-950 text-cyan-100",
 warning: "border-amber-400/30 bg-slate-950 text-amber-100"
};
export default function PlatformToastHost() {
 const [items,setItems] = useState<Toast[]>([]);
 useEffect(()=>{
  const timers = new Map<number,ReturnType<typeof setTimeout>>();
  const onToast = (event:Event) => {
   const detail=(event as CustomEvent).detail||{};
   const item:Toast={id:Date.now()+Math.random(),message:String(detail.message||"").slice(0,700),kind:["success","error","info","warning"].includes(detail.kind)?detail.kind:"info",duration:Math.min(10000,Math.max(1800,Number(detail.duration)||4200))};
   if(!item.message)return;
   setItems(old=>[...old.slice(-3),item]);
   timers.set(item.id,setTimeout(()=>{setItems(old=>old.filter(x=>x.id!==item.id));timers.delete(item.id);},item.duration));
  };
  window.addEventListener("tgo:toast",onToast);
  return()=>{window.removeEventListener("tgo:toast",onToast);timers.forEach(clearTimeout);};
 },[]);
 const dismiss=(id:number)=>setItems(old=>old.filter(x=>x.id!==id));
 return <div className="pointer-events-none fixed right-3 top-3 z-[10000] flex w-[min(92vw,390px)] flex-col gap-2 sm:right-5 sm:top-5" aria-live="polite" aria-atomic="false">
 {items.map(item=>{const Icon=item.kind==="success"?CheckCircle2:item.kind==="error"?CircleAlert:item.kind==="warning"?TriangleAlert:Info;return <div key={item.id} role={item.kind==="error"?"alert":"status"} className={"pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 shadow-2xl shadow-black/30 backdrop-blur-xl "+styles[item.kind]}><Icon size={19} className="mt-0.5 shrink-0"/><p className="min-w-0 flex-1 break-words text-sm leading-5">{item.message}</p><button onClick={()=>dismiss(item.id)} aria-label="Dismiss notification" className="rounded-lg p-1 opacity-70 hover:bg-white/10 hover:opacity-100"><X size={15}/></button></div>})}
 </div>;
}
