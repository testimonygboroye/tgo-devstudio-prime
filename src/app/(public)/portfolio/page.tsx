import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Layers3 } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import PublicEmptyState from "@/components/public/PublicEmptyState";
import SmartImage from "@/components/public/SmartImage";
import { getPublicPageContent } from "@/lib/publicSite/getPublicPageContent";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublicPageContent("portfolio");
  return { title: page.metaTitle, description: page.metaDescription, alternates: { canonical: "/portfolio" } };
}
interface PageProps { searchParams: Promise<{ tag?: string }> }

export default async function PortfolioPage({ searchParams }: PageProps) {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  await connectToDatabase();
  const page = await getPublicPageContent("portfolio");
  const { tag } = await searchParams;
  const rawProjects = await Project.find({ publishStatus: "published" }).sort({ featured: -1, createdAt: -1 }).lean();
  const allProjects = rawProjects.map((project) => getLocalizedContent(project, locale, TRANSLATABLE_FIELDS.Project));
  const allTags = Array.from(new Set(allProjects.flatMap((project) => project.tags || []))).sort();
  const projects = tag ? allProjects.filter((project) => project.tags?.includes(tag)) : allProjects;

  return (
    <main className="portfolio-page">
      <section className="portfolio-hero"><div className="home-container"><span className="eyebrow-label">{page.heroEyebrow}</span><h1>{page.heroHeadline}<br/><em>{page.heroAccent}</em></h1><p>{page.heroDescription}</p><div className="portfolio-hero-foot"><span><Layers3 size={17}/>{page.heroNote || "Product thinking, design and engineering."}</span><span>{allProjects.length} published {allProjects.length===1?"case study":"case studies"}</span></div></div></section>
      <section className="portfolio-content"><div className="home-container">
        <div className="portfolio-section-intro"><span className="eyebrow-label">{page.introEyebrow}</span><h2>{page.introHeading}</h2><p>{page.introDescription}</p></div>
        {allTags.length>0&&<nav className="portfolio-filters" aria-label="Filter projects"><Link href="/portfolio" className={!tag?"is-active":""}>{t("common.all")} <span>{allProjects.length}</span></Link>{allTags.map(item=><Link key={item} href={"/portfolio?tag="+encodeURIComponent(item)} className={tag===item?"is-active":""}>{item}<span>{allProjects.filter(project=>project.tags?.includes(item)).length}</span></Link>)}</nav>}
        {projects.length===0?<PublicEmptyState eyebrow="Selected work" title={tag?"No published projects match this filter yet.":"Every strong case study begins with a real problem."} description={tag?"Try another project category, or contact us if you are looking for a particular capability.":"We are continually shaping and documenting our work. If you have a challenge in mind, let's talk about what a thoughtful solution could look like."} primaryHref={tag?"/portfolio":"/contact"} primaryLabel={tag?"View all projects":"Start a conversation"} secondaryHref="/services" secondaryLabel="Explore capabilities"/>:
          <div className="portfolio-grid">{projects.map((project,index)=><Link key={project._id.toString()} href={"/portfolio/"+project.slug} className="portfolio-card"><div className="portfolio-card-image"><SmartImage src={project.images?.[0]?.url} alt={project.images?.[0]?.altText||project.title} label={project.title}/><span className="portfolio-card-count">PROJECT / {String(index+1).padStart(2,"0")}</span><span className="portfolio-card-arrow"><ArrowUpRight size={20}/></span></div><div className="portfolio-card-copy"><div><small>{project.tags?.slice(0,2).join(" · ")||"Digital product engineering"}</small><h2>{project.title}</h2><p>{project.summary}</p></div><ArrowUpRight size={20}/></div></Link>)}</div>}
      </div></section>
    </main>
  );
}
