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
  if (pageKey !== "industries" && pageKey !== "engagement-models") notFound();
  const title = pageKey === "industries" ? "Industries page" : "Engagement Models page";
  const basePath = getAdminBasePath();
  return (
    <div>
      <Link href={basePath + "/public-pages"} className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-cyan-300"><ArrowLeft size={15}/>All landing pages</Link>
      <p className="mt-5 font-mono text-xs uppercase tracking-widest text-neutral-400">Website Content · Landing pages</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">{title}</h1>
      <div className="mt-8"><PublicPageContentEditor pageKey={pageKey as PublicPageKey}/></div>
    </div>
  );
}
