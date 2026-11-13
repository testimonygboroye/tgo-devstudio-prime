import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, CheckCircle2, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";
import ContactForm from "@/components/public/ContactForm";
import AvailabilityBadge from "@/components/public/AvailabilityBadge";
import { getPublicPageContent } from "@/lib/publicSite/getPublicPageContent";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublicPageContent("contact");
  return { title: page.metaTitle, description: page.metaDescription, openGraph: { title: page.metaTitle, description: page.metaDescription, type: "website" }, alternates: { canonical: "/contact" } };
}

export default async function ContactPage() {
  const page = await getPublicPageContent("contact");
  return (
    <main className="contact-page">
      <section className="contact-hero"><div className="home-container"><span className="eyebrow-label">{page.heroEyebrow}</span><h1>{page.heroHeadline}<br/><em>{page.heroAccent}</em></h1><p>{page.heroDescription}</p><div className="contact-hero-status"><AvailabilityBadge/>{page.heroNote && <span><CheckCircle2 size={15}/> {page.heroNote}</span>}</div></div><div className="contact-hero-decoration" aria-hidden="true"><div/><div/><div/><Sparkles/></div></section>
      <section className="contact-main-section"><div className="home-container contact-main-grid">
        <aside className="contact-aside"><span className="eyebrow-label">{page.introEyebrow}</span><h2>{page.introHeading}</h2><p>{page.introDescription}</p>
          <div className="contact-pathways"><Link href="/book-a-call"><span><CalendarDays size={20}/></span><div><b>Prefer to talk?</b><small>Schedule a discovery conversation.</small></div><ArrowUpRight size={17}/></Link><Link href="/services"><span><MessageSquareText size={20}/></span><div><b>Still exploring?</b><small>See the capabilities we bring together.</small></div><ArrowUpRight size={17}/></Link><Link href="/client/login"><span><ShieldCheck size={20}/></span><div><b>Already a client?</b><small>Continue to your client workspace.</small></div><ArrowUpRight size={17}/></Link></div>
          <div className="contact-trust-note"><ShieldCheck size={18}/><span><b>Your information stays purposeful.</b><small>We use the details you share to understand and respond to your enquiry.</small></span></div>
        </aside>
        <div className="contact-form-shell"><div className="contact-form-heading"><span>PROJECT ENQUIRY</span><b>Give us the useful details.</b><small>Fields marked as required help us respond meaningfully.</small></div><ContactForm/><div className="contact-form-foot"><CheckCircle2 size={14}/> No obligation. Just a clear first step.</div></div>
      </div></section>
      <section className="services-bottom-cta"><div className="home-container"><span className="eyebrow-label">{page.ctaEyebrow}</span><h2>{page.ctaHeading}</h2><p>{page.ctaDescription}</p><Link href={page.ctaPrimaryHref} className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-white">{page.ctaPrimaryLabel} <ArrowUpRight size={17}/></Link></div></section>
    </main>
  );
}
