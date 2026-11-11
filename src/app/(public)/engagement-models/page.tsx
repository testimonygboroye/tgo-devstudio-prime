import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Compass, Layers3, LifeBuoy, Users, CheckCircle2, Handshake, Building2 } from "lucide-react";
import { getPublicPageContent } from "@/lib/publicSite/getPublicPageContent";

export const dynamic = "force-dynamic";
const ICONS = { Compass, Layers3, LifeBuoy, Users, Handshake, Building2 } as const;
function getIcon(name: string) { return ICONS[name as keyof typeof ICONS] || Layers3; }

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublicPageContent("engagement-models");
  return { title: page.metaTitle, description: page.metaDescription, alternates: { canonical: "/engagement-models" } };
}

export default async function EngagementModelsPage() {
  const page = await getPublicPageContent("engagement-models");
  const cards = [...page.cards].sort((a,b)=>a.displayOrder-b.displayOrder);
  return (
    <main className="engagement-page">
      <section className="engagement-hero"><div className="home-container"><span className="eyebrow-label">{page.heroEyebrow}</span><h1>{page.heroHeadline}<br/><em>{page.heroAccent}</em></h1><p>{page.heroDescription}</p>
        {page.heroNote&&<div className="engagement-hero-points">{page.heroNote.split("·").map(item=><span key={item}><CheckCircle2 size={15}/>{item.trim()}</span>)}</div>}
      </div></section>
      <section className="engagement-content"><div className="home-container">
        <div className="engagement-intro"><span className="eyebrow-label">{page.introEyebrow}</span><h2>{page.introHeading}</h2><p>{page.introDescription}</p></div>
        <div className="engagement-grid">{cards.map((card,index)=>{const Icon=getIcon(card.icon);return <article key={card.title} className="engagement-card">
          <div className="engagement-card-top"><span><Icon size={22}/></span><small>{card.eyebrow || `MODEL / ${String(index+1).padStart(2,"0")}`}</small></div>
          <h3>{card.title}</h3>{card.subtitle&&<b className="engagement-best">{card.subtitle}</b>}<p>{card.description}</p>
          {card.bulletPoints.length>0&&<ul>{card.bulletPoints.map(item=><li key={item}><CheckCircle2 size={14}/>{item}</li>)}</ul>}
        </article>})}</div>
      </div></section>
      <section className="engagement-cta"><div className="home-container"><span className="eyebrow-label">{page.ctaEyebrow}</span><h2>{page.ctaHeading}</h2><p>{page.ctaDescription}</p><div className="flex flex-wrap justify-center gap-3"><Link href={page.ctaPrimaryHref} className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-white">{page.ctaPrimaryLabel}<ArrowUpRight size={17}/></Link>{page.ctaSecondaryLabel&&<Link href={page.ctaSecondaryHref} className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold" style={{color:"var(--text-primary)"}}>{page.ctaSecondaryLabel}<ArrowUpRight size={17}/></Link>}</div></div></section>
    </main>
  );
}
