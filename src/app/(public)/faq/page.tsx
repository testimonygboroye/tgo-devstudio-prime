import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, MessageCircleQuestion, ShieldCheck } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import FaqItem from "@/models/FaqItem";
import FaqAccordion from "./FaqAccordion";
import { getPublicPageContent } from "@/lib/publicSite/getPublicPageContent";

export const dynamic = "force-dynamic";
export async function generateMetadata():Promise<Metadata>{const page=await getPublicPageContent("faq");return {title:page.metaTitle,description:page.metaDescription,alternates:{canonical:"/faq"}};}



export default async function FaqPage(){
 const page=await getPublicPageContent("faq");
 await connectToDatabase();
 const items=await FaqItem.find({publishStatus:"published"}).sort({category:1,displayOrder:1}).lean();
 const grouped=items.reduce<Record<string,typeof items>>((acc,item)=>{if(!acc[item.category])acc[item.category]=[];acc[item.category].push(item);return acc;},{});
 return(
  <main className="faq-page">
   <section className="faq-hero"><div className="home-container"><span className="eyebrow-label">{page.heroEyebrow}</span><h1>{page.heroHeadline}<br/><em>{page.heroAccent}</em></h1><p>{page.heroDescription}</p><div className="faq-hero-points"><span><MessageCircleQuestion size={16}/> Straightforward guidance</span><span><ShieldCheck size={16}/> Clear expectations</span><span><BookOpen size={16}/> Useful resources</span></div></div></section>
   <section className="faq-content"><div className="home-container"><div className="faq-section-heading"><div><span className="eyebrow-label">{page.introEyebrow}</span><h2>{page.introHeading}</h2><p>{page.introDescription}</p></div><span>{items.length} PUBLISHED {items.length===1?"ANSWER":"ANSWERS"}</span></div>
    {items.length===0?<div className="faq-fallback-grid">{page.cards.map((item,index)=><article key={item.title} className="faq-fallback-card"><span>{item.eyebrow||"0"+(index+1)}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>:
     <div className="faq-groups">{Object.entries(grouped).map(([category,categoryItems])=><section key={category}><span className="eyebrow-label">{category}</span><div className="faq-accordion-list">{categoryItems.map(item=><FaqAccordion key={item._id.toString()} item={{_id:item._id.toString(),question:item.question,answer:item.answer}}/>)}</div></section>)}</div>}
   </div></section>
   <section className="faq-bottom"><div className="home-container"><span className="eyebrow-label">{page.ctaEyebrow}</span><h2>{page.ctaHeading}</h2><p>{page.ctaDescription}</p><div className="flex flex-wrap justify-center gap-3"><Link href={page.ctaPrimaryHref} className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white">{page.ctaPrimaryLabel} <ArrowUpRight size={17}/></Link>{page.ctaSecondaryLabel&&<Link href={page.ctaSecondaryHref} className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold" style={{color:"var(--text-primary)"}}>{page.ctaSecondaryLabel} <BookOpen size={16}/></Link>}</div></div></section>
  </main>
 );
}
