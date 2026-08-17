"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ApplicationListItem {
  _id: string;
  applicantName: string;
  applicantEmail: string;
  status: string;
  createdAt: string;
  jobOpening: { _id: string; title: string } | null;
}

interface JobOption {
  _id: string;
  title: string;
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-brand-cyan-400/20 text-brand-cyan-300",
  reviewed: "bg-neutral-600/30 text-neutral-300",
  shortlisted: "bg-brand-violet-600/20 text-brand-cyan-300",
  rejected: "bg-red-500/20 text-red-300",
  hired: "bg-green-500/20 text-green-300",
};

const PAGE_SIZE = 10;

export default function ApplicationsListClient() {
  const pathname = usePathname();
  const basePathSegment = `/${pathname.split("/").filter(Boolean)[0]}`;

  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [jobFilter, setJobFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (jobFilter) params.set("jobOpening", jobFilter);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/applications?${params.toString()}`);
    const data = await res.json();

    if (data.status !== "ok") {
      setError(data.message || "Failed to load applications.");
      setIsLoading(false);
      return;
    }

    setApplications(data.applications);
    setJobs(data.jobs);
    setIsLoading(false);
  }, [jobFilter, statusFilter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    setCurrentPage(1);
  }, [jobFilter, statusFilter, searchQuery]);

  const filteredApplications = useMemo(() => {
    if (!searchQuery.trim()) return applications;
    const term = searchQuery.toLowerCase();
    return applications.filter(
      (app) =>
        app.applicantName.toLowerCase().includes(term) ||
        app.applicantEmail.toLowerCase().includes(term)
    );
  }, [applications, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const pageItems = filteredApplications.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Job Applications</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full max-w-xs rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
        <select
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100"
        >
          <option value="">All job openings</option>
          {jobs.map((job) => (
            <option key={job._id} value={job._id}>
              {job.title}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
          <option value="hired">Hired</option>
        </select>
      </div>

      {searchQuery && (
        <p className="mt-2 text-xs text-neutral-500">Showing results for "{searchQuery}"</p>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-neutral-400">Loading applications...</p>}

        {!isLoading && pageItems.length === 0 && (
          <p className="text-neutral-400">No applications match these filters.</p>
        )}

        {!isLoading &&
          pageItems.map((app) => (
            <Link
              key={app._id}
              href={`${basePathSegment}/applications/${app._id}`}
              className="block rounded-lg border border-base-800 bg-base-900 p-4 hover:border-brand-cyan-400"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-100">{app.applicantName}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[app.status] || ""}`}>
                  {app.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-400">{app.applicantEmail}</p>
              <p className="mt-1 text-sm text-neutral-500">
                Applied for: {app.jobOpening?.title || "Unknown role"} ·{" "}
                {new Date(app.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-md border border-base-800 px-3 py-1.5 text-neutral-100 hover:bg-base-900 disabled:pointer-events-none disabled:text-neutral-600"
          >
            ← Previous
          </button>
          <span className="text-neutral-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-base-800 px-3 py-1.5 text-neutral-100 hover:bg-base-900 disabled:pointer-events-none disabled:text-neutral-600"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
