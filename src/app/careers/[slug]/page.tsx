import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import JobOpening from "@/models/JobOpening";
import JobApplicationForm from "@/components/public/JobApplicationForm";

export const revalidate = 300;

const EMPLOYMENT_INFO: Record<string, { label: string; description: string }> = {
  "full-time": { label: "Full-time", description: "A standard, ongoing full working-week role." },
  "part-time": { label: "Part-time", description: "Fewer than full-time hours, ongoing role." },
  contract: { label: "Contract", description: "A fixed-term engagement for a specific project or duration." },
  internship: { label: "Internship", description: "A structured, time-limited learning role." },
  freelance: { label: "Freelance", description: "Project-based, flexible engagement without long-term commitment." },
};

const LOCATION_INFO: Record<string, { label: string; description: string }> = {
  remote: { label: "Remote", description: "Work from anywhere." },
  onsite: { label: "Onsite", description: "Based at our physical office location." },
  hybrid: { label: "Hybrid", description: "A mix of remote and in-office work." },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getJob(slug: string) {
  await connectToDatabase();
  return JobOpening.findOne({ slug, publishStatus: "published" }).lean();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);

  if (!job) {
    return { title: "Job Opening Not Found | TGO DevStudio Prime" };
  }

  return {
    title: `${job.title} | Careers | TGO DevStudio Prime`,
    description: job.summary,
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const job = await getJob(slug);

  if (!job) {
    notFound();
  }

  const locationInfo = LOCATION_INFO[job.locationType];
  const employmentInfo = EMPLOYMENT_INFO[job.employmentType];

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <article className="mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Careers</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">{job.title}</h1>
        {job.department && <p className="mt-2 text-brand-cyan-300">{job.department}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-base-800 bg-base-900 p-4">
            <p className="text-sm font-semibold text-neutral-100">{locationInfo.label}</p>
            <p className="mt-1 text-xs text-neutral-400">{locationInfo.description}</p>
          </div>
          <div className="rounded-lg border border-base-800 bg-base-900 p-4">
            <p className="text-sm font-semibold text-neutral-100">{employmentInfo.label}</p>
            <p className="mt-1 text-xs text-neutral-400">{employmentInfo.description}</p>
          </div>
        </div>

        <p className="mt-8 text-neutral-100/80">{job.summary}</p>

        {job.responsibilities && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-neutral-100">Responsibilities</h2>
            <p className="mt-2 whitespace-pre-line text-neutral-100/70">{job.responsibilities}</p>
          </div>
        )}

        {job.requirements && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-neutral-100">Requirements</h2>
            <p className="mt-2 whitespace-pre-line text-neutral-100/70">{job.requirements}</p>
          </div>
        )}

        <div className="mt-12 border-t border-base-800 pt-8">
          <h2 className="text-xl font-semibold text-neutral-100">Apply for this role</h2>
          <div className="mt-6">
            <JobApplicationForm jobId={job._id.toString()} />
          </div>

          {(job.applyUrl || job.applyEmail) && (
            <div className="mt-8 border-t border-base-800 pt-6">
              <p className="text-sm text-neutral-400">You can also apply directly via:</p>
              <div className="mt-3 flex gap-3">
                {job.applyUrl && (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-base-800 px-4 py-2 text-sm text-neutral-100 hover:bg-base-900"
                  >
                    External Application Link
                  </a>
                )}
                {job.applyEmail && (
                  <a
                    href={`mailto:${job.applyEmail}?subject=${encodeURIComponent(`Application: ${job.title}`)}`}
                    className="rounded-md border border-base-800 px-4 py-2 text-sm text-neutral-100 hover:bg-base-900"
                  >
                    Email Directly
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </article>
    </main>
  );
}
