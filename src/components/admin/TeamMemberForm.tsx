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
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

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

      const listPath = window.location.pathname.replace(/\/team\/(new|[^/]+)\/?$/, "/team");
      router.push(listPath);
      router.refresh();
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

      const listPath = window.location.pathname.replace(/\/team\/[^/]+\/?$/, "/team");
      router.push(listPath);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <label className="block text-sm text-neutral-400">Name</label>
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
        <CharacterCounter current={name.length} max={TEXT_LIMITS.team.name} />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Job Title</label>
        <input
          required
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
        <CharacterCounter current={jobTitle.length} max={TEXT_LIMITS.team.jobTitle} />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Bio</label>
        <textarea
          required
          rows={4}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
        <CharacterCounter current={bio.length} max={TEXT_LIMITS.team.bio} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">LinkedIn URL</label>
          <input
            value={linkedinUrl}
            onChange={(event) => setLinkedinUrl(event.target.value)}
            placeholder="Add later if not ready"
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">GitHub URL</label>
          <input
            value={githubUrl}
            onChange={(event) => setGithubUrl(event.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">X / Twitter URL</label>
          <input
            value={twitterUrl}
            onChange={(event) => setTwitterUrl(event.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">Display Order</label>
          <input
            type="number"
            value={displayOrder}
            onChange={(event) => setDisplayOrder(Number(event.target.value))}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
          <p className="mt-1 text-xs text-neutral-400">Lower numbers appear first.</p>
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

      <div className="rounded-lg border border-base-800 bg-base-900 p-4">
        <p className="text-sm font-semibold text-neutral-100">Photo</p>

        {photo && (
          <div className="mt-3 flex items-center justify-between rounded-md border border-base-800 p-2">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.altText} className="h-12 w-12 rounded-full object-cover" />
              <span className="text-xs text-neutral-400">{photo.altText}</span>
            </div>
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="text-xs text-red-400 hover:underline"
            >
              Remove
            </button>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <label className="block text-sm text-neutral-400">
            Alt text (required before uploading)
          </label>
          <input
            value={pendingAltText}
            onChange={(event) => setPendingAltText(event.target.value)}
            className="w-full rounded-md border border-base-800 bg-base-950 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
            placeholder="e.g. Headshot of Jane Doe smiling, outdoor background"
          />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoUpload}
            disabled={isUploading}
            className="text-sm text-neutral-400"
          />
          {isUploading && <p className="text-xs text-neutral-400">Uploading...</p>}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md brand-gradient-bg px-5 py-2 font-semibold text-base-950 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : mode === "create" ? "Add Team Member" : "Save Changes"}
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
