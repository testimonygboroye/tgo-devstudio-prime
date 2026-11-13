import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Users, Sparkles } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import TeamMember from "@/models/TeamMember";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import PublicEmptyState from "@/components/public/PublicEmptyState";
import SmartImage from "@/components/public/SmartImage";
import { getPublicPageContent } from "@/lib/publicSite/getPublicPageContent";

export const dynamic = "force-dynamic";
export async function generateMetadata():Promise<Metadata>{const page=await getPublicPageContent("team");return {title:page.metaTitle,description:page.metaDescription,alternates:{canonical:"/team"}};}

export default async function TeamPage(){
  const locale=await getServerLocale();
  const page=await getPublicPageContent("team");
  await connectToDatabase();
  const rawMembers=await TeamMember.find({publishStatus:"published"}).sort({featured:-1,displayOrder:1,createdAt:1}).lean();
  const teamMembers=rawMembers.map(member=>getLocalizedContent(member,locale,TRANSLATABLE_FIELDS.TeamMember));
  return (
    <main className="team-page">
      <section className="team-hero"><div className="home-container"><span className="eyebrow-label">{page.heroEyebrow}</span><h1>{page.heroHeadline}<br/><em>{page.heroAccent}</em></h1><p>{page.heroDescription}</p><div className="team-hero-foot"><span><Users size={16}/> {page.heroNote || "A thoughtful, hands-on studio"}</span><span><Sparkles size={16}/> Care in every detail</span></div></div></section>
      <section className="team-content"><div className="home-container"><div className="team-section-intro"><div><span className="eyebrow-label">{page.introEyebrow}</span><h2>{page.introHeading}</h2></div><p>{page.introDescription}</p></div>
        {teamMembers.length===0?<PublicEmptyState eyebrow="People behind the work" title="A considered, hands-on approach to engineering." description="TGO DevStudio brings together product thinking and software engineering to turn complex requirements into dependable digital experiences. Contact us to discuss the people and expertise your project needs." primaryHref="/contact" primaryLabel="Meet us through a project" secondaryHref="/about" secondaryLabel="About the studio"/>:
        <div className="team-grid">{teamMembers.map((member,index)=><Link key={member._id.toString()} href={"/team/"+member.slug} className="team-member-card"><div className="team-member-photo"><SmartImage src={member.photo?.url} alt={member.photo?.altText||member.name} label={member.name}/><span>0{index+1}</span></div><div className="team-member-copy"><small>{member.jobTitle}</small><h3>{member.name}</h3><p>{member.bio}</p><b>Meet {member.name.split(" ")[0]} <ArrowUpRight size={16}/></b></div></Link>)}</div>}
      </div></section>
      <section className="team-bottom-cta"><div className="home-container"><span className="eyebrow-label">{page.ctaEyebrow}</span><h2>{page.ctaHeading}</h2><p>{page.ctaDescription}</p><Link href={page.ctaPrimaryHref} className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-white">{page.ctaPrimaryLabel} <ArrowUpRight size={18}/></Link></div></section>
    </main>
  );
}
