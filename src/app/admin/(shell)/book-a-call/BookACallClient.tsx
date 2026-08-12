"use client";

import { useState, useEffect } from "react";

export default function BookACallClient() {
  const [heading, setHeading] = useState("");
  const [description, setDescription] = useState("");
  const [calendlyUrl, setCalendlyUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/book-a-call-settings");
      const data = await res.json();
      if (data.status === "ok") {
        setHeading(data.settings.heading);
        setDescription(data.settings.description);
        setCalendlyUrl(data.settings.calendlyUrl);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setSavedMessage("");

    const res = await fetch("/api/book-a-call-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heading, description, calendlyUrl }),
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
    <div className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm text-neutral-400">Heading</label>
        <input
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Calendly Link</label>
        <input
          value={calendlyUrl}
          onChange={(e) => setCalendlyUrl(e.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {savedMessage && <p className="text-sm text-brand-cyan-300">{savedMessage}</p>}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="rounded-md brand-gradient-bg px-5 py-2 font-semibold text-base-950 disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
