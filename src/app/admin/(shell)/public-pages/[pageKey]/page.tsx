import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import PublicPageContentEditor from "@/components/admin/PublicPageContentEditor";
import { getAdminBasePath } from "@/lib/adminPath";
import type { PublicPageKey } from "@/models/PublicPageContent";
import { ArrowLeft } from "lucide-react";

export default async function PublicPageContentAdmin({ params }: { params: Promise<{ pageKey: string }> }) {
  const session = await getServerSession();
  guardCanEdit(session!, "pageContent");
  const { pageKey } = await params;
  const pageTitles: Record<PublicPageKey, string> = {
    industries: "Industries page",
    "engagement-models": "Engagement Models page",
    about: "About page",
    contact: "Contact page",
    process: "Our Process page",
    services: "Services page",
    portfolio: "Portfolio page",
    blog: "Blog page",
    team: "Team page",
    careers: "Careers page",
    testimonials: "Testimonials page",
    stack: "Technology Stack page",
    help: "Help Centre page",
    "book-a-call": "Book a Call page",
    "services-catalogue": "Service Catalogue page",
    faq: "FAQ page",
  };
  const pageKeyValue = pageKey as PublicPageKey;
  const title = pageTitles[pageKeyValue];
  if (!title) notFound();
  const basePath = getAdminBasePath();
  return (
    <div>
      <Link href={basePath + "/public-pages"} className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-cyan-300"><ArrowLeft size={15}/>All landing pages</Link>
      <p className="mt-5 font-mono text-xs uppercase tracking-widest text-neutral-400">Website Content · Landing pages</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">{title}</h1>
      <div className="mt-8"><PublicPageContentEditor pageKey={pageKeyValue}/></div>
    </div>
  );
}
