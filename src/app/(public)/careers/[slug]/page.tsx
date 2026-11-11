import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, MapPin } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import JobOpening from "@/models/JobOpening";
import JobApplicationForm from "@/components/public/JobApplicationForm";

export const revalidate=300;
const EMPLOYMENT_INFO:Record<string,{label:string;description:string}>={"full-time":{label:"Full-time",description:"A standard, ongoing full working-week role."},"part-time":{label:"Part-time",description:"Fewer than full-time hours, ongoing role."},contract:{label:"Contract",description:"A fixed-term engagement for a specific project or duration."},internship:{label:"Internship",description:"A structured, time-limited learning role."},freelance:{label:"Freelance",description:"Project-based, flexible engagement without long-term commitment."}};
const LOCATION_INFO:Record<string,{label:string;description:string}>={remote:{label:"Remote",description:"Work from anywhere."},onsite:{label:"Onsite",description:"Based at our physical office location."},hybrid:{label:"Hybrid",description:"A mix of remote and in-office work."}};
interface PageProps{params:Promise<{slug:string}>}
async function getJob(slug:string){await connectToDatabase();return JobOpening.findOne({slug,publishStatus:"published"}).lean();}
export async function generateMetadata({params}:PageProps):Promise<Metadata>{const {slug}=await params;const job=await getJob(slug);if(!job)return{title:"Job Opening Not Found | TGO DevStudio Prime",robots:{index:false,follow:true}};return{title:job.title+" | Careers | TGO DevStudio Prime",description:job.summary,alternates:{canonical:"/careers/"+job.slug}};}

export default async function JobDetailPage({params}:PageProps){
 const {slug}=await params;const job=await getJob(slug);if(!job)notFound();
 const locationInfo=LOCATION_INFO[job.locationType]||{label:"Flexible",description:"Discuss location arrangements with the team."};
 const employmentInfo=EMPLOYMENT_INFO[job.employmentType]||{label:"By agreement",description:"Engagement details will be confirmed during the hiring process."};
 return(
  <main className="career-detail-page"><div className="home-container career-detail-container">
   <Link href="/careers" className="career-detail-back"><ArrowLeft size={16}/> All opportunities</Link>
   <section className="career-detail-hero"><span className="eyebrow-label">Careers · Current opportunity</span><h1>{job.title}</h1>{job.department&&<p className="career-detail-department">{job.department}</p>}<p className="career-detail-summary">{job.summary}</p><div className="career-detail-meta"><div><span><MapPin size={17}/></span><div><b>{locationInfo.label}</b><small>{locationInfo.description}</small></div></div><div><span><BriefcaseBusiness size={17}/></span><div><b>{employmentInfo.label}</b><small>{employmentInfo.description}</small></div></div></div></section>
   <div className="career-detail-layout"><div className="career-detail-description">
    {job.responsibilities&&<section><span className="eyebrow-label">The role</span><h2>What you’ll be working on.</h2><p>{job.responsibilities}</p></section>}
    {job.requirements&&<section><span className="eyebrow-label">What we’re looking for</span><h2>Skills and experience.</h2><p>{job.requirements}</p></section>}
    <section><span className="eyebrow-label">Application process</span><h2>What happens next.</h2><p>Submit your details and relevant experience through the application form. The team will review your information and contact you if your background matches the role and current needs.</p></section>
    {(job.applyUrl||job.applyEmail)&&<section className="career-direct-apply"><span className="eyebrow-label">Alternative application</span><h2>Apply directly.</h2><div className="flex flex-wrap gap-3">{job.applyUrl&&<a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" style={{color:"var(--text-primary)"}}>External application <ArrowUpRight size={15}/></a>}{job.applyEmail&&<a href={"mailto:"+job.applyEmail+"?subject="+encodeURIComponent("Application: "+job.title)} className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" style={{color:"var(--text-primary)"}}>Email directly <ArrowUpRight size={15}/></a>}</div></section>}
   </div><aside className="career-application-panel"><span className="eyebrow-label">Take the next step</span><h2>Apply for this role.</h2><p>Share your details and relevant experience. The team will review your application and follow up if there is a fit.</p><JobApplicationForm jobId={job._id.toString()}/></aside></div>
  </div></main>
 );
}
