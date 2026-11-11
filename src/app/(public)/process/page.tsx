import Link from "next/link";
import { ArrowUpRight, Compass, Layers3, Rocket, ShieldCheck } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import ProcessStep from "@/models/ProcessStep";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import PublicEmptyState from "@/components/public/PublicEmptyState";

export const revalidate = 300;
export async function generateMetadata(): Promise<Metadata> {
  const t=createTranslator(await getServerLocale());
  return {alternates:{canonical:"/process"},title:`${t("nav.process")} | TGO DevStudio Prime`,description:t("process.subtitle")};
}
const phaseIcons=[Compass,Layers3,ShieldCheck,Rocket];
export default async function ProcessPage(){
  await connectToDatabase();
  const locale=await getServerLocale();
  const t=createTranslator(locale);
  const steps=(await ProcessStep.find({publishStatus:"published"}).sort({displayOrder:1}).lean()).map(step=>getLocalizedContent(step,locale,TRANSLATABLE_FIELDS.ProcessStep));
  return (
    <main className="process-page">
      <section className="process-hero"><div className="home-container"><span className="eyebrow-label">{t("nav.process")} · OUR METHOD</span><h1>Make the complex<br/><em>feel clear.</em></h1><p>{t("process.subtitle")}</p><div className="process-hero-points"><span><Compass size={16}/> Deliberate discovery</span><span><Layers3 size={16}/> Connected execution</span><span><Rocket size={16}/> Measured progress</span></div></div></section>
      <section className="process-main"><div className="home-container"><div className="process-intro"><span className="eyebrow-label">A considered way of working</span><h2>Progress you can understand<br/>at every stage.</h2><p>Every project is different, but the discipline stays consistent. We keep the work visible, the decisions clear and the experience connected from first conversation to launch.</p></div>
        {steps.length===0?<PublicEmptyState eyebrow="Our approach" title="Clear thinking. Deliberate engineering. Measurable progress." description="Every engagement is shaped around its goals, constraints and people. We begin by understanding the problem, agree on scope and priorities, build in considered increments, then prepare the work for launch and continued improvement." primaryHref="/contact" primaryLabel="Discuss your project" secondaryHref="/book-a-call" secondaryLabel="Book a call"/>:
        <div className="process-timeline">{steps.map((step,index)=>{const Icon=phaseIcons[index%phaseIcons.length];return <article className="process-step-card" key={step._id.toString()}><div className="process-step-rail"><span>{String(index+1).padStart(2,"0")}</span><i/></div><div className="process-step-content"><span className="process-step-icon"><Icon size={22}/></span><small>PHASE {String(index+1).padStart(2,"0")}</small><h3>{step.title}</h3><p>{step.description}</p></div><span className="process-step-watermark">{String(index+1).padStart(2,"0")}</span></article>})}</div>}
      </div></section>
      <section className="process-bottom-cta"><div className="home-container"><span className="eyebrow-label">Ready to begin?</span><h2>Let’s turn the next challenge<br/>into a clear plan.</h2><Link href="/contact" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-white">Start a project <ArrowUpRight size={18}/></Link></div></section>
    </main>
  );
}
