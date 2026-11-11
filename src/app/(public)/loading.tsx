"use client";

import { useEffect, useState } from "react";
import { PUBLIC_SITE_SETTINGS_DEFAULTS } from "@/lib/constants/publicSiteDefaults";

import { Sparkles } from "lucide-react";

export default function PublicLoading(){
  const [settings,setSettings]=useState(PUBLIC_SITE_SETTINGS_DEFAULTS);
  useEffect(()=>{
    try{const cached=localStorage.getItem("tgo-public-site-settings");if(cached)setSettings(current=>({...current,...JSON.parse(cached)}));}catch{}
    const controller=new AbortController();
    fetch("/api/public-site-settings",{cache:"no-store",signal:controller.signal}).then(async response=>{if(!response.ok)return;const data=await response.json();if(data.settings&&!controller.signal.aborted){setSettings(current=>({...current,...data.settings}));try{localStorage.setItem("tgo-public-site-settings",JSON.stringify(data.settings));}catch{}}}).catch(()=>{});
    return()=>controller.abort();
  },[]);
  return (
    <main className="public-loading-state" aria-busy="true" aria-live="polite">
      <div className="public-loading-brand"><span><Sparkles size={19}/></span><div><b>{settings.loadingBrandLabel}</b><small>{settings.brandDescriptor}</small></div></div>
      <div className="public-loading-hero">
        <div className="public-loading-copy"><i className="public-skeleton public-skeleton-label"/><i className="public-skeleton public-skeleton-title"/><i className="public-skeleton public-skeleton-title short"/><i className="public-skeleton public-skeleton-text"/><i className="public-skeleton public-skeleton-text medium"/><div className="public-loading-actions"><i className="public-skeleton public-skeleton-button"/><i className="public-skeleton public-skeleton-button secondary"/></div></div>
        <div className="public-loading-visual"><i/><i/><i/><span/></div>
      </div>
      <div className="public-loading-sections"><i/><i/><i/></div>
      <p>{settings.loadingMessage}</p>
    </main>
  );
}
