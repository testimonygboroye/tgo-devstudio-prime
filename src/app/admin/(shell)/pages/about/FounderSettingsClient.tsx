"use client";

import { useState, useEffect, useRef } from "react";

export default function FounderSettingsClient() {
  const [founderName, setFounderName] = useState("");
  const [founderRole, setFounderRole] = useState("");
  const [founderDescription, setFounderDescription] = useState("");
  const [founderPhotoUrl, setFounderPhotoUrl] = useState("");
  const [founderPhotoPublicId, setFounderPhotoPublicId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/about-settings");
      const data = await res.json();
      if (data.status === "ok") {
        setFounderName(data.settings.founderName);
        setFounderRole(data.settings.founderRole);
        setFounderDescription(data.settings.founderDescription);
        setFounderPhotoUrl(data.settings.founderPhotoUrl);
        setFounderPhotoPublicId(data.settings.founderPhotoPublicId || "");
      }
      setIsLoading(false);
    }
    load();
  }, []);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Upload failed.");
        return;
      }
      setFounderPhotoUrl(data.url);
      setFounderPhotoPublicId(data.publicId);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setSavedMessage("");

    const res = await fetch("/api/about-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ founderName, founderRole, founderDescription, founderPhotoUrl, founderPhotoPublicId }),
    });
    const data = await res.json();

    if (data.status !== "ok") {
      setError(data.message || "Failed to save.");
      setIsSaving(false);
      return;
    }

    setSavedMessage("Saved successfully.");
    setIsSaving(false);
  }

  if (isLoading) {
    return <p className="text-neutral-400">Loading...</p>;
  }

  return (
    <div className="max-w-xl space-y-4 rounded-lg border border-base-800 bg-base-900 p-6">
      <p className="text-sm font-semibold text-neutral-100">Founder Section</p>
      <p className="text-xs text-neutral-500">
        This appears on the About page, between the &quot;Why We Exist&quot; and &quot;What We
        Stand For&quot; sections.
      </p>

      <div className="flex items-center gap-4">
        {founderPhotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={founderPhotoUrl} alt="Founder" className="h-20 w-20 rounded-full object-cover" />
        )}
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-md border border-base-800 px-3 py-1.5 text-sm text-neutral-100 hover:bg-base-800 disabled:opacity-60"
          >
            {isUploading ? "Uploading..." : "Change Photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Name</label>
        <input
          value={founderName}
          onChange={(e) => setFounderName(e.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-950 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Role / Title</label>
        <input
          value={founderRole}
          onChange={(e) => setFounderRole(e.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-950 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Description</label>
        <textarea
          rows={3}
          value={founderDescription}
          onChange={(e) => setFounderDescription(e.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-950 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {savedMessage && <p className="text-sm text-brand-cyan-300">{savedMessage}</p>}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="rounded-md brand-gradient-bg px-5 py-2 font-semibold text-base-950 disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save Founder Section"}
      </button>
    </div>
  );
}
