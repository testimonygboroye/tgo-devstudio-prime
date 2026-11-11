"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Home, RefreshCw } from "lucide-react";
import { PUBLIC_SITE_SETTINGS_DEFAULTS } from "@/lib/constants/publicSiteDefaults";

export default function PublicError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  const [copy,setCopy]=useState(PUBLIC_SITE_SETTINGS_DEFAULTS);
  useEffect(()=>{
    console.error("Public site route error:",error);
    const controller=new AbortController();
    fetch("/api/public-site-settings",{cache:"no-store",signal:controller.signal}).then(async response=>{
      if(!response.ok)return;
      const data=await response.json();
      if(data.settings&&!controller.signal.aborted){setCopy(current=>({...current,...data.settings}));try{localStorage.setItem("tgo-public-site-settings",JSON.stringify(data.settings));}catch{}}
    }).catch(()=>{});
    return()=>controller.abort();
  },[error]);
  return(
    <main className="public-error-state">
      <div className="public-error-mark"><AlertTriangle size={27}/><span/></div>
      <span className="eyebrow-label">{copy.errorEyebrow}</span>
      <h1>{copy.errorHeadline}<br/><em>{copy.errorAccent}</em></h1>
      <p>{copy.errorDescription}</p>
      <div className="public-error-actions"><button type="button" onClick={()=>reset()} className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white"><RefreshCw size={16}/> {copy.errorRetryLabel}</button><Link href={copy.errorHomeHref} className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold" style={{color:"var(--text-primary)"}}><Home size={16}/> {copy.errorHomeLabel}</Link></div>
      <Link href={copy.errorContactHref} className="public-error-contact">{copy.errorContactLabel} <ArrowUpRight size={15}/></Link>
      {error.digest&&<small className="public-error-reference">Reference: {error.digest}</small>}
    </main>
  );
}
