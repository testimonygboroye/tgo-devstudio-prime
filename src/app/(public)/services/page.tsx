import Link from "next/link";
import { ArrowRight, ArrowUpRight, Code, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import { SERVICE_ICON_MAP } from "@/lib/constants/serviceIcons";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import { slugify } from "@/lib/utils/slugify";
import { getSiteUrl } from "@/lib/siteUrl";
import PublicEmptyState from "@/components/public/PublicEmptyState";

export const revalidate = 300;
export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getServerLocale());
  return {
    title: `${t("nav.services")} | TGO DevStudio Prime`,
    description: "Explore TGO DevStudio's full-stack software engineering services, including custom software, web applications, mobile apps, SaaS, APIs, AI, cloud, cybersecurity and digital products.",
    alternates: { canonical: "/services" },
    openGraph: { title: "Software Engineering Services | TGO DevStudio Prime", description: "Custom software, web, mobile, SaaS, AI, cloud, cybersecurity and digital product engineering.", type: "website" },
  };
}

export default async function ServicesPage() {
  await connectToDatabase();
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const services = (await Service.find({publishStatus:"published"}).sort({featured:-1,displayOrder:1}).lean()).map(service=>getLocalizedContent(service,locale,TRANSLATABLE_FIELDS.Service));
  const siteUrl = getSiteUrl();
  const schema = {"@context":"https://schema.org","@type":"ItemList",name:"TGO DevStudio Software Engineering Services",url:`${siteUrl}/services`,itemListElement:services.map((service,index)=>({"@type":"ListItem",position:index+1,name:service.title,url:`${siteUrl}/services/${slugify(service.title)}`}))};

  return (
    <main className="services-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
      <section className="services-hero"><div className="home-container"><span className="eyebrow-label">{t("nav.services")} · WHAT WE DO</span><h1>Everything your<br/><em>next idea needs.</em></h1><p>From the first product decision to the infrastructure behind it, we bring the disciplines together to build technology that feels right, works reliably and is ready to grow.</p><div className="services-hero-actions"><Link href="/contact" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white">Discuss your project <ArrowUpRight size={17}/></Link><Link href="/services/catalogue" className="services-quiet-link">Explore packages and pricing <ArrowRight size={16}/></Link></div><div className="services-hero-trust"><span><Layers3 size={16}/> End-to-end product delivery</span><span><ShieldCheck size={16}/> Security-aware engineering</span><span><Sparkles size={16}/> Experience-led design</span></div></div></section>
      <section className="services-main"><div className="home-container"><div className="services-section-intro"><span className="eyebrow-label">Our capabilities</span><h2>Connected capabilities.<br/>One considered outcome.</h2><p>Choose a starting point. We’ll help connect it to the rest of the system so the finished product works as one.</p></div>
        {services.length===0?<PublicEmptyState eyebrow="Capabilities" title="Let's define the right solution for your next challenge." description="Tell us what you are trying to build. We can discuss the scope, technical approach and a practical path from idea to a production-ready product." primaryHref="/contact" primaryLabel="Discuss a project" secondaryHref="/book-a-call" secondaryLabel="Book a discovery call"/>:
        <div className="services-grid">{services.map((service,index)=>{const IconComp=SERVICE_ICON_MAP[service.icon]||Code;return <Link key={service._id.toString()} href={`/services/${slugify(service.title)}`} className="services-card"><div className="services-card-top"><span className="services-card-icon"><IconComp size={23}/></span><span className="services-card-index">CAPABILITY / {String(index+1).padStart(2,"0")}</span></div><h3>{service.title}</h3><p>{service.summary}</p><span className="services-card-link">Explore capability <ArrowUpRight size={17}/></span></Link>})}</div>}
      </div></section>
      <section className="services-delivery-band"><div className="home-container"><div><span className="eyebrow-label">How we approach the work</span><h2>Not just a service provider.<br/><em>A partner in the outcome.</em></h2></div><div className="services-delivery-points"><p><b>01 / Understand</b><span>We start with your users, business goals and constraints.</span></p><p><b>02 / Engineer</b><span>We bring design, software and infrastructure together.</span></p><p><b>03 / Evolve</b><span>We help the product improve as your needs change.</span></p></div></div></section>
      <section className="services-bottom-cta"><div className="home-container"><span className="eyebrow-label">Have a challenge in mind?</span><h2>Let’s shape the right solution.</h2><p>Tell us where you want to go. We’ll help map the best next step.</p><Link href="/contact" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-white">Start a conversation <ArrowUpRight size={18}/></Link></div></section>
    </main>
  );
}
