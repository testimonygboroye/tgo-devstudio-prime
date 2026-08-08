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
  const jobs = await JobOpening.find({ publishStatus: "published" })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Careers</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">Join TGO DevStudio</h1>
        <p className="mt-4 max-w-2xl text-neutral-100/70">
          We're a full-stack software engineering studio that cares deeply about craft, clarity,
          and building things that last. We hire people who take pride in getting the details
          right.
        </p>

        {jobs.length === 0 ? (
          <div className="mt-12 rounded-xl border border-base-800 bg-base-900 p-8 text-center">
            <p className="text-lg font-semibold text-neutral-100">No open roles right now</p>
            <p className="mt-2 text-neutral-400">
              We don't have any positions open at the moment, but we're always interested in
              hearing from talented people. Check back soon, or reach out directly if you think
              you'd be a great fit.
            </p>
          </div>
        ) : (
          <div className="mt-12 space-y-4">
            {jobs.map((job) => (
              <div
                key={job._id.toString()}
                className="rounded-xl border border-base-800 bg-base-900 p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-neutral-100">{job.title}</h2>
                  <div className="flex gap-2">
                    <span className="rounded-full border border-base-800 px-2 py-0.5 text-xs text-neutral-400">
                      {LOCATION_LABELS[job.locationType]}
                    </span>
                    <span className="rounded-full border border-base-800 px-2 py-0.5 text-xs text-neutral-400">
                      {EMPLOYMENT_LABELS[job.employmentType]}
                    </span>
                  </div>
                </div>
                {job.department && (
                  <p className="mt-1 text-sm text-brand-cyan-300">{job.department}</p>
                )}
                <p className="mt-3 text-sm text-neutral-400">{job.summary}</p>

                {job.responsibilities && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-neutral-100">Responsibilities</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-neutral-400">
                      {job.responsibilities}
                    </p>
                  </div>
                )}
                {job.requirements && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-neutral-100">Requirements</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-neutral-400">
                      {job.requirements}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex gap-3">
                  {job.applyUrl && (
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950"
                    >
                      Apply Now
                    </a>
                  )}
                  {job.applyEmail && (
                    <a
                      href={`mailto:${job.applyEmail}?subject=${encodeURIComponent(
                        `Application: ${job.title}`
                      )}`}
                      className="rounded-md border border-base-800 px-4 py-2 text-sm text-neutral-100 hover:bg-base-950"
                    >
                      Apply via Email
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
