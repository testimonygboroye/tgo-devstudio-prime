"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "./RichTextEditor";
import CharacterCounter from "./CharacterCounter";
import { TEXT_LIMITS } from "@/lib/constants/textLimits";

interface CoverImage {
  url: string;
  publicId: string;
  altText: string;
}

interface BlogPostFormProps {
  mode: "create" | "edit";
  postId?: string;
  initialData?: {
    title: string;
    excerpt: string;
    contentHtml: string;
    coverImage?: CoverImage;
    tags: string[];
    publishStatus: string;
    scheduledFor?: string;
    featured?: boolean;
  };
}

function toDatetimeLocalValue(isoString?: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function BlogPostForm({ mode, postId, initialData }: BlogPostFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [contentHtml, setContentHtml] = useState(initialData?.contentHtml ?? "");
  const [coverImage, setCoverImage] = useState<CoverImage | null>(initialData?.coverImage ?? null);
  const [pendingAltText, setPendingAltText] = useState("");
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(", ") ?? "");
  const [publishStatus, setPublishStatus] = useState(initialData?.publishStatus ?? "draft");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [scheduledFor, setScheduledFor] = useState(toDatetimeLocalValue(initialData?.scheduledFor));
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!pendingAltText.trim()) {
      setError("Please enter alt text for the cover image before uploading.");
      event.target.value = "";
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
    formData.append("folder", "blog");

      const response = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Cover image upload failed.");
        return;
      }

      setCoverImage({ url: data.url, publicId: data.publicId, altText: pendingAltText.trim() });
      setPendingAltText("");
    } catch {
      setError("Cover image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (publishStatus === "scheduled" && !scheduledFor) {
      setError("Please choose a date and time to schedule this post.");
      return;
    }

    setIsSaving(true);

    const payload = {
      title,
      excerpt,
      contentHtml,
      coverImage: coverImage ?? undefined,
      tags: tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean),
      publishStatus,
      featured,
      scheduledFor: publishStatus === "scheduled" ? new Date(scheduledFor).toISOString() : undefined,
    };

    try {
      const response = await fetch(mode === "create" ? "/api/blog" : `/api/blog/${postId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save blog post.");
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
    if (!postId) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this blog post? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/blog/${postId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to delete blog post.");
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
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="surface-card p-6 sm:p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Title</label>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="input-premium mt-1.5"
            placeholder="Enter blog post title..."
          />
          <CharacterCounter current={title.length} max={TEXT_LIMITS.blog.title} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Excerpt</label>
          <textarea
            required
            rows={3}
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            className="textarea-premium mt-1.5"
            placeholder="Brief summary of the article..."
          />
          <CharacterCounter current={excerpt.length} max={TEXT_LIMITS.blog.excerpt} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Content</label>
          <RichTextEditor content={contentHtml} onChange={setContentHtml} />
          <CharacterCounter current={contentHtml.length} max={TEXT_LIMITS.blog.contentHtml} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Tags (comma-separated)</label>
          <input
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            className="input-premium mt-1.5"
            placeholder="Next.js, React, Architecture"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Publish Status</label>
            <select
              value={publishStatus}
              onChange={(event) => setPublishStatus(event.target.value)}
              className="select-premium mt-1.5"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-7">
            <input
              type="checkbox"
              id="featured"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-subtle)] bg-[var(--bg-surface)] text-brand-violet-600 focus:ring-brand-cyan-400"
            />
            <label htmlFor="featured" className="text-sm font-medium text-[var(--text-primary)] cursor-pointer">
              Feature on homepage
            </label>
          </div>
        </div>

        {publishStatus === "scheduled" && (
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Publish Date &amp; Time</label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(event) => setScheduledFor(event.target.value)}
              className="input-premium mt-1.5"
            />
          </div>
        )}

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-5 space-y-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Cover Image</p>

          {coverImage && (
            <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage.url} alt={coverImage.altText} className="h-12 w-20 rounded-lg object-cover" />
                <span className="text-xs text-[var(--text-secondary)]">{coverImage.altText}</span>
              </div>
              <button
                type="button"
                onClick={() => setCoverImage(null)}
                className="text-xs font-semibold text-red-400 hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-medium text-[var(--text-secondary)]">
              Alt text (required before uploading)
            </label>
            <input
              value={pendingAltText}
              onChange={(event) => setPendingAltText(event.target.value)}
              className="input-premium text-sm"
              placeholder="Describe cover image for accessibility..."
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverUpload}
              disabled={isUploading}
              className="text-sm text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-violet-600/15 file:text-brand-cyan-300 hover:file:bg-brand-violet-600/25 transition-all cursor-pointer"
            />
            {isUploading && <p className="text-xs text-brand-cyan-400 animate-pulse">Uploading cover image...</p>}
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
          {isSaving ? "Saving..." : mode === "create" ? "Create Post" : "Save Changes"}
        </button>

        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border border-red-400/40 bg-[var(--bg-surface)] px-6 py-3 text-sm font-semibold text-red-400 hover:bg-red-400/10 transition-all"
          >
            Delete Post
          </button>
        )}
      </div>
    </form>
  );
}
