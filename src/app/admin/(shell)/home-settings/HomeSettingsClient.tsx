"use client";

import { useState, useEffect } from "react";

export default function HomeSettingsClient() {
  const [form, setForm] = useState({
    heroHeadline: "",
    heroSubheadline: "",
    primaryCtaLabel: "",
    primaryCtaHref: "",
    secondaryCtaLabel: "",
    secondaryCtaHref: "",
  });
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/home-settings");
      const data = await res.json();
      if (data.status === "ok") {
        setForm(data.settings);
        setIsDefault(data.isDefault);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setSavedMessage("");

    const res = await fetch("/api/home-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (data.status !== "ok") {
      setError(data.message || "Failed to save.");
      setIsSaving(false);
      return;
    }

    setIsDefault(false);
    setSavedMessage("Saved successfully.");
    setIsSaving(false);
  }

  if (isLoading) {
    return <p className="text-neutral-400">Loading homepage settings...</p>;
  }

  return (
    <div className="max-w-xl space-y-4">
      {isDefault && (
        <div className="rounded-md border border-brand-cyan-400/40 bg-brand-cyan-400/10 p-3 text-sm text-brand-cyan-300">
          The homepage is showing starter content that hasn't been saved yet. Edit below and
          save to make it official.
        </div>
      )}

      <div>
        <label className="block text-sm text-neutral-400">Hero Headline</label>
        <input
          value={form.heroHeadline}
          onChange={(e) => updateField("heroHeadline", e.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Hero Subheadline</label>
        <textarea
          rows={3}
          value={form.heroSubheadline}
          onChange={(e) => updateField("heroSubheadline", e.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">Primary Button Text</label>
          <input
            value={form.primaryCtaLabel}
            onChange={(e) => updateField("primaryCtaLabel", e.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Primary Button Link</label>
          <input
            value={form.primaryCtaHref}
            onChange={(e) => updateField("primaryCtaHref", e.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">Secondary Button Text</label>
          <input
            value={form.secondaryCtaLabel}
            onChange={(e) => updateField("secondaryCtaLabel", e.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Secondary Button Link</label>
          <input
            value={form.secondaryCtaHref}
            onChange={(e) => updateField("secondaryCtaHref", e.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {savedMessage && <p className="text-sm text-brand-cyan-300">{savedMessage}</p>}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="rounded-md brand-gradient-bg px-5 py-2 font-semibold text-base-950 disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save Homepage Settings"}
      </button>
    </div>
  );
}
