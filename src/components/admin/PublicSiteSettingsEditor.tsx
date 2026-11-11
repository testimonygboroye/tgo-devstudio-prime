"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Save, AlertCircle, RotateCcw } from "lucide-react";
import { PUBLIC_SITE_SETTINGS_DEFAULTS } from "@/lib/constants/publicSiteDefaults";

type Settings = Record<string, unknown>;
type JsonField = "navigationGroups" | "footerSections" | "socialLinks";

const inputClass = "mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-cyan-400";
const labelClass = "block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]";

export default function PublicSiteSettingsEditor() {
  const [settings,setSettings] = useState<Settings>({ ...PUBLIC_SITE_SETTINGS_DEFAULTS });
  const [jsonFields,setJsonFields] = useState<Record<JsonField,string>>({
    navigationGroups: JSON.stringify(PUBLIC_SITE_SETTINGS_DEFAULTS.navigationGroups,null,2),
    footerSections: JSON.stringify(PUBLIC_SITE_SETTINGS_DEFAULTS.footerSections,null,2),
    socialLinks: JSON.stringify(PUBLIC_SITE_SETTINGS_DEFAULTS.socialLinks,null,2),
  });
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");

  useEffect(()=>{
    let active=true;
    fetch("/api/public-site-settings",{cache:"no-store"}).then(async response=>{
      const data=await response.json();
      if(!response.ok)throw new Error(data.message||"Could not load site settings.");
      if(!active||!data.settings)return;
      setSettings(data.settings);
      setJsonFields({
        navigationGroups:JSON.stringify(data.settings.navigationGroups||[],null,2),
        footerSections:JSON.stringify(data.settings.footerSections||[],null,2),
        socialLinks:JSON.stringify(data.settings.socialLinks||[],null,2),
      });
    }).catch(err=>{if(active)setError(err instanceof Error?err.message:"Could not load site settings.");}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[]);

  const update=(field:string,value:string|boolean)=>setSettings(current=>({...current,[field]:value}));
  const updateJson=(field:JsonField,value:string)=>setJsonFields(current=>({...current,[field]:value}));

  async function save(){
    setSaving(true);setError("");setMessage("");
    try{
      const payload:Settings={...settings};
      for(const field of ["navigationGroups","footerSections","socialLinks"] as JsonField[]){
        const parsed=JSON.parse(jsonFields[field]);
        if(!Array.isArray(parsed))throw new Error(field+" must be a JSON array.");
        payload[field]=parsed;
      }
      const response=await fetch("/api/public-site-settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.message||"Could not save site settings.");
      setSettings(data.settings);
      setJsonFields({
        navigationGroups:JSON.stringify(data.settings.navigationGroups||[],null,2),
        footerSections:JSON.stringify(data.settings.footerSections||[],null,2),
        socialLinks:JSON.stringify(data.settings.socialLinks||[],null,2),
      });
      setMessage("Global website settings saved. The public header and footer will refresh.");
    }catch(err){setError(err instanceof Error?err.message:"Could not save site settings.");}
    finally{setSaving(false);}
  }

  function resetLocal(){
    setSettings({...PUBLIC_SITE_SETTINGS_DEFAULTS});
    setJsonFields({
      navigationGroups:JSON.stringify(PUBLIC_SITE_SETTINGS_DEFAULTS.navigationGroups,null,2),
      footerSections:JSON.stringify(PUBLIC_SITE_SETTINGS_DEFAULTS.footerSections,null,2),
      socialLinks:JSON.stringify(PUBLIC_SITE_SETTINGS_DEFAULTS.socialLinks,null,2),
    });
    setMessage("Defaults loaded into the editor. Save to publish them.");
    setError("");
  }

  if(loading)return <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-sm text-[var(--text-secondary)]"><Loader2 className="animate-spin" size={18}/>Loading global website settings…</div>;

  const textField=(field:string,label:string,placeholder="")=><label className={labelClass}>{label}<input className={inputClass} value={String(settings[field]??"")} placeholder={placeholder} onChange={event=>update(field,event.target.value)}/></label>;
  const toggle=(field:string,label:string)=><label className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-primary)]"><span>{label}</span><input type="checkbox" checked={Boolean(settings[field])} onChange={event=>update(field,event.target.checked)} className="h-4 w-4 accent-cyan-400"/></label>;
  const jsonEditor=(field:JsonField,title:string,description:string)=><section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"><div className="mb-3"><h3 className="font-semibold text-[var(--text-primary)]">{title}</h3><p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{description}</p></div><textarea spellCheck={false} className={inputClass+" min-h-64 resize-y font-mono text-xs leading-relaxed"} value={jsonFields[field]} onChange={event=>updateJson(field,event.target.value)}/></section>;

  return <div className="space-y-7">
    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-500/10 via-cyan-400/5 to-transparent p-5"><p className="text-sm font-semibold text-[var(--text-primary)]">One control centre for the public site.</p><p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">Changes here control the public brand identity, logo, announcement strip, navigation, header actions, footer columns, contact details and social destinations. This does not change admin or client-portal branding.</p></div>
    <section className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"><div><h2 className="text-lg font-bold text-[var(--text-primary)]">Brand identity</h2><p className="mt-1 text-xs text-[var(--text-muted)]">The logo and studio identity shown across the public website.</p></div><div className="grid gap-4 sm:grid-cols-2">{textField("brandName","Brand name")}{textField("brandDescriptor","Brand descriptor")}{textField("logoUrl","Header and footer logo URL","/logo.png or https://…")}{textField("logoAlt","Logo alternative text")}{textField("siteTitle","Browser and search title")}{textField("faviconUrl","Favicon URL","/favicon.png or https://…")}{textField("openGraphImageUrl","Social sharing image URL","/opengraph-image or https://…")}<label className={labelClass+" sm:col-span-2"}>Site description<textarea className={inputClass+" min-h-20"} value={String(settings.siteDescription??"")} onChange={event=>update("siteDescription",event.target.value)}/></label></div></section>
    <section className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"><div><h2 className="text-lg font-bold text-[var(--text-primary)]">Header and navigation</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Control the announcement bar, main action and client portal destination.</p></div>{toggle("announcementEnabled","Show announcement strip")}<label className={labelClass}>Announcement text<textarea className={inputClass+" min-h-20"} value={String(settings.announcementText??"")} onChange={event=>update("announcementText",event.target.value)}/></label><div className="grid gap-4 sm:grid-cols-2">{textField("headerCtaLabel","Header primary action label")}{textField("headerCtaHref","Header primary action destination")}{textField("clientPortalLabel","Client portal link label")}{textField("clientPortalHref","Client portal destination")}</div></section>
    <section className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"><div><h2 className="text-lg font-bold text-[var(--text-primary)]">Footer identity and contact</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Control the studio description, address, contact channels and copyright.</p></div><div className="grid gap-4 sm:grid-cols-2">{textField("contactEmail","Public contact email")}{textField("contactPhone","Public contact phone")}{textField("footerAddress","Studio address")}</div><label className={labelClass}>Footer tagline<textarea className={inputClass+" min-h-24"} value={String(settings.footerTagline??"")} onChange={event=>update("footerTagline",event.target.value)}/></label>{textField("copyrightText","Copyright line","© {year} {brand}. All rights reserved.")}{toggle("newsletterEnabled","Show newsletter subscription form in footer")}</section>
    <section className="space-y-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      <div><h2 className="text-lg font-bold text-[var(--text-primary)]">404, error and offline experiences</h2><p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Control the wording and destinations shown when a visitor reaches a missing page, encounters an application error or loses their connection.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {textField("notFoundEyebrow","404 eyebrow")}{textField("notFoundHeadline","404 headline")}{textField("notFoundAccent","404 accent line")}{textField("notFoundPrimaryLabel","404 primary button")}{textField("notFoundPrimaryHref","404 primary destination")}{textField("notFoundSecondaryLabel","404 secondary button")}{textField("notFoundSecondaryHref","404 secondary destination")}
        {textField("errorEyebrow","Error eyebrow")}{textField("errorHeadline","Error headline")}{textField("errorAccent","Error accent line")}{textField("errorRetryLabel","Error retry button")}{textField("errorHomeLabel","Error home button")}{textField("errorHomeHref","Error home destination")}{textField("errorContactLabel","Error contact link label")}{textField("errorContactHref","Error contact destination")}
        {textField("offlineEyebrow","Offline eyebrow")}{textField("offlineHeadline","Offline headline")}{textField("offlineRetryLabel","Offline retry button")}{textField("offlineHomeLabel","Offline home button")}{textField("offlineHomeHref","Offline home destination")}
        {textField("loadingBrandLabel","Loading screen brand label")}{textField("loadingMessage","Loading screen message")}
      </div>
      <label className={labelClass}>404 description<textarea className={inputClass+" min-h-20"} value={String(settings.notFoundDescription??"")} onChange={event=>update("notFoundDescription",event.target.value)}/></label>
      <label className={labelClass}>Error description<textarea className={inputClass+" min-h-20"} value={String(settings.errorDescription??"")} onChange={event=>update("errorDescription",event.target.value)}/></label>
      <label className={labelClass}>Offline description<textarea className={inputClass+" min-h-20"} value={String(settings.offlineDescription??"")} onChange={event=>update("offlineDescription",event.target.value)}/></label>
    </section>
    {jsonEditor("navigationGroups","Header navigation groups","Edit the dropdown groups and links shown in desktop and mobile navigation. Each link supports label, href and optional lucide icon name. Use internal paths or HTTPS destinations.")}
    {jsonEditor("footerSections","Footer link columns","Edit the footer column headings and links. Use internal paths, HTTPS, mailto: or tel: destinations.")}
    {jsonEditor("socialLinks","Social media links","Edit social profile destinations. Supported icon platform names: whatsapp, github, facebook and instagram. Other platform names render as text labels.")}
    {error&&<div role="alert" className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300"><AlertCircle size={17} className="mt-0.5 shrink-0"/>{error}</div>}
    {message&&<div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"><CheckCircle2 size={17} className="mt-0.5 shrink-0"/>{message}</div>}
    <div className="sticky bottom-4 flex flex-wrap justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 p-3 shadow-2xl backdrop-blur"><button type="button" onClick={resetLocal} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)]"><RotateCcw size={15}/>Load defaults</button><button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}Save website settings</button></div>
  </div>;
}
