"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CharacterCounter from "./CharacterCounter";
import { TEXT_LIMITS } from "@/lib/constants/textLimits";

interface JobOpeningFormProps {
  mode: "create" | "edit";
  jobId?: string;
  initialData?: {
    title: string;
    department?: string;
    locationType: string;
    employmentType: string;
    summary: string;
    responsibilities: string;
    requirements: string;
    applyEmail?: string;
    applyUrl?: string;
    publishStatus: string;
  };
}

export default function JobOpeningForm({ mode, jobId, initialData }: JobOpeningFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [department, setDepartment] = useState(initialData?.department ?? "");
  const [locationType, setLocationType] = useState(initialData?.locationType ?? "remote");
  const [employmentType, setEmploymentType] = useState(initialData?.employmentType ?? "full-time");
  const [summary, setSummary] = useState(initialData?.summary ?? "");
  const [responsibilities, setResponsibilities] = useState(initialData?.responsibilities ?? "");
  const [requirements, setRequirements] = useState(initialData?.requirements ?? "");
  const [applyEmail, setApplyEmail] = useState(initialData?.applyEmail ?? "");
  const [applyUrl, setApplyUrl] = useState(initialData?.applyUrl ?? "");
  const [publishStatus, setPublishStatus] = useState(initialData?.publishStatus ?? "draft");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!applyEmail.trim() && !applyUrl.trim()) {
      setError("Provide at least an apply email or an apply URL.");
      return;
    }

    setIsSaving(true);

    const payload = {
      title,
      department: department || undefined,
      locationType,
      employmentType,
      summary,
      responsibilities,
      requirements,
      applyEmail: applyEmail || undefined,
      applyUrl: applyUrl || undefined,
      publishStatus,
    };

    try {
      const response = await fetch(mode === "create" ? "/api/careers" : `/api/careers/${jobId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save job opening.");
        return;
      }

      const listPath = window.location.pathname.replace(/\/careers\/(new|[^/]+)\/?$/, "/careers");
      router.push(listPath);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!jobId) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this job opening? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/careers/${jobId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to delete job opening.");
        return;
      }

      const listPath = window.location.pathname.replace(/\/careers\/[^/]+\/?$/, "/careers");
      router.push(listPath);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <label className="block text-sm text-neutral-400">Title</label>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
        <CharacterCounter current={title.length} max={TEXT_LIMITS.job.title} />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Department (optional)</label>
        <input
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">Location Type</label>
          <select
            value={locationType}
            onChange={(event) => setLocationType(event.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          >
            <option value="remote">Remote</option>
            <option value="onsite">Onsite</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Employment Type</label>
          <select
            value={employmentType}
            onChange={(event) => setEmploymentType(event.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          >
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Summary</label>
        <textarea
          required
          rows={2}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
        <CharacterCounter current={summary.length} max={TEXT_LIMITS.job.summary} />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Responsibilities</label>
        <textarea
          rows={5}
          value={responsibilities}
          onChange={(event) => setResponsibilities(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
        <CharacterCounter current={responsibilities.length} max={TEXT_LIMITS.job.responsibilities} />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Requirements</label>
        <textarea
          rows={5}
          value={requirements}
          onChange={(event) => setRequirements(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
        <CharacterCounter current={requirements.length} max={TEXT_LIMITS.job.requirements} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">Apply Email</label>
          <input
            type="email"
            value={applyEmail}
            onChange={(event) => setApplyEmail(event.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Apply URL</label>
          <input
            value={applyUrl}
            onChange={(event) => setApplyUrl(event.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
      </div>
      <p className="text-xs text-neutral-400">Provide at least one of the above.</p>

      <div>
        <label className="block text-sm text-neutral-400">Publish Status</label>
        <select
          value={publishStatus}
          onChange={(event) => setPublishStatus(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md brand-gradient-bg px-5 py-2 font-semibold text-base-950 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : mode === "create" ? "Create Job Opening" : "Save Changes"}
        </button>

        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md border border-red-400/40 px-5 py-2 text-sm text-red-400 hover:bg-red-400/10"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
