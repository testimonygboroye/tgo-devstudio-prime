import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarCheck, ShieldCheck } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import BookACallSettings from "@/models/BookACallSettings";
import { getPublicPageContent } from "@/lib/publicSite/getPublicPageContent";

export const dynamic = "force-dynamic";
const DEFAULTS={heading:"Book a Discovery Call",description:"Pick a time that works for you, and let's talk about what you're building.",calendlyUrl:"https://calendly.com/testimonygboroye-dev/30min"};
export async function generateMetadata():Promise<Metadata>{const page=await getPublicPageContent("book-a-call");return {title:page.metaTitle,description:page.metaDescription,alternates:{canonical:"/book-a-call"}};}

export default async function BookACallPage(){
  await connectToDatabase();
  const saved=await BookACallSettings.findOne().lean();
  const settings=saved||DEFAULTS;
  const page=await getPublicPageContent("book-a-call");
  return (
    <main className="book-call-page">
      <section className="book-call-hero"><div className="home-container text-center"><span className="eyebrow-label justify-center">{page.heroEyebrow}</span><h1>{page.heroHeadline}<br/><em>{page.heroAccent}</em></h1><p>{page.heroDescription}</p><div className="book-call-trust"><span><CalendarCheck size={16}/> Choose a convenient time</span><span><ShieldCheck size={16}/> A focused, no-pressure conversation</span></div></div></section>
      <section className="book-call-scheduler"><div className="home-container"><div className="book-call-scheduler-heading"><div><span className="eyebrow-label">{page.introEyebrow}</span><h2>{page.introHeading}</h2><p>{page.introDescription}</p></div><Link href={page.ctaPrimaryHref} className="book-call-contact-link">{page.ctaPrimaryLabel} <ArrowUpRight size={16}/></Link></div><div className="surface-card mx-auto max-w-4xl"><div className="surface-card-inner overflow-hidden"><iframe src={settings.calendlyUrl+"?background_color=131722&text_color=f1f3f8&primary_color=2ec5f0"} width="100%" height="700" frameBorder="0" title="Book a call with TGO DevStudio" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/></div></div></div></section>
    </main>
  );
}
