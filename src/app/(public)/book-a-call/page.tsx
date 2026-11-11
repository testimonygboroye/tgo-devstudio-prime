import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarCheck, ShieldCheck } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import BookACallSettings from "@/models/BookACallSettings";

export const revalidate=300;
const DEFAULTS={heading:"Book a Discovery Call",description:"Pick a time that works for you, and let's talk about what you're building.",calendlyUrl:"https://calendly.com/testimonygboroye-dev/30min"};
export const metadata:Metadata={title:"Book a Call | TGO DevStudio Prime",description:"Schedule a discovery call with TGO DevStudio to discuss your project.",alternates:{canonical:"/book-a-call"}};

export default async function BookACallPage(){
  await connectToDatabase();
  const saved=await BookACallSettings.findOne().lean();
  const settings=saved||DEFAULTS;
  return (
    <main className="book-call-page">
      <section className="book-call-hero"><div className="home-container text-center"><span className="eyebrow-label justify-center">Get started · Discovery call</span><h1>{settings.heading}</h1><p>{settings.description}</p><div className="book-call-trust"><span><CalendarCheck size={16}/> Choose a convenient time</span><span><ShieldCheck size={16}/> A focused, no-pressure conversation</span></div></div></section>
      <section className="book-call-scheduler"><div className="home-container"><div className="book-call-scheduler-heading"><div><span className="eyebrow-label">Schedule a time</span><h2>Let’s make room for a good conversation.</h2></div><Link href="/contact" className="book-call-contact-link">Prefer to send a message? <ArrowUpRight size={16}/></Link></div><div className="surface-card mx-auto max-w-4xl"><div className="surface-card-inner overflow-hidden"><iframe src={settings.calendlyUrl+"?background_color=131722&text_color=f1f3f8&primary_color=2ec5f0"} width="100%" height="700" frameBorder="0" title="Book a call with TGO DevStudio" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/></div></div></div></section>
    </main>
  );
}
