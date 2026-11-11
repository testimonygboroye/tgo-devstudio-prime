import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, CheckCircle2, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";
import ContactForm from "@/components/public/ContactForm";
import AvailabilityBadge from "@/components/public/AvailabilityBadge";

export const metadata: Metadata = {
  title: "Contact | TGO DevStudio Prime",
  description: "Get in touch with TGO DevStudio about your next project.",
  openGraph: { title: "Contact | TGO DevStudio Prime", description: "Get in touch with TGO DevStudio about your next project.", type: "website" },
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="contact-page">
      <section className="contact-hero"><div className="home-container"><span className="eyebrow-label">Let’s make the next move count</span><h1>Tell us what<br/><em>you’re building.</em></h1><p>Whether you have a clear brief or just the beginning of an idea, this is a good place to start. Share a little context and we’ll take it from there.</p><div className="contact-hero-status"><AvailabilityBadge/><span><CheckCircle2 size={15}/> A real person will review your message.</span></div></div><div className="contact-hero-decoration" aria-hidden="true"><div/><div/><div/><Sparkles/></div></section>
      <section className="contact-main-section"><div className="home-container contact-main-grid">
        <aside className="contact-aside"><span className="eyebrow-label">Start a conversation</span><h2>Good projects begin with a useful conversation.</h2><p>Tell us what you want to achieve, what is getting in the way and what a successful outcome would look like. We’ll help you identify a sensible next step.</p>
          <div className="contact-pathways"><Link href="/book-a-call"><span><CalendarDays size={20}/></span><div><b>Prefer to talk?</b><small>Schedule a discovery conversation.</small></div><ArrowUpRight size={17}/></Link><Link href="/services"><span><MessageSquareText size={20}/></span><div><b>Still exploring?</b><small>See the capabilities we bring together.</small></div><ArrowUpRight size={17}/></Link><Link href="/client/login"><span><ShieldCheck size={20}/></span><div><b>Already a client?</b><small>Continue to your client workspace.</small></div><ArrowUpRight size={17}/></Link></div>
          <div className="contact-trust-note"><ShieldCheck size={18}/><span><b>Your information stays purposeful.</b><small>We use the details you share to understand and respond to your enquiry.</small></span></div>
        </aside>
        <div className="contact-form-shell"><div className="contact-form-heading"><span>PROJECT ENQUIRY</span><b>Give us the useful details.</b><small>Fields marked as required help us respond meaningfully.</small></div><ContactForm/><div className="contact-form-foot"><CheckCircle2 size={14}/> No obligation. Just a clear first step.</div></div>
      </div></section>
    </main>
  );
}
