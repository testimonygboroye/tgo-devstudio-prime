import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import CaseStudyForm from "@/components/admin/CaseStudyForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCaseStudyPage({ params }: PageProps) {
  const session = await getServerSession();
  guardCanEdit(session!, "caseStudies");
  const { id } = await params;
  await connectToDatabase();
  const project = await Project.findById(id).lean();

  if (!project) {
    notFound();
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Edit Case Study</h1>
      <div className="mt-8">
        <CaseStudyForm
          mode="edit"
          projectId={id}
          initialData={{
            title: project.title,
            summary: project.summary,
            problemStatement: project.problemStatement,
            approach: project.approach,
            outcome: project.outcome,
            projectUrl: project.projectUrl,
            repoUrl: project.repoUrl,
            tags: project.tags,
            status: project.status,
            featured: project.featured,
            publishStatus: project.publishStatus,
            images: project.images,
          }}
        />
      </div>
    </div>
  );
}
