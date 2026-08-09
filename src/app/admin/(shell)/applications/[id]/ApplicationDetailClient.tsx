"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface ApplicationDetail {
  _id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  coverMessage: string;
  profilePhotoUrl: string;
  resumeUrl: string;
  status: string;
  createdAt: string;
  jobOpening: { _id: string; title: string } | null;
}

const STATUS_OPTIONS = ["new", "reviewed", "shortlisted", "rejected", "hired"];

export default function ApplicationDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const basePathSegment = `/${pathname.split("/").filter(Boolean)[0]}`;

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/applications/${id}`);
      const data = await res.json();
      if (data.status !== "ok") {
        setError(data.message || "Failed to load application.");
        setIsLoading(false);
        return;
      }
      setApplication(data.application);
      setIsLoading(false);
    }
    load();
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    setIsSaving(true);
    setError("");
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.status !== "ok") {
      setError(data.message || "Failed to update status.");
      setIsSaving(false);
      return;
    }
    setApplication(data.application);
    setIsSaving(false);
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete the application from ${application?.applicantName}? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.status !== "ok") {
      setError(data.message || "Failed to delete application.");
      setIsDeleting(false);
      return;
    }
    router.push(`${basePathSegment}/applications`);
  }

  if (isLoading) {
    return <p className="text-neutral-400">Loading application...</p>;
  }

  if (!application) {
    return <p className="text-red-400">{error || "Application not found."}</p>;
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">{application.applicantName}</h1>
      <p className="mt-1 text-neutral-400">
        Applied for: {application.jobOpening?.title || "Unknown role"} ·{" "}
        {new Date(application.createdAt).toLocaleString()}
      </p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-8 grid gap-8 sm:grid-cols-[160px_1fr]">
        <img
          src={application.profilePhotoUrl}
          alt={application.applicantName}
          className="h-40 w-40 rounded-lg object-cover"
        />

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">Email</p>
            <p className="text-neutral-100">{application.applicantEmail}</p>
          </div>

          {application.applicantPhone && (
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-500">Phone</p>
              <p className="text-neutral-100">{application.applicantPhone}</p>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">Resume</p>
            <a
              href={application.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-cyan-300 hover:underline"
            >
              View resume
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Cover message</p>
        <p className="mt-2 whitespace-pre-wrap text-neutral-100">{application.coverMessage}</p>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-base-800 pt-6">
        <div>
          <p className="mb-1 text-xs uppercase tracking-widest text-neutral-500">Status</p>
          <select
            value={application.status}
            disabled={isSaving}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="ml-auto rounded-md border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete Application"}
        </button>
      </div>
    </div>
  );
}
