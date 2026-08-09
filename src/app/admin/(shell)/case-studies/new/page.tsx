import CaseStudyForm from "@/components/admin/CaseStudyForm";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanCreate } from "@/lib/auth/pageGuards";

export default async function NewCaseStudyPage() {
  const session = await getServerSession();
  guardCanCreate(session!, "caseStudies");
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">New Case Study</h1>
      <div className="mt-8">
        <CaseStudyForm mode="create" />
      </div>
    </div>
  );
}
