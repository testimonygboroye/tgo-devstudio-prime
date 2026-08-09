import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import JobOpening from "@/models/JobOpening";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import JobOpeningForm from "@/components/admin/JobOpeningForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJobOpeningPage({ params }: PageProps) {
  const session = await getServerSession();
  guardCanEdit(session!, "jobOpenings");
  const { id } = await params;
  await connectToDatabase();
  const job = await JobOpening.findById(id).lean();

  if (!job) {
    notFound();
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Edit Job Opening</h1>
      <div className="mt-8">
        <JobOpeningForm
          mode="edit"
          jobId={id}
          initialData={{
            title: job.title,
            department: job.department,
            locationType: job.locationType,
            employmentType: job.employmentType,
            summary: job.summary,
            responsibilities: job.responsibilities,
            requirements: job.requirements,
            applyEmail: job.applyEmail,
            applyUrl: job.applyUrl,
            publishStatus: job.publishStatus,
          }}
        />
      </div>
    </div>
  );
}
