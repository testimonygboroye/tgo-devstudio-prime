"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import type { PublicPageKey } from "@/models/PublicPageContent";
import { PUBLIC_PAGE_DEFAULTS } from "@/lib/constants/publicSiteDefaults";

type PageSettings = Record<string, unknown>;
const FIELDS = [
  ["metaTitle","SEO title"],["metaDescription","SEO description"],["heroEyebrow","Hero eyebrow"],["heroHeadline","Hero headline"],["heroAccent","Hero accent line"],["heroDescription","Hero description"],["heroNote","Hero supporting note"],["introEyebrow","Section eyebrow"],["introHeading","Section heading"],["introDescription","Section introduction"],["ctaEyebrow","Closing CTA eyebrow"],["ctaHeading","Closing CTA heading"],["ctaDescription","Closing CTA description"],["ctaPrimaryLabel","Primary button label"],["ctaPrimaryHref","Primary button destination"],["ctaSecondaryLabel","Secondary button label"],["ctaSecondaryHref","Secondary button destination"],
] as const;
const inputClass="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-cyan-400";
const labelClass="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]";

export default function PublicPageContentEditor({pageKey}:{pageKey:PublicPageKey}){
 const fallback=PUBLIC_PAGE_DEFAULTS[pageKey] as unknown as PageSettings;
 const [settings,setSettings]=useState<PageSettings>(fallback);
 const [cardsJson,setCardsJson]=useState(JSON.stringify(fallback.cards,null,2));
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");

 useEffect(()=>{
  let active=true;
  fetch("/api/public-pages/"+pageKey,{cache:"no-store"}).then(async response=>{
   const data=await response.json();
   if(!response.ok)throw new Error(data.message||"Could not load page content.");
   if(!active||!data.settings)return;
   setSettings(data.settings);
   setCardsJson(JSON.stringify(data.settings.cards||[],null,2));
  }).catch(err=>{if(active)setError(err instanceof Error?err.message:"Could not load page content.");}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[pageKey]);

 const update=(field:string,value:string)=>setSettings(current=>({...current,[field]:value}));
 async function save(){
  setSaving(true);setError("");setMessage("");
  try{
   const cards=JSON.parse(cardsJson);
   if(!Array.isArray(cards))throw new Error("Cards must be a JSON array.");
   const response=await fetch("/api/public-pages/"+pageKey,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...settings,cards})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.message||"Could not save page content.");
   setSettings(data.settings);
   setCardsJson(JSON.stringify(data.settings.cards||[],null,2));
   setMessage("Page content saved. The public page has been revalidated.");
  }catch(err){setError(err instanceof Error?err.message:"Could not save page content.");}
  finally{setSaving(false);}
 }

 if(loading)return <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-sm text-[var(--text-secondary)]"><Loader2 size={18} className="animate-spin"/>Loading page content…</div>;
 const pageLabels:Record<PublicPageKey,string>={"industries":"Industries","engagement-models":"Engagement Models","about":"About","contact":"Contact","process":"Our Process","services":"Services","portfolio":"Portfolio","blog":"Blog","team":"Team","careers":"Careers","testimonials":"Testimonials","stack":"Technology Stack","help":"Help Centre","book-a-call":"Book a Call","services-catalogue":"Service Catalogue","faq":"FAQ"};
 const pageLabel=pageLabels[pageKey];
 const usesCustomCards=["industries","engagement-models","about","services","faq"].includes(pageKey);
 const contentSourceNotes:Record<PublicPageKey,string>={
  industries:"Industry cards are managed here as part of this page.",
  "engagement-models":"Engagement model cards are managed here as part of this page.",
  about:"The story body is managed in Site Pages → About, and founder details are managed in About Settings. The principles cards are managed here.",
  contact:"The enquiry form, contact channels and availability details are managed in their respective admin settings.",
  process:"Process steps are managed in the Process Steps section.",
  services:"Individual service cards are managed in Services. The three delivery principles are managed here.",
  portfolio:"Case studies and project images are managed in Portfolio.",
  blog:"Articles, categories and featured images are managed in Blog Posts.",
  team:"Team profiles and portraits are managed in Team Members.",
  careers:"Job openings and application details are managed in Careers.",
  testimonials:"Client reviews and approval status are managed in Testimonials.",
  stack:"Technology entries and categories are managed in Stack Items.",
  help:"Help articles and categories are managed in the Help Centre.",
  "book-a-call":"Calendar provider and booking URL are managed in Book a Call Settings.",
  "services-catalogue":"Packages, pricing and inclusions are managed in Commercial Services.",
  faq:"Published questions are managed in FAQ. These cards are fallback answers shown when no published FAQ records exist.",
 };
 return <div className="space-y-7">
  <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-500/10 via-cyan-400/5 to-transparent p-5"><p className="text-sm font-semibold text-[var(--text-primary)]">{pageLabel} landing page content</p><p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">Every heading, paragraph, SEO field, feature card, icon, bullet point and CTA on this public page is stored in the CMS. Saving updates the live page without a code deployment.</p></div>
  <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"><h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">Search engine details</h2><div className="grid gap-4">{FIELDS.slice(0,2).map(([field,label])=><label key={field} className={labelClass}>{label}<textarea className={inputClass+" min-h-20"} value={String(settings[field]??"")} onChange={event=>update(field,event.target.value)}/></label>)}</div></section>
  <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"><h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">Hero and introduction</h2><div className="grid gap-4 sm:grid-cols-2">{FIELDS.slice(2,5).map(([field,label])=><label key={field} className={labelClass}>{label}<input className={inputClass} value={String(settings[field]??"")} onChange={event=>update(field,event.target.value)}/></label>)}{FIELDS.slice(7,9).map(([field,label])=><label key={field} className={labelClass}>{label}<input className={inputClass} value={String(settings[field]??"")} onChange={event=>update(field,event.target.value)}/></label>)}</div><div className="mt-4 grid gap-4">{FIELDS.slice(5,7).map(([field,label])=><label key={field} className={labelClass}>{label}<textarea className={inputClass+" min-h-24"} value={String(settings[field]??"")} onChange={event=>update(field,event.target.value)}/></label>)}<label className={labelClass}>{FIELDS[9][1]}<textarea className={inputClass+" min-h-24"} value={String(settings[FIELDS[9][0]]??"")} onChange={event=>update(FIELDS[9][0],event.target.value)}/></label></div></section>
  {usesCustomCards?<section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"><div className="mb-3"><h2 className="text-lg font-bold text-[var(--text-primary)]">Page cards and features</h2><p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Edit the array of cards. Each card supports icon, eyebrow, title, subtitle, description, bulletPoints and displayOrder. Use lucide icon names such as Building2, ShoppingBag, Layers3, Users, Compass or Workflow.</p></div><textarea spellCheck={false} className={inputClass+" min-h-[480px] resize-y font-mono text-xs leading-relaxed"} value={cardsJson} onChange={event=>setCardsJson(event.target.value)}/></section>:<div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5"><h2 className="font-semibold text-[var(--text-primary)]">Where the page items are managed</h2><p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{contentSourceNotes[pageKey]}</p></div>}
  <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"><h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">Closing call to action</h2><div className="grid gap-4 sm:grid-cols-2">{FIELDS.slice(10).map(([field,label])=><label key={field} className={labelClass}>{label}<input className={inputClass} value={String(settings[field]??"")} onChange={event=>update(field,event.target.value)}/></label>)}</div></section>
  {error&&<div role="alert" className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300"><AlertCircle size={17} className="mt-0.5 shrink-0"/>{error}</div>}
  {message&&<div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"><CheckCircle2 size={17} className="mt-0.5 shrink-0"/>{message}</div>}
  <div className="sticky bottom-4 flex justify-end rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 p-3 shadow-2xl backdrop-blur"><button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}Save {pageLabel} page</button></div>
 </div>;
}
