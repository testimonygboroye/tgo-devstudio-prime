import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, BriefcaseBusiness, Globe2, Sparkles } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import JobOpening from "@/models/JobOpening";
import { getPublicPageContent } from "@/lib/publicSite/getPublicPageContent";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { const page=await getPublicPageContent("careers"); return { title:page.metaTitle,description:page.metaDescription,openGraph:{title:page.metaTitle,description:page.metaDescription,type:"website"},alternates:{canonical:"/careers"} }; }
const EMPLOYMENT_LABELS: Record<string,string> = {"full-time":"Full-time","part-time":"Part-time",contract:"Contract",internship:"Internship",freelance:"Freelance"};
const LOCATION_LABELS: Record<string,string> = {remote:"Remote",onsite:"Onsite",hybrid:"Hybrid"};

export default async function CareersPage(){
  await connectToDatabase();
  const page=await getPublicPageContent("careers");
  const jobs=await JobOpening.find({publishStatus:"published"}).sort({createdAt:-1}).lean();
  return (
    <main className="careers-page">
      <section className="careers-hero"><div className="home-container"><span className="eyebrow-label">{page.heroEyebrow}</span><h1>{page.heroHeadline}<br/><em>{page.heroAccent}</em></h1><p>{page.heroDescription}</p><div className="careers-hero-points"><span><Sparkles size={16}/> Thoughtful craft</span><span><Globe2 size={16}/> Flexible collaboration</span><span><BriefcaseBusiness size={16}/> Meaningful work</span></div></div></section>
      <section className="careers-openings"><div className="home-container"><div className="careers-section-heading"><div><span className="eyebrow-label">{page.introEyebrow}</span><h2>{page.introHeading}</h2><p>{page.introDescription}</p></div><span className="careers-count">{jobs.length} {jobs.length===1?"OPEN ROLE":"OPEN ROLES"}</span></div>
        {jobs.length===0?<div className="careers-empty"><span className="careers-empty-icon"><BriefcaseBusiness size={25}/></span><h3>No open roles right now.</h3><p>We don’t have any positions open at the moment, but we’re always interested in hearing from talented people. Check back soon or introduce yourself.</p><Link href="/contact" className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold" style={{color:"var(--text-primary)"}}>Introduce yourself <ArrowUpRight size={16}/></Link></div>:
        <div className="careers-job-grid">{jobs.map(job=><Link key={job._id.toString()} href={"/careers/"+job.slug} className="careers-job-card"><div className="careers-job-top"><span>{job.department||"TGO DevStudio"}</span><ArrowUpRight size={19}/></div><h3>{job.title}</h3><p>{job.summary}</p><div className="careers-job-tags"><span>{LOCATION_LABELS[job.locationType]}</span><span>{EMPLOYMENT_LABELS[job.employmentType]}</span></div><b>View role details <ArrowUpRight size={15}/></b></Link>)}</div>}
      </div></section>
      <section className="careers-bottom"><div className="home-container"><span className="eyebrow-label">No matching role?</span><h2>Good people make good work.</h2><p>We may not have the right opening today. You can still introduce yourself and tell us what you would love to contribute.</p><Link href="/contact" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white">Introduce yourself <ArrowUpRight size={17}/></Link></div></section>
    </main>
  );
}
