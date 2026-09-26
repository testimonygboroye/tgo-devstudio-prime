"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CharacterCounter from "@/components/admin/CharacterCounter";
import { TEXT_LIMITS } from "@/lib/constants/textLimits";

interface ProjectImage {
  url: string;
  publicId: string;
  altText: string;
}

interface Metric {
  label: string;
  value: string;
}

interface CaseStudyFormProps {
  mode: "create" | "edit";
  projectId?: string;
  initialData?: {
    title: string;
    summary: string;
    problemStatement: string;
    approach: string;
    outcome: string;
    projectUrl?: string;
    repoUrl?: string;
    tags: string[];
    metrics: Metric[];
    techStack: string[];
    status: string;
    featured: boolean;
    publishStatus: string;
    images: ProjectImage[];
  };
}

export default function CaseStudyForm({ mode, projectId, initialData }: CaseStudyFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [summary, setSummary] = useState(initialData?.summary ?? "");
  const [problemStatement, setProblemStatement] = useState(initialData?.problemStatement ?? "");
  const [approach, setApproach] = useState(initialData?.approach ?? "");
  const [outcome, setOutcome] = useState(initialData?.outcome ?? "");
  const [projectUrl, setProjectUrl] = useState(initialData?.projectUrl ?? "");
  const [repoUrl, setRepoUrl] = useState(initialData?.repoUrl ?? "");
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(", ") ?? "");
  const [metrics, setMetrics] = useState<Metric[]>(initialData?.metrics ?? []);
  const [techStackInput, setTechStackInput] = useState(initialData?.techStack?.join(", ") ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "in-progress");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [publishStatus, setPublishStatus] = useState(initialData?.publishStatus ?? "draft");
  const [images, setImages] = useState<ProjectImage[]>(initialData?.images ?? []);
  const [pendingAltText, setPendingAltText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!pendingAltText.trim()) {
      setError("Please enter alt text for this image before uploading.");
      event.target.value = "";
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "case-studies");

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Image upload failed.");
        return;
      }

      setImages((prev) => [
        ...prev,
        { url: data.url, publicId: data.publicId, altText: pendingAltText.trim() },
      ]);
      setPendingAltText("");
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function removeImage(publicId: string) {
    setImages((prev) => prev.filter((image) => image.publicId !== publicId));
  }

  function addMetric() {
    setMetrics((prev) => [...prev, { label: "", value: "" }]);
  }

  function updateMetric(index: number, field: "label" | "value", value: string) {
    setMetrics((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function removeMetric(index: number) {
    setMetrics((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSavedMessage("");
    setIsSaving(true);

    const payload = {
      title,
      summary,
      problemStatement,
      approach,
      outcome,
      projectUrl: projectUrl || undefined,
      repoUrl: repoUrl || undefined,
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status,
      featured,
      publishStatus,
      images,
      metrics: metrics.filter((m) => m.label.trim() && m.value.trim()),
      techStack: techStackInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch(
        mode === "create" ? "/api/projects" : `/api/projects/${projectId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save case study.");
        return;
      }

      router.refresh();
      setSavedMessage("Saved successfully.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!projectId) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this case study? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to delete case study.");
        return;
      }

      router.refresh();
      setSavedMessage("Saved successfully.");
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
            placeholder="Case study title..."
          />
          <CharacterCounter current={title.length} max={TEXT_LIMITS.project.title} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Summary</label>
          <textarea
            required
            rows={3}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className="textarea-premium mt-1.5"
            placeholder="Executive summary of the project..."
          />
          <CharacterCounter current={summary.length} max={TEXT_LIMITS.project.summary} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Problem</label>
          <textarea
            rows={4}
            value={problemStatement}
            onChange={(event) => setProblemStatement(event.target.value)}
            className="textarea-premium mt-1.5"
            placeholder="Client challenge and technical problem..."
          />
          <CharacterCounter current={problemStatement.length} max={TEXT_LIMITS.project.narrativeSection} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Approach</label>
          <textarea
            rows={4}
            value={approach}
            onChange={(event) => setApproach(event.target.value)}
            className="textarea-premium mt-1.5"
            placeholder="Engineering approach and solution architectural design..."
          />
          <CharacterCounter current={approach.length} max={TEXT_LIMITS.project.narrativeSection} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Outcome</label>
          <textarea
            rows={4}
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            className="textarea-premium mt-1.5"
            placeholder="Results, business impact and quantitative outcomes..."
          />
          <CharacterCounter current={outcome.length} max={TEXT_LIMITS.project.narrativeSection} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Live URL</label>
            <input
              value={projectUrl}
              onChange={(event) => setProjectUrl(event.target.value)}
              className="input-premium mt-1.5"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Repo URL</label>
            <input
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              className="input-premium mt-1.5"
              placeholder="https://github.com/..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Tags (comma-separated)</label>
          <input
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            className="input-premium mt-1.5"
            placeholder="Fintech, WebGL, AI"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Tech Stack (comma-separated)</label>
          <input
            value={techStackInput}
            onChange={(event) => setTechStackInput(event.target.value)}
            placeholder="e.g. Next.js, MongoDB, Cloudinary"
            className="input-premium mt-1.5"
          />
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Results / Metrics</p>
            <button
              type="button"
              onClick={addMetric}
              className="btn-premium-outline rounded-xl px-3 py-1.5 text-xs"
            >
              + Add Metric
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            e.g. Label &quot;Faster Load Times&quot;, Value &quot;40%&quot;
          </p>

          <div className="space-y-2 pt-2">
            {metrics.map((metric, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={metric.label}
                  onChange={(e) => updateMetric(index, "label", e.target.value)}
                  placeholder="Metric label"
                  className="input-premium flex-1 text-sm"
                />
                <input
                  value={metric.value}
                  onChange={(e) => updateMetric(index, "value", e.target.value)}
                  placeholder="Value"
                  className="input-premium w-32 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeMetric(index)}
                  className="rounded-xl border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="select-premium mt-1.5"
            >
              <option value="live">Live</option>
              <option value="in-progress">In Progress</option>
              <option value="concept">Concept</option>
            </select>
          </div>
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

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="featured-case"
            checked={featured}
            onChange={(event) => setFeatured(event.target.checked)}
            className="h-4 w-4 rounded border-[var(--border-subtle)] bg-[var(--bg-surface)] text-brand-violet-600 focus:ring-brand-cyan-400"
          />
          <label htmlFor="featured-case" className="text-sm font-medium text-[var(--text-primary)] cursor-pointer">
            Feature this on the homepage
          </label>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-5 space-y-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Images</p>

          <div className="space-y-2">
            {images.map((image) => (
              <div
                key={image.publicId}
                className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={image.altText} className="h-12 w-12 rounded-lg object-cover" />
                  <span className="text-xs text-[var(--text-secondary)]">{image.altText}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(image.publicId)}
                  className="text-xs font-semibold text-red-400 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-[var(--text-secondary)]">
              Alt text (required before uploading)
            </label>
            <input
              value={pendingAltText}
              onChange={(event) => setPendingAltText(event.target.value)}
              className="input-premium text-sm"
              placeholder="Describe this image for accessibility"
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="text-sm text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-violet-600/15 file:text-brand-cyan-300 hover:file:bg-brand-violet-600/25 transition-all cursor-pointer"
            />
            {isUploading && <p className="text-xs text-brand-cyan-400 animate-pulse">Uploading image...</p>}
          </div>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}
      {savedMessage && <p className="text-sm font-medium text-brand-cyan-300 bg-brand-cyan-400/10 p-3 rounded-xl border border-brand-cyan-400/20">{savedMessage}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="btn-premium-primary rounded-xl px-6 py-3 font-semibold text-white shadow-lg shadow-brand-violet-600/20 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : mode === "create" ? "Create Case Study" : "Save Changes"}
        </button>

        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border border-red-400/40 bg-[var(--bg-surface)] px-6 py-3 text-sm font-semibold text-red-400 hover:bg-red-400/10 transition-all"
          >
            Delete Case Study
          </button>
        )}
      </div>
    </form>
  );
}
