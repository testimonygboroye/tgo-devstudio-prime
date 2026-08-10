import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import ProcessStep from "@/models/ProcessStep";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import ProcessStepForm from "@/components/admin/ProcessStepForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProcessStepPage({ params }: PageProps) {
  const session = await getServerSession();
  guardCanEdit(session!, "processSteps");
  const { id } = await params;
  await connectToDatabase();
  const step = await ProcessStep.findById(id).lean();

  if (!step) {
    notFound();
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Edit Process Step</h1>
      <div className="mt-8">
        <ProcessStepForm
          mode="edit"
          stepId={id}
          initialData={{
            title: step.title,
            description: step.description,
            displayOrder: step.displayOrder,
            publishStatus: step.publishStatus,
          }}
        />
      </div>
    </div>
  );
}
