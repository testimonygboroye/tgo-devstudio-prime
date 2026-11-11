import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Users, Sparkles } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import TeamMember from "@/models/TeamMember";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import PublicEmptyState from "@/components/public/PublicEmptyState";
import SmartImage from "@/components/public/SmartImage";

export const revalidate=300;
export const metadata:Metadata={title:"Team | TGO DevStudio Prime",description:"Meet the team behind TGO DevStudio.",alternates:{canonical:"/team"}};

export default async function TeamPage(){
  const locale=await getServerLocale();
  const t=createTranslator(locale);
  await connectToDatabase();
  const rawMembers=await TeamMember.find({publishStatus:"published"}).sort({featured:-1,displayOrder:1,createdAt:1}).lean();
  const teamMembers=rawMembers.map(member=>getLocalizedContent(member,locale,TRANSLATABLE_FIELDS.TeamMember));
  return (
    <main className="team-page">
      <section className="team-hero"><div className="home-container"><span className="eyebrow-label">{t("nav.team")} · PEOPLE BEHIND THE WORK</span><h1>Good technology<br/><em>starts with people.</em></h1><p>{t("team.subtitle")}</p><div className="team-hero-foot"><span><Users size={16}/> A thoughtful, hands-on studio</span><span><Sparkles size={16}/> Care in every detail</span></div></div></section>
      <section className="team-content"><div className="home-container"><div className="team-section-intro"><div><span className="eyebrow-label">Meet the studio</span><h2>Different strengths.<br/>One shared standard.</h2></div><p>We value clear communication, technical ownership and a genuine care for the people who use what we build.</p></div>
        {teamMembers.length===0?<PublicEmptyState eyebrow="People behind the work" title="A considered, hands-on approach to engineering." description="TGO DevStudio brings together product thinking and software engineering to turn complex requirements into dependable digital experiences. Contact us to discuss the people and expertise your project needs." primaryHref="/contact" primaryLabel="Meet us through a project" secondaryHref="/about" secondaryLabel="About the studio"/>:
        <div className="team-grid">{teamMembers.map((member,index)=><Link key={member._id.toString()} href={"/team/"+member.slug} className="team-member-card"><div className="team-member-photo"><SmartImage src={member.photo?.url} alt={member.photo?.altText||member.name} label={member.name}/><span>0{index+1}</span></div><div className="team-member-copy"><small>{member.jobTitle}</small><h3>{member.name}</h3><p>{member.bio}</p><b>Meet {member.name.split(" ")[0]} <ArrowUpRight size={16}/></b></div></Link>)}</div>}
      </div></section>
      <section className="team-bottom-cta"><div className="home-container"><span className="eyebrow-label">Work with the studio</span><h2>Bring the right people<br/>around the right problem.</h2><Link href="/contact" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-white">Start a conversation <ArrowUpRight size={18}/></Link></div></section>
    </main>
  );
}
