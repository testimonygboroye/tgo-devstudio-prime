"use client";
import { useEffect, useMemo, useState } from "react";
type Props={settings:{
 enabled?:boolean;launchDate?:string|Date|null;title?:string;description?:string;
 videoUrl?:string;flyerUrl?:string;afterLaunchVideoUrl?:string;afterLaunchFlyerUrl?:string;
 flyerSeconds?:number;videoDurationHours?:number;videoDurationMinutes?:number;videoDurationSeconds?:number;useVideoDurationOverride?:boolean;
}};
function remainingTime(target:number,now:number){
 let total=Math.max(0,Math.floor((target-now)/1000));
 const years=Math.floor(total/31536000);total%=31536000;
 const months=Math.floor(total/2592000);total%=2592000;
 const days=Math.floor(total/86400);total%=86400;
 const hours=Math.floor(total/3600);total%=3600;
 const minutes=Math.floor(total/60);total%=60;
 return {years,months,days,hours,minutes,seconds:total};
}
export default function LaunchExperience({settings}:Props){
 const [now,setNow]=useState(Date.now()),[mediaIndex,setMediaIndex]=useState(0);
 const target=useMemo(()=>settings.launchDate?new Date(settings.launchDate).getTime():0,[settings.launchDate]);
 const hasTarget=Boolean(target&&!Number.isNaN(target));
 const afterTarget=hasTarget&&now>=target;
 const video=afterTarget?settings.afterLaunchVideoUrl:settings.videoUrl;
 const image=afterTarget?settings.afterLaunchFlyerUrl:settings.flyerUrl;
 const media=useMemo(()=>[...(video?[{kind:"video" as const,url:video}]:[]),...(image?[{kind:"image" as const,url:image}]:[])],[video,image]);
 const current=media[mediaIndex]||null;
 const overrideSeconds=(settings.videoDurationHours||0)*3600+(settings.videoDurationMinutes||0)*60+(settings.videoDurationSeconds||0);
 const useOverride=Boolean(settings.useVideoDurationOverride&&overrideSeconds>0);
 const advance=()=>setMediaIndex(i=>media.length?(i+1)%media.length:0);
 useEffect(()=>{const id=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(id);},[]);
 useEffect(()=>{setMediaIndex(0);},[afterTarget,video,image]);
 useEffect(()=>{
  if(!current)return;
  if(current.kind==="video"&&!useOverride)return;
  const duration=current.kind==="video"?overrideSeconds:(settings.flyerSeconds||8);
  if(duration<=0)return;
  const timer=window.setTimeout(advance,duration*1000);
  return()=>window.clearTimeout(timer);
 },[mediaIndex,current?.kind,current?.url,useOverride,overrideSeconds,settings.flyerSeconds,media.length]);
 if(!settings.enabled)return null;
 const countdown=hasTarget&&!afterTarget?remainingTime(target,now):null;
 const units=countdown?[["Years",countdown.years],["Months",countdown.months],["Days",countdown.days],["Hours",countdown.hours],["Minutes",countdown.minutes],["Seconds",countdown.seconds]] as const:[];
 return <section className="relative overflow-hidden border-b border-base-800 bg-base-950 px-5 py-12 sm:px-10 sm:py-16">
  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(91,46,232,.22),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(46,197,240,.12),transparent_45%)]"/>
  <div className="relative mx-auto max-w-6xl">
   {(settings.title||settings.description)&&<div className="mx-auto max-w-3xl text-center"><span className="eyebrow-label">TGO DevStudio</span>{settings.title&&<h2 className="heading-premium mt-3 text-3xl font-bold brand-gradient-text sm:text-5xl">{settings.title}</h2>}{settings.description&&<p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">{settings.description}</p>}</div>}
   {current&&<div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-violet-950/30">
    {current.kind==="video"?<video key={current.url} src={current.url} autoPlay muted playsInline controls onEnded={advance} className="max-h-[68vh] w-full object-contain"/>:<img src={current.url} alt={settings.title||"TGO DevStudio homepage media"} className="max-h-[68vh] w-full object-contain"/>}
   </div>}
   {countdown&&<div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-brand-cyan-400/20 bg-white/[.035] p-4 sm:p-6"><p className="mb-4 text-center text-xs font-semibold uppercase tracking-[.22em] text-brand-cyan-300">Countdown</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">{units.map(([label,value])=><div key={label} className="rounded-xl border border-white/10 bg-black/30 px-2 py-3 text-center"><div className="font-mono text-2xl font-bold text-white sm:text-3xl">{String(value).padStart(2,"0")}</div><div className="mt-1 text-[10px] uppercase tracking-widest text-neutral-400 sm:text-xs">{label}</div></div>)}</div></div>}
  </div>
 </section>;
}
