import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Compass, HeartHandshake, Lightbulb, ShieldCheck, Sparkles } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import PageContent from "@/models/PageContent";
import AboutSettings from "@/models/AboutSettings";
import { PAGE_DEFAULTS } from "@/lib/constants/pageDefaults";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";
import ImageLightbox from "@/components/shared/ImageLightbox";
import SmartImage from "@/components/public/SmartImage";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "About | TGO DevStudio Prime",
  description: "The story, mission, and people behind TGO DevStudio.",
  alternates: { canonical: "/about" },
};

const FOUNDER_DEFAULTS = {
  founderName: "Testimony Oluwatimilehin Gboroye",
  founderRole: "Founder, TGO DevStudio",
  founderDescription: "Building TGO DevStudio Prime from the ground up as the studio's flagship proof of standard — the same care given to every project the studio takes on.",
  founderPhotoUrl: "/founder.png",
};

function extractSection(html: string, heading: string): string {
  const marker = `<h2>${heading}</h2>`;
  const start = html.indexOf(marker);
  if (start === -1) return "";
  const rest = html.slice(start + marker.length);
  const nextHeadingIdx = rest.search(/<h2>/);
  return nextHeadingIdx === -1 ? rest : rest.slice(0, nextHeadingIdx);
}

const principles = [
  { icon: Lightbulb, title: "Clarity before complexity", text: "We make the problem understandable before we make the solution complicated." },
  { icon: ShieldCheck, title: "Quality is a responsibility", text: "The details matter: security, accessibility, performance and maintainability." },
  { icon: HeartHandshake, title: "People are the point", text: "Technology should make life and work better for the people who rely on it." },
  { icon: Compass, title: "Progress with purpose", text: "Every decision should move the product and the people behind it forward." },
];

export default async function AboutPage() {
  await connectToDatabase();
  const [saved, founderSaved] = await Promise.all([
    PageContent.findOne({ type: "about" }).lean(),
    AboutSettings.findOne().lean(),
  ]);
  const page = saved || PAGE_DEFAULTS.about;
  const founder = founderSaved || FOUNDER_DEFAULTS;
  const partOfTgo = extractSection(page.content, "Part of TGO");
  const whyExists = extractSection(page.content, "Why TGO DevStudio Exists");
  const standFor = extractSection(page.content, "What We Stand For");

  return (
    <main className="about-page">
      <section className="about-hero ambient-glow">
        <div className="about-hero-inner">
          <span className="eyebrow-label">The people and purpose behind the work</span>
          <h1>{page.title}</h1>
          <p>We bring thoughtful product design and dependable engineering together to create technology people can trust and businesses can grow with.</p>
          <div className="about-hero-actions"><Link href="/services" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white">What we do <ArrowUpRight size={17}/></Link><Link href="/contact" className="about-quiet-link">Talk with the studio <ArrowRight size={16}/></Link></div>
          <div className="about-hero-art" aria-hidden="true"><div className="about-art-ring about-art-ring-a"/><div className="about-art-ring about-art-ring-b"/><div className="about-art-core"><Sparkles size={32}/><b>TGO</b><small>IDEAS INTO SYSTEMS</small></div><span className="about-art-node about-node-one"/><span className="about-art-node about-node-two"/><span className="about-art-node about-node-three"/></div>
        </div>
      </section>

      {partOfTgo && <section className="about-story-section"><div className="about-story-layout"><div className="about-story-aside"><span className="eyebrow-label">Our story</span><h2>Built around the belief that technology can do more.</h2><span className="about-story-index">01 / THE STUDIO</span></div><div className="about-story-copy prose" dangerouslySetInnerHTML={{__html:sanitizeBlogHtml(partOfTgo)}}/></div></section>}

      {whyExists && <section className="about-why-section"><div className="about-why-panel"><span className="eyebrow-label">Why we exist</span><div className="prose about-why-copy" dangerouslySetInnerHTML={{__html:sanitizeBlogHtml(whyExists)}}/></div></section>}

      <section className="about-principles-section"><div className="home-container"><div className="about-section-intro"><span className="eyebrow-label">What guides every decision</span><h2>Standards that show up in the finished work.</h2><p>Our principles are practical. They influence how we plan, design, build, communicate and support the systems we create.</p></div><div className="about-principles-grid">{principles.map(({icon:Icon,title,text},index)=><article key={title} className="about-principle-card"><span className="about-principle-number">0{index+1}</span><span className="about-principle-icon"><Icon size={22}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>{standFor&&<div className="about-original-values"><span className="eyebrow-label">Our full commitments</span><div className="values-grid prose" dangerouslySetInnerHTML={{__html:sanitizeBlogHtml(standFor)}}/></div>}</div></section>}

      <section className="about-founder-section"><div className="home-container"><div className="about-founder-card"><div className="about-founder-photo"><ImageLightbox src={founder.founderPhotoUrl} alt={founder.founderName}><SmartImage src={founder.founderPhotoUrl} alt={founder.founderName} label={founder.founderName}/></ImageLightbox><span>THE PERSON BEHIND THE VISION</span></div><div className="about-founder-copy"><span className="eyebrow-label">A note from the founder</span><h2>{founder.founderName}</h2><b>{founder.founderRole}</b><p>{founder.founderDescription}</p><div className="about-founder-signoff">Built with intent. Delivered with care.</div></div></div></div></section>

      <section className="about-bottom-cta"><div className="home-container"><span className="eyebrow-label">The next chapter</span><h2>Let’s make something meaningful.</h2><p>Bring us the challenge, the ambition or the early idea. We’ll help you find a clear way forward.</p><Link href="/contact" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-white">Start a conversation <ArrowUpRight size={18}/></Link></div></section>
    </main>
  );
}
