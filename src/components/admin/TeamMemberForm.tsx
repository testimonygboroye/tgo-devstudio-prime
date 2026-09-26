"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CharacterCounter from "@/components/admin/CharacterCounter";
import { TEXT_LIMITS } from "@/lib/constants/textLimits";

interface Photo {
  url: string;
  publicId: string;
  altText: string;
}

interface TeamMemberFormProps {
  mode: "create" | "edit";
  memberId?: string;
  initialData?: {
    name: string;
    jobTitle: string;
    bio: string;
    photo?: Photo;
    linkedinUrl?: string;
    githubUrl?: string;
    twitterUrl?: string;
    displayOrder: number;
    publishStatus: string;
    featured?: boolean;
  };
}

export default function TeamMemberForm({ mode, memberId, initialData }: TeamMemberFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name ?? "");
  const [jobTitle, setJobTitle] = useState(initialData?.jobTitle ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [photo, setPhoto] = useState<Photo | null>(initialData?.photo ?? null);
  const [pendingAltText, setPendingAltText] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedinUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(initialData?.githubUrl ?? "");
  const [twitterUrl, setTwitterUrl] = useState(initialData?.twitterUrl ?? "");
  const [displayOrder, setDisplayOrder] = useState(initialData?.displayOrder ?? 0);
  const [publishStatus, setPublishStatus] = useState(initialData?.publishStatus ?? "draft");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!pendingAltText.trim()) {
      setError("Please enter alt text for this photo before uploading.");
      event.target.value = "";
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "team");

      const response = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Photo upload failed.");
        return;
      }

      setPhoto({ url: data.url, publicId: data.publicId, altText: pendingAltText.trim() });
      setPendingAltText("");
    } catch {
      setError("Photo upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const payload = {
      name,
      jobTitle,
      bio,
      photo: photo ?? undefined,
      linkedinUrl: linkedinUrl || undefined,
      githubUrl: githubUrl || undefined,
      twitterUrl: twitterUrl || undefined,
      displayOrder,
      publishStatus,
      featured,
    };

    try {
      const response = await fetch(mode === "create" ? "/api/team" : `/api/team/${memberId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save team member.");
        return;
      }

      router.refresh();
      setError("");
      setSavedMessage("Saved successfully.");
      if (mode === "create" && data.teamMember?._id) {
        const newPath = window.location.pathname.replace(/\/team\/new\/?$/, `/team/${data.teamMember._id}`);
        router.push(newPath);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!memberId) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this team member? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/team/${memberId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to delete team member.");
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-base-800 bg-base-900/50 p-6 shadow-xl space-y-5 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-neutral-100">
          {mode === "create" ? "New Team Member" : "Edit Team Member"}
        </h2>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Name</label>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Jane Doe"
            className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
          />
          <CharacterCounter current={name.length} max={TEXT_LIMITS.team.name} />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Job Title</label>
          <input
            required
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            placeholder="e.g. Senior Software Architect"
            className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
          />
          <CharacterCounter current={jobTitle.length} max={TEXT_LIMITS.team.jobTitle} />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Bio</label>
          <textarea
            required
            rows={4}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Short professional biography..."
            className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
          />
          <CharacterCounter current={bio.length} max={TEXT_LIMITS.team.bio} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-neutral-300">LinkedIn URL</label>
            <input
              value={linkedinUrl}
              onChange={(event) => setLinkedinUrl(event.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">GitHub URL</label>
            <input
              value={githubUrl}
              onChange={(event) => setGithubUrl(event.target.value)}
              placeholder="https://github.com/..."
              className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">X / Twitter URL</label>
            <input
              value={twitterUrl}
              onChange={(event) => setTwitterUrl(event.target.value)}
              placeholder="https://x.com/..."
              className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Display Order</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(event) => setDisplayOrder(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
            />
            <p className="mt-1 text-xs text-neutral-400">Lower numbers appear first.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Publish Status</label>
            <select
              value={publishStatus}
              onChange={(event) => setPublishStatus(event.target.value)}
              className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="featured"
            checked={featured}
            onChange={(event) => setFeatured(event.target.checked)}
            className="h-4 w-4 rounded border-base-800 bg-base-950 text-brand-cyan-400 focus:ring-brand-cyan-400/20"
          />
          <label htmlFor="featured" className="text-sm text-neutral-300 select-none cursor-pointer">
            Feature on homepage
          </label>
        </div>

        <div className="rounded-lg border border-base-800 bg-base-950 p-4 space-y-3">
          <p className="text-sm font-semibold text-neutral-200">Photo</p>

          {photo && (
            <div className="flex items-center justify-between rounded-lg border border-base-800 bg-base-900 p-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.altText} className="h-12 w-12 rounded-full object-cover border border-base-700" />
                <span className="text-xs text-neutral-300">{photo.altText}</span>
              </div>
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="text-xs font-medium text-red-400 hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <label className="block text-sm font-medium text-neutral-300">
              Alt text (required before uploading)
            </label>
            <input
              value={pendingAltText}
              onChange={(event) => setPendingAltText(event.target.value)}
              className="w-full rounded-lg border border-base-800 bg-base-900 px-4 py-2.5 text-sm text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
              placeholder="e.g. Headshot of Jane Doe smiling"
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              disabled={isUploading}
              className="text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-cyan-400/10 file:text-brand-cyan-300 hover:file:bg-brand-cyan-400/20 cursor-pointer"
            />
            {isUploading && <p className="text-xs text-brand-cyan-300 animate-pulse">Uploading photo...</p>}
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-400">{error}</p>}
        {savedMessage && <p className="text-sm font-medium text-brand-cyan-300">{savedMessage}</p>}

        <div className="flex items-center gap-3 pt-4 border-t border-base-800">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg brand-gradient-bg px-6 py-2.5 font-semibold text-base-950 shadow-md transition hover:opacity-90 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : mode === "create" ? "Add Team Member" : "Save Changes"}
          </button>

          {mode === "edit" && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-red-500/40 px-5 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
