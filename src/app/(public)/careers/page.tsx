import Link from "next/link";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import JobOpening from "@/models/JobOpening";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Careers | TGO DevStudio Prime",
  description: "Join TGO DevStudio. Explore current openings or learn about our culture.",
  openGraph: {
    title: "Careers | TGO DevStudio Prime",
    description: "Join TGO DevStudio. Explore current openings or learn about our culture.",
    type: "website",
  },
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

const LOCATION_LABELS: Record<string, string> = {
  remote: "Remote",
  onsite: "Onsite",
  hybrid: "Hybrid",
};

export default async function CareersPage() {
  await connectToDatabase();
  const jobs = await JobOpening.find({ publishStatus: "published" }).sort({ createdAt: -1 }).lean();

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-4xl">
        <span className="eyebrow-label">Careers</span>
        <h1
          className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Join TGO DevStudio
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          We&apos;re a full-stack software engineering studio that cares deeply about craft, clarity,
          and building things that last. We hire people who take pride in getting the details
          right.
        </p>

        {jobs.length === 0 ? (
          <div className="surface-card mt-14">
            <div className="surface-card-inner p-10 text-center">
              <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                No open roles right now
              </p>
              <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
                We don&apos;t have any positions open at the moment, but we&apos;re always
                interested in hearing from talented people. Check back soon, or reach out
                directly if you think you&apos;d be a great fit.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-14 space-y-5">
            {jobs.map((job) => (
              <Link key={job._id.toString()} href={`/careers/${job.slug}`} className="surface-card block">
                <div className="surface-card-inner p-7">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                      {job.title}
                    </h2>
                    <div className="flex gap-2">
                      <span className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                        {LOCATION_LABELS[job.locationType]}
                      </span>
                      <span className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                        {EMPLOYMENT_LABELS[job.employmentType]}
                      </span>
                    </div>
                  </div>
                  {job.department && <p className="mt-1 text-sm text-brand-cyan-300">{job.department}</p>}
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{job.summary}</p>
                  <p className="mt-4 text-xs font-semibold text-brand-cyan-300">View role details →</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
