"use client";
import {useEffect,useMemo,useState} from "react";
type Media={kind:"image"|"video";url:string;altText?:string;durationSeconds?:number};
type Ad={_id:string;title:string;description?:string;category:string;media:Media[];ctaLabel?:string;targetUrl?:string};
export default function AdvertisementSlot({placement,className=""}:{placement:string;className?:string}){
 const [ads,setAds]=useState<Ad[]>([]);const [indices,setIndices]=useState<Record<string,number>>({});
 useEffect(()=>{let alive=true;fetch("/api/advertisements?placement="+encodeURIComponent(placement),{cache:"no-store"}).then(r=>r.json()).then(d=>{if(alive&&d.status==="ok")setAds(d.items||[])}).catch(()=>{});return()=>{alive=false}},[placement]);
 if(!ads.length)return null;
 return <section aria-label="Sponsored content" className={"mx-auto my-10 w-full max-w-6xl px-4 sm:px-6 "+className}>
  <div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Sponsored</span><span className="text-[10px] text-slate-500">Featured partner content</span></div>
  <div className="grid gap-5">{ads.slice(0,1).map(ad=>{const media=ad.media||[];const index=(indices[ad._id]||0)%Math.max(1,media.length);const item=media[index];return <article key={ad._id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1024] shadow-[0_18px_55px_rgba(0,0,0,.22)]">
   {item&&<AdMedia key={ad._id+":"+index} item={item} onAdvance={()=>setIndices(old=>({...old,[ad._id]:(old[ad._id]||0)+1}))}/>}
   <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><span className="text-[9px] font-bold uppercase tracking-[.16em] text-cyan-300">{ad.category==="tgo"?"TGO promotion":ad.category==="partner"?"Partner feature":"Advertisement"}</span><h3 className="mt-1 text-lg font-semibold text-white">{ad.title}</h3>{ad.description&&<p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">{ad.description}</p>}</div>{ad.targetUrl&&<a href={ad.targetUrl} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex shrink-0 items-center justify-center rounded-full border border-cyan-300/30 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-300/10">{ad.ctaLabel||"Learn more"}</a>}</div>
  </article>})}</div>
 </section>
}
function AdMedia({item,onAdvance}:{item:Media;onAdvance:()=>void}){
 const [ratio,setRatio]=useState("16 / 9");const style={aspectRatio:ratio,maxHeight:"min(68vw, 680px)"};
 useEffect(()=>{if(item.kind==="image"){const img=new Image();img.onload=()=>setRatio(img.naturalWidth+" / "+img.naturalHeight);img.src=item.url;return}setRatio("16 / 9")},[item.url,item.kind]);
 useEffect(()=>{if(item.kind!=="image")return;const t=window.setTimeout(onAdvance,Math.max(1,item.durationSeconds||8)*1000);return()=>window.clearTimeout(t)},[item,onAdvance]);
 useEffect(()=>{if(!("mediaSession" in navigator))return;try{navigator.mediaSession.metadata=null;for(const action of ["play","pause","previoustrack","nexttrack","seekbackward","seekforward","seekto","stop"] as MediaSessionAction[]){try{navigator.mediaSession.setActionHandler(action,null)}catch{}}}catch{}},[]);
 return <div className="w-full overflow-hidden bg-black" style={style}>{item.kind==="video"?<video src={item.url} autoPlay muted playsInline preload="metadata" controls={false} disablePictureInPicture controlsList="nodownload noplaybackrate noremoteplayback" onEnded={onAdvance} onLoadedMetadata={e=>{const v=e.currentTarget;if(v.videoWidth&&v.videoHeight)setRatio(v.videoWidth+" / "+v.videoHeight)}} onContextMenu={e=>e.preventDefault()} className="h-full w-full object-cover"/>:<img src={item.url} alt={item.altText||"Sponsored visual"} className="h-full w-full object-cover" loading="lazy"/>}</div>
}
