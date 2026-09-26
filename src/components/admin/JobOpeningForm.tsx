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

      if (window.history.length > 1) {
        router.back();
      } else {
        const listPath = window.location.pathname.replace(/\/[^/]+\/?$/, "");
        router.push(listPath);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="surface-card p-6 sm:p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Title</label>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="input-premium mt-1.5"
            placeholder="Job title..."
          />
          <CharacterCounter current={title.length} max={TEXT_LIMITS.job.title} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Department (optional)</label>
          <input
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className="input-premium mt-1.5"
            placeholder="e.g. Engineering"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Location Type</label>
            <select
              value={locationType}
              onChange={(event) => setLocationType(event.target.value)}
              className="select-premium mt-1.5"
            >
              <option value="remote">Remote</option>
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Employment Type</label>
            <select
              value={employmentType}
              onChange={(event) => setEmploymentType(event.target.value)}
              className="select-premium mt-1.5"
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
          <label className="block text-sm font-medium text-[var(--text-primary)]">Summary</label>
          <textarea
            required
            rows={3}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className="textarea-premium mt-1.5"
            placeholder="Job summary..."
          />
          <CharacterCounter current={summary.length} max={TEXT_LIMITS.job.summary} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Responsibilities</label>
          <textarea
            rows={5}
            value={responsibilities}
            onChange={(event) => setResponsibilities(event.target.value)}
            className="textarea-premium mt-1.5"
            placeholder="Key responsibilities..."
          />
          <CharacterCounter current={responsibilities.length} max={TEXT_LIMITS.job.responsibilities} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Requirements</label>
          <textarea
            rows={5}
            value={requirements}
            onChange={(event) => setRequirements(event.target.value)}
            className="textarea-premium mt-1.5"
            placeholder="Candidate requirements..."
          />
          <CharacterCounter current={requirements.length} max={TEXT_LIMITS.job.requirements} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Apply Email</label>
            <input
              type="email"
              value={applyEmail}
              onChange={(event) => setApplyEmail(event.target.value)}
              className="input-premium mt-1.5"
              placeholder="careers@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Apply URL</label>
            <input
              value={applyUrl}
              onChange={(event) => setApplyUrl(event.target.value)}
              className="input-premium mt-1.5"
              placeholder="https://..."
            />
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Provide at least one of apply email or apply URL.</p>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Publish Status</label>
          <select
            value={publishStatus}
            onChange={(event) => setPublishStatus(event.target.value)}
            className="select-premium mt-1.5"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="btn-premium-primary rounded-xl px-6 py-3 font-semibold text-white shadow-lg shadow-brand-violet-600/20 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : mode === "create" ? "Create Job Opening" : "Save Changes"}
        </button>

        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border border-red-400/40 bg-[var(--bg-surface)] px-6 py-3 text-sm font-semibold text-red-400 hover:bg-red-400/10 transition-all"
          >
            Delete Job Opening
          </button>
        )}
      </div>
    </form>
  );
}
