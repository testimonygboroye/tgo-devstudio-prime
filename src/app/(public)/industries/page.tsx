import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Building2, GraduationCap, HeartPulse, Landmark, ShoppingBag, Truck, Video, Workflow, Layers3 } from "lucide-react";
import { getPublicPageContent } from "@/lib/publicSite/getPublicPageContent";

export const dynamic = "force-dynamic";
const ICONS = { Building2, GraduationCap, HeartPulse, Landmark, ShoppingBag, Truck, Video, Workflow, Layers3 } as const;
function getIcon(name: string) { return ICONS[name as keyof typeof ICONS] || Layers3; }

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublicPageContent("industries");
  return { title: page.metaTitle, description: page.metaDescription, alternates: { canonical: "/industries" } };
}

export default async function IndustriesPage() {
  const page = await getPublicPageContent("industries");
  const cards = [...page.cards].sort((a, b) => a.displayOrder - b.displayOrder);
  return (
    <main className="industries-page">
      <section className="industries-hero"><div className="home-container">
        <span className="eyebrow-label">{page.heroEyebrow}</span>
        <h1>{page.heroHeadline}<br/><em>{page.heroAccent}</em></h1>
        <p>{page.heroDescription}</p>
        {page.heroNote && <div className="industries-hero-note">{page.heroNote}</div>}
      </div></section>
      <section className="industries-content"><div className="home-container">
        <div className="industries-intro"><div><span className="eyebrow-label">{page.introEyebrow}</span><h2>{page.introHeading}</h2></div><p>{page.introDescription}</p></div>
        <div className="industries-grid">{cards.map((card,index)=>{const Icon=getIcon(card.icon);return <article key={card.title} className="industry-card">
          <div className="industry-card-top"><span><Icon size={22}/></span><small>{card.eyebrow || `SECTOR / ${String(index+1).padStart(2,"0")}`}</small></div>
          <h3>{card.title}</h3>{card.subtitle&&<b className="industry-card-subtitle">{card.subtitle}</b>}<p>{card.description}</p>
          {card.bulletPoints.length>0&&<ul>{card.bulletPoints.map(item=><li key={item}>{item}</li>)}</ul>}
        </article>})}</div>
      </div></section>
      <section className="industries-cta"><div className="home-container"><span className="eyebrow-label">{page.ctaEyebrow}</span><h2>{page.ctaHeading}</h2><p>{page.ctaDescription}</p><div className="flex flex-wrap justify-center gap-3"><Link href={page.ctaPrimaryHref} className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-white">{page.ctaPrimaryLabel}<ArrowUpRight size={18}/></Link>{page.ctaSecondaryLabel&&<Link href={page.ctaSecondaryHref} className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold" style={{color:"var(--text-primary)"}}>{page.ctaSecondaryLabel}<ArrowUpRight size={17}/></Link>}</div></div></section>
    </main>
  );
}
