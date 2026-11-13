import Link from "next/link";
import { ArrowRight, ArrowUpRight, Code, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import { SERVICE_ICON_MAP } from "@/lib/constants/serviceIcons";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import { slugify } from "@/lib/utils/slugify";
import { getSiteUrl } from "@/lib/siteUrl";
import PublicEmptyState from "@/components/public/PublicEmptyState";
import { getPublicPageContent } from "@/lib/publicSite/getPublicPageContent";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublicPageContent("services");
  return { title: page.metaTitle, description: page.metaDescription, alternates: { canonical: "/services" }, openGraph: { title: page.metaTitle, description: page.metaDescription, type: "website" } };
}

export default async function ServicesPage() {
  await connectToDatabase();
  const locale = await getServerLocale();
  const page = await getPublicPageContent("services");
  const services = (await Service.find({publishStatus:"published"}).sort({featured:-1,displayOrder:1}).lean()).map(service=>getLocalizedContent(service,locale,TRANSLATABLE_FIELDS.Service));
  const siteUrl = getSiteUrl();
  const schema = {"@context":"https://schema.org","@type":"ItemList",name:"TGO DevStudio Software Engineering Services",url:`${siteUrl}/services`,itemListElement:services.map((service,index)=>({"@type":"ListItem",position:index+1,name:service.title,url:`${siteUrl}/services/${slugify(service.title)}`}))};

  return (
    <main className="services-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
      <section className="services-hero"><div className="home-container"><span className="eyebrow-label">{page.heroEyebrow}</span><h1>{page.heroHeadline}<br/><em>{page.heroAccent}</em></h1><p>{page.heroDescription}</p><div className="services-hero-actions"><Link href="/contact" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white">Discuss your project <ArrowUpRight size={17}/></Link><Link href="/services/catalogue" className="services-quiet-link">Explore packages and pricing <ArrowRight size={16}/></Link></div><div className="services-hero-trust"><span><Layers3 size={16}/> End-to-end product delivery</span><span><ShieldCheck size={16}/> Security-aware engineering</span><span><Sparkles size={16}/> Experience-led design</span></div></div></section>
      <section className="services-main"><div className="home-container"><div className="services-section-intro"><span className="eyebrow-label">{page.introEyebrow}</span><h2>{page.introHeading}</h2><p>{page.introDescription}</p></div>
        {services.length===0?<PublicEmptyState eyebrow="Capabilities" title="Let's define the right solution for your next challenge." description="Tell us what you are trying to build. We can discuss the scope, technical approach and a practical path from idea to a production-ready product." primaryHref="/contact" primaryLabel="Discuss a project" secondaryHref="/book-a-call" secondaryLabel="Book a discovery call"/>:
        <div className="services-grid">{services.map((service,index)=>{const IconComp=SERVICE_ICON_MAP[service.icon]||Code;return <Link key={service._id.toString()} href={`/services/${slugify(service.title)}`} className="services-card"><div className="services-card-top"><span className="services-card-icon"><IconComp size={23}/></span><span className="services-card-index">CAPABILITY / {String(index+1).padStart(2,"0")}</span></div><h3>{service.title}</h3><p>{service.summary}</p><span className="services-card-link">Explore capability <ArrowUpRight size={17}/></span></Link>})}</div>}
      </div></section>
      <section className="services-delivery-band"><div className="home-container"><div><span className="eyebrow-label">How we approach the work</span><h2>Not just a service provider.<br/><em>A partner in the outcome.</em></h2></div><div className="services-delivery-points">{page.cards.length ? [...page.cards].sort((a,b)=>a.displayOrder-b.displayOrder).map((item,index)=><p key={item.title}><b>{item.eyebrow || String(index+1).padStart(2,"0")+" / "+item.title}</b><span>{item.description}</span></p>) : <p>{page.heroNote}</p>}</div></div></section>
      <section className="services-bottom-cta"><div className="home-container"><span className="eyebrow-label">{page.ctaEyebrow}</span><h2>{page.ctaHeading}</h2><p>{page.ctaDescription}</p><div className="flex flex-wrap gap-3"><Link href={page.ctaPrimaryHref} className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-white">{page.ctaPrimaryLabel} <ArrowUpRight size={18}/></Link>{page.ctaSecondaryLabel&&<Link href={page.ctaSecondaryHref} className="services-quiet-link">{page.ctaSecondaryLabel} <ArrowRight size={16}/></Link>}</div></div></section>
    </main>
  );
}
