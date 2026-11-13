import Link from "next/link";
import { ArrowUpRight, Compass, Layers3, Rocket, ShieldCheck } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import ProcessStep from "@/models/ProcessStep";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import PublicEmptyState from "@/components/public/PublicEmptyState";
import { getPublicPageContent } from "@/lib/publicSite/getPublicPageContent";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublicPageContent("process");
  return { alternates: { canonical: "/process" }, title: page.metaTitle, description: page.metaDescription };
}
const phaseIcons=[Compass,Layers3,ShieldCheck,Rocket];
export default async function ProcessPage(){
  await connectToDatabase();
  const locale=await getServerLocale();
  const page = await getPublicPageContent("process");
  const steps=(await ProcessStep.find({publishStatus:"published"}).sort({displayOrder:1}).lean()).map(step=>getLocalizedContent(step,locale,TRANSLATABLE_FIELDS.ProcessStep));
  return (
    <main className="process-page">
      <section className="process-hero"><div className="home-container"><span className="eyebrow-label">{page.heroEyebrow}</span><h1>{page.heroHeadline}<br/><em>{page.heroAccent}</em></h1><p>{page.heroDescription}</p><div className="process-hero-points"><span><Compass size={16}/> Deliberate discovery</span><span><Layers3 size={16}/> Connected execution</span><span><Rocket size={16}/> Measured progress</span></div></div></section>
      <section className="process-main"><div className="home-container"><div className="process-intro"><span className="eyebrow-label">{page.introEyebrow}</span><h2>{page.introHeading}</h2><p>{page.introDescription}</p></div>
        {steps.length===0?<PublicEmptyState eyebrow="Our approach" title="Clear thinking. Deliberate engineering. Measurable progress." description="Every engagement is shaped around its goals, constraints and people. We begin by understanding the problem, agree on scope and priorities, build in considered increments, then prepare the work for launch and continued improvement." primaryHref="/contact" primaryLabel="Discuss your project" secondaryHref="/book-a-call" secondaryLabel="Book a call"/>:
        <div className="process-timeline">{steps.map((step,index)=>{const Icon=phaseIcons[index%phaseIcons.length];return <article className="process-step-card" key={step._id.toString()}><div className="process-step-rail"><span>{String(index+1).padStart(2,"0")}</span><i/></div><div className="process-step-content"><span className="process-step-icon"><Icon size={22}/></span><small>PHASE {String(index+1).padStart(2,"0")}</small><h3>{step.title}</h3><p>{step.description}</p></div><span className="process-step-watermark">{String(index+1).padStart(2,"0")}</span></article>})}</div>}
      </div></section>
      <section className="process-bottom-cta"><div className="home-container"><span className="eyebrow-label">{page.ctaEyebrow}</span><h2>{page.ctaHeading}</h2><p>{page.ctaDescription}</p><Link href={page.ctaPrimaryHref} className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-white">{page.ctaPrimaryLabel} <ArrowUpRight size={18}/></Link></div></section>
    </main>
  );
}
