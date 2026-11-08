"use client";
import { useEffect, useMemo, useState } from "react";

type Props = { settings: {
 enabled?: boolean; launchDate?: string | Date | null; title?: string; description?: string;
 videoUrl?: string; flyerUrl?: string; afterLaunchVideoUrl?: string; afterLaunchFlyerUrl?: string;
 videoSeconds?: number; flyerSeconds?: number;
} };
function getRemaining(target: number, now: number) {
 let seconds=Math.max(0,Math.floor((target-now)/1000));
 const years=Math.floor(seconds/31536000); seconds%=31536000;
 const months=Math.floor(seconds/2592000); seconds%=2592000;
 const days=Math.floor(seconds/86400); seconds%=86400;
 const hours=Math.floor(seconds/3600); seconds%=3600;
 const minutes=Math.floor(seconds/60); seconds%=60;
 return {years,months,days,hours,minutes,seconds};
}
export default function LaunchExperience({settings}:Props) {
 const [now,setNow]=useState(Date.now());
 const [mediaIndex,setMediaIndex]=useState(0);
 const target=useMemo(()=>settings.launchDate?new Date(settings.launchDate).getTime():0,[settings.launchDate]);
 const launched=Boolean(target && now>=target);
 const video=launched ? settings.afterLaunchVideoUrl : settings.videoUrl;
 const flyer=launched ? settings.afterLaunchFlyerUrl : settings.flyerUrl;
 const media=[...(video?[{type:"video" as const,url:video}]:[]),...(flyer?[{type:"image" as const,url:flyer}]:[])];
 useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer);},[]);
 useEffect(()=>{setMediaIndex(0);},[launched,video,flyer]);
 useEffect(()=>{
  if(media.length<2)return;
  const seconds=media[mediaIndex]?.type==="video"?(settings.videoSeconds||8):(settings.flyerSeconds||8);
  const timer=window.setTimeout(()=>setMediaIndex(i=>(i+1)%media.length),Math.max(1,seconds)*1000);
  return()=>window.clearTimeout(timer);
 },[mediaIndex,media.length,settings.videoSeconds,settings.flyerSeconds,launched]);
 if(!settings.enabled && !launched)return null;
 const remaining=target?getRemaining(target,now):null;
 const units=remaining?[["Years",remaining.years],["Months",remaining.months],["Days",remaining.days],["Hours",remaining.hours],["Minutes",remaining.minutes],["Seconds",remaining.seconds]] as const:[];
 const current=media.length?media[mediaIndex%media.length]:null;
 return <section className="relative overflow-hidden border-b border-base-800 bg-base-950 px-5 py-12 sm:px-10 sm:py-16">
  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(91,46,232,.22),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(46,197,240,.12),transparent_45%)]"/>
  <div className="relative mx-auto max-w-6xl">
   <div className="mx-auto max-w-3xl text-center"><span className="eyebrow-label">{launched?"Now Live":"A New Experience Is Coming"}</span><h2 className="heading-premium mt-3 text-3xl font-bold brand-gradient-text sm:text-5xl">{launched?"Welcome to the next chapter":settings.title||"Something exceptional is launching"}</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">{launched?"Explore the TGO DevStudio experience.":settings.description}</p></div>
   {current&&<div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-violet-950/30">
    {current.type==="video"?<video key={current.url} src={current.url} autoPlay muted playsInline controls loop className="max-h-[68vh] w-full object-contain"/>:<img src={current.url} alt={launched?"TGO DevStudio launch artwork":"TGO DevStudio launch announcement"} className="max-h-[68vh] w-full object-contain"/>}
   </div>}
   {!launched&&remaining&&<div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-brand-cyan-400/20 bg-white/[0.035] p-4 sm:p-6"><p className="mb-4 text-center text-xs font-semibold uppercase tracking-[.22em] text-brand-cyan-300">Launch countdown</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">{units.map(([label,value])=><div key={label} className="rounded-xl border border-white/10 bg-black/30 px-2 py-3 text-center"><div className="font-mono text-2xl font-bold text-white sm:text-3xl">{String(value).padStart(2,"0")}</div><div className="mt-1 text-[10px] uppercase tracking-widest text-neutral-400 sm:text-xs">{label}</div></div>)}</div></div>}
  </div>
 </section>;
}
