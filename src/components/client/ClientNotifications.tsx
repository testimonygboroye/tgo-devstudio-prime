"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

type Notice={id:string;title:string;body:string;href:string;readAt:string|null;createdAt:string};
export default function ClientNotifications(){
 const [items,setItems]=useState<Notice[]>([]);const [error,setError]=useState("");
 useEffect(()=>{let active=true;fetch("/api/client/notifications",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(active)setItems(d.notifications||[]);}).catch(()=>{if(active)setError("Notifications could not be loaded.");});return()=>{active=false;};},[]);
 async function mark(id?:string){const body=id?{id}:{markAllRead:true};const r=await fetch("/api/client/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});if(r.ok)setItems(v=>v.map(n=>!id||n.id===id?{...n,readAt:new Date().toISOString()}:n));}
 const unread=items.filter(n=>!n.readAt).length;
 return <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Bell className="text-cyan-300"/><div><h2 className="font-bold text-white">Notifications</h2><p className="text-xs text-slate-400">{unread} unread</p></div></div>{unread>0&&<button onClick={()=>mark()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300"><CheckCheck size={14}/>Mark all read</button>}</div>{error&&<p role="alert" className="mt-4 text-sm text-rose-200">{error}</p>}<div className="mt-5 space-y-2">{items.length?items.map(n=><article key={n.id} className={`rounded-xl border p-4 ${n.readAt?"border-white/5 bg-black/10":"border-cyan-300/20 bg-cyan-300/[.05]"}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-white">{n.title}</h3><p className="mt-1 text-xs leading-5 text-slate-400">{n.body}</p><p className="mt-2 text-[10px] text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>{n.href&&<Link href={n.href} className="mt-2 inline-block text-xs text-cyan-300 hover:underline">View details</Link>}</div>{!n.readAt&&<button onClick={()=>mark(n.id)} className="shrink-0 text-[10px] text-cyan-300">Mark read</button>}</div></article>):<div className="py-14 text-center"><Bell className="mx-auto text-slate-500"/><p className="mt-3 text-sm text-white">You&apos;re all caught up</p><p className="mt-1 text-xs text-slate-400">Important account updates will appear here.</p></div>}</div></section>;
}
