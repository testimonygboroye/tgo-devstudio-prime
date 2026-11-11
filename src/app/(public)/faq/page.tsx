import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, MessageCircleQuestion, ShieldCheck } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import FaqItem from "@/models/FaqItem";
import FaqAccordion from "./FaqAccordion";

export const revalidate=300;
export const metadata:Metadata={title:"FAQ | TGO DevStudio Prime",description:"Answers to common questions about working with TGO DevStudio, project delivery and support.",alternates:{canonical:"/faq"}};

const commonAnswers=[
 {q:"What can TGO DevStudio help me build?",a:"We work across custom software, websites, web applications, mobile apps, SaaS platforms, AI systems, cloud solutions, cybersecurity and tailored digital products. The right approach depends on your goals and requirements."},
 {q:"How do I start a project?",a:"Send us a project enquiry or arrange a discovery call. We will discuss the problem, clarify scope and priorities, and provide a written proposal where there is a suitable fit. Work begins after the engagement is agreed."},
 {q:"How are project costs and timelines determined?",a:"They depend on requirements, complexity, integrations, deliverables and schedule. We confirm the agreed scope, milestones and fees in the project proposal or engagement document."},
 {q:"Where can I get help or ask about my information?",a:"Visit our Help Centre for support, or read the Privacy Policy for information requests."},
];

export default async function FaqPage(){
 await connectToDatabase();
 const items=await FaqItem.find({publishStatus:"published"}).sort({category:1,displayOrder:1}).lean();
 const grouped=items.reduce<Record<string,typeof items>>((acc,item)=>{if(!acc[item.category])acc[item.category]=[];acc[item.category].push(item);return acc;},{});
 return(
  <main className="faq-page">
   <section className="faq-hero"><div className="home-container"><span className="eyebrow-label">Support · Frequently asked questions</span><h1>Clear answers.<br/><em>Better next steps.</em></h1><p>Start here for practical answers about our services, project delivery, client experience and how to get support.</p><div className="faq-hero-points"><span><MessageCircleQuestion size={16}/> Straightforward guidance</span><span><ShieldCheck size={16}/> Clear expectations</span><span><BookOpen size={16}/> Useful resources</span></div></div></section>
   <section className="faq-content"><div className="home-container"><div className="faq-section-heading"><div><span className="eyebrow-label">The answers you need</span><h2>Browse by topic.</h2></div><span>{items.length} PUBLISHED {items.length===1?"ANSWER":"ANSWERS"}</span></div>
    {items.length===0?<div className="faq-fallback-grid">{commonAnswers.map((item,index)=><article key={item.q} className="faq-fallback-card"><span>0{index+1}</span><h3>{item.q}</h3><p>{item.a}</p></article>)}</div>:
     <div className="faq-groups">{Object.entries(grouped).map(([category,categoryItems])=><section key={category}><span className="eyebrow-label">{category}</span><div className="faq-accordion-list">{categoryItems.map(item=><FaqAccordion key={item._id.toString()} item={{_id:item._id.toString(),question:item.question,answer:item.answer}}/>)}</div></section>)}</div>}
   </div></section>
   <section className="faq-bottom"><div className="home-container"><span className="eyebrow-label">Need a more specific answer?</span><h2>Talk to a real person.</h2><p>Tell us what you are trying to do. We will help point you in the right direction.</p><div className="flex flex-wrap justify-center gap-3"><Link href="/contact" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white">Contact the studio <ArrowUpRight size={17}/></Link><Link href="/help" className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold" style={{color:"var(--text-primary)"}}>Visit the Help Centre <BookOpen size={16}/></Link></div></div></section>
  </main>
 );
}
