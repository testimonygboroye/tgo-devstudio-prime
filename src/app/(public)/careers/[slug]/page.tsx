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
  if (!job) return { title: "Job Opening Not Found | TGO DevStudio Prime" };
  return { title: `${job.title} | Careers | TGO DevStudio Prime`, description: job.summary };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  const locationInfo = LOCATION_INFO[job.locationType];
  const employmentInfo = EMPLOYMENT_INFO[job.employmentType];

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <article className="mx-auto max-w-2xl">
        <span className="eyebrow-label">Careers</span>
        <h1
          className="heading-premium mt-3 text-4xl font-bold brand-gradient-text sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {job.title}
        </h1>
        {job.department && <p className="mt-2 text-brand-cyan-300">{job.department}</p>}

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <div className="surface-card">
            <div className="surface-card-inner p-5">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{locationInfo.label}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{locationInfo.description}</p>
            </div>
          </div>
          <div className="surface-card">
            <div className="surface-card-inner p-5">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{employmentInfo.label}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{employmentInfo.description}</p>
            </div>
          </div>
        </div>

        <p className="mt-9 text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>{job.summary}</p>

        {job.responsibilities && (
          <div className="mt-9">
            <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Responsibilities</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed" style={{ color: "var(--text-secondary)" }}>{job.responsibilities}</p>
          </div>
        )}

        {job.requirements && (
          <div className="mt-9">
            <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Requirements</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed" style={{ color: "var(--text-secondary)" }}>{job.requirements}</p>
          </div>
        )}

        <div className="mt-14 border-t pt-10" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Apply for this role</h2>
          <div className="mt-7">
            <JobApplicationForm jobId={job._id.toString()} />
          </div>

          {(job.applyUrl || job.applyEmail) && (
            <div className="mt-9 border-t pt-7" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>You can also apply directly via:</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {job.applyUrl && (
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-premium-secondary rounded-full px-5 py-2.5 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    External Application Link
                  </a>
                )}
                {job.applyEmail && (
                  <a href={`mailto:${job.applyEmail}?subject=${encodeURIComponent(`Application: ${job.title}`)}`} className="btn-premium-secondary rounded-full px-5 py-2.5 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
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
