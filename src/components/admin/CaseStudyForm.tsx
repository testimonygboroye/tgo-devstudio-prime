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
      <div>
        <label className="block text-sm text-neutral-400">Title</label>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
        <CharacterCounter current={title.length} max={TEXT_LIMITS.project.title} />
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
        <CharacterCounter current={summary.length} max={TEXT_LIMITS.project.summary} />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Problem</label>
        <textarea
          rows={3}
          value={problemStatement}
          onChange={(event) => setProblemStatement(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
        <CharacterCounter current={problemStatement.length} max={TEXT_LIMITS.project.narrativeSection} />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Approach</label>
        <textarea
          rows={3}
          value={approach}
          onChange={(event) => setApproach(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
        <CharacterCounter current={approach.length} max={TEXT_LIMITS.project.narrativeSection} />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Outcome</label>
        <textarea
          rows={3}
          value={outcome}
          onChange={(event) => setOutcome(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
        <CharacterCounter current={outcome.length} max={TEXT_LIMITS.project.narrativeSection} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">Live URL</label>
          <input
            value={projectUrl}
            onChange={(event) => setProjectUrl(event.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Repo URL</label>
          <input
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Tags (comma-separated)</label>
        <input
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Tech Stack (comma-separated)</label>
        <input
          value={techStackInput}
          onChange={(event) => setTechStackInput(event.target.value)}
          placeholder="e.g. Next.js, MongoDB, Cloudinary"
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div className="rounded-lg border border-base-800 bg-base-900 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-100">Results / Metrics</p>
          <button
            type="button"
            onClick={addMetric}
            className="rounded-md border border-base-800 px-3 py-1 text-xs text-neutral-100 hover:bg-base-800"
          >
            + Add Metric
          </button>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          e.g. Label "Faster Load Times", Value "40%"
        </p>

        <div className="mt-3 space-y-2">
          {metrics.map((metric, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={metric.label}
                onChange={(e) => updateMetric(index, "label", e.target.value)}
                placeholder="Label"
                className="flex-1 rounded-md border border-base-800 bg-base-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-brand-cyan-400"
              />
              <input
                value={metric.value}
                onChange={(e) => updateMetric(index, "value", e.target.value)}
                placeholder="Value"
                className="w-28 rounded-md border border-base-800 bg-base-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-brand-cyan-400"
              />
              <button
                type="button"
                onClick={() => removeMetric(index)}
                className="rounded-md border border-red-500/40 px-3 text-xs text-red-400 hover:bg-red-500/10"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          >
            <option value="live">Live</option>
            <option value="in-progress">In Progress</option>
            <option value="concept">Concept</option>
          </select>
        </div>
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
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-100">
        <input
          type="checkbox"
          checked={featured}
          onChange={(event) => setFeatured(event.target.checked)}
        />
        Feature this on the homepage
      </label>

      <div className="rounded-lg border border-base-800 bg-base-900 p-4">
        <p className="text-sm font-semibold text-neutral-100">Images</p>

        <div className="mt-3 space-y-2">
          {images.map((image) => (
            <div
              key={image.publicId}
              className="flex items-center justify-between rounded-md border border-base-800 p-2"
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.altText} className="h-12 w-12 rounded object-cover" />
                <span className="text-xs text-neutral-400">{image.altText}</span>
              </div>
              <button
                type="button"
                onClick={() => removeImage(image.publicId)}
                className="text-xs text-red-400 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <label className="block text-sm text-neutral-400">
            Alt text (required before uploading)
          </label>
          <input
            value={pendingAltText}
            onChange={(event) => setPendingAltText(event.target.value)}
            className="w-full rounded-md border border-base-800 bg-base-950 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
            placeholder="Describe this image for accessibility"
          />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            disabled={isUploading}
            className="text-sm text-neutral-400"
          />
          {isUploading && <p className="text-xs text-neutral-400">Uploading...</p>}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {savedMessage && <p className="text-sm text-brand-cyan-300">{savedMessage}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md brand-gradient-bg px-5 py-2 font-semibold text-base-950 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : mode === "create" ? "Create Case Study" : "Save Changes"}
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
