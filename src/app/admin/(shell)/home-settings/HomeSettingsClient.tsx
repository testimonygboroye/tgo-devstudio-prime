"use client";

import { useState, useEffect } from "react";

const FIELD_GROUPS = [
  {
    title: "Hero Section",
    fields: [
      { key: "heroHeadline", label: "Headline", type: "input" },
      { key: "heroSubheadline", label: "Subheadline", type: "textarea" },
      { key: "primaryCtaLabel", label: "Primary Button Text", type: "input" },
      { key: "primaryCtaHref", label: "Primary Button Link", type: "input" },
      { key: "secondaryCtaLabel", label: "Secondary Button Text", type: "input" },
      { key: "secondaryCtaHref", label: "Secondary Button Link", type: "input" },
    ],
  },
  {
    title: "Case Studies Section",
    fields: [
      { key: "caseStudiesLabel", label: "Small Label (above heading)", type: "input" },
      { key: "caseStudiesHeading", label: "Section Heading", type: "input" },
    ],
  },
  {
    title: "Services Section",
    fields: [
      { key: "servicesLabel", label: "Small Label", type: "input" },
      { key: "servicesHeading", label: "Section Heading", type: "input" },
    ],
  },
  {
    title: "Process Section",
    fields: [
      { key: "processLabel", label: "Small Label", type: "input" },
      { key: "processHeading", label: "Section Heading", type: "input" },
    ],
  },
  {
    title: "Team Section",
    fields: [
      { key: "teamLabel", label: "Small Label", type: "input" },
      { key: "teamHeading", label: "Section Heading", type: "input" },
    ],
  },
  {
    title: "Testimonials Section",
    fields: [
      { key: "testimonialsLabel", label: "Small Label", type: "input" },
      { key: "testimonialsHeading", label: "Section Heading", type: "input" },
    ],
  },
  {
    title: "Blog Section",
    fields: [
      { key: "blogLabel", label: "Small Label", type: "input" },
      { key: "blogHeading", label: "Section Heading", type: "input" },
    ],
  },
  {
    title: "Careers Section",
    fields: [
      { key: "careersLabel", label: "Small Label", type: "input" },
      { key: "careersHeading", label: "Section Heading", type: "input" },
      { key: "careersNoRolesMessage", label: "Message When No Roles Are Open", type: "textarea" },
    ],
  },
  {
    title: "Trust Bar (Stats)",
    fields: [
      { key: "statOneValue", label: "Stat 1 Value (e.g. 1+)", type: "input" },
      { key: "statOneLabel", label: "Stat 1 Label (e.g. Years Active)", type: "input" },
      { key: "statTwoValue", label: "Stat 2 Value", type: "input" },
      { key: "statTwoLabel", label: "Stat 2 Label", type: "input" },
      { key: "statThreeValue", label: "Stat 3 Value", type: "input" },
      { key: "statThreeLabel", label: "Stat 3 Label", type: "input" },
    ],
  },
  {
    title: "Final Call-to-Action Section",
    fields: [
      { key: "finalCtaHeading", label: "Heading", type: "input" },
      { key: "finalCtaDescription", label: "Description", type: "textarea" },
      { key: "finalCtaButtonLabel", label: "Button Text", type: "input" },
    ],
  },
];

const ALL_KEYS = FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key));

export default function HomeSettingsClient() {
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(ALL_KEYS.map((k) => [k, ""]))
  );
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [openSection, setOpenSection] = useState<string | null>("Hero Section");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/home-settings");
      const data = await res.json();
      if (data.status === "ok") {
        setForm((prev) => ({ ...prev, ...data.settings }));
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
    <div className="max-w-2xl space-y-4">
      {isDefault && (
        <div className="rounded-md border border-brand-cyan-400/40 bg-brand-cyan-400/10 p-3 text-sm text-brand-cyan-300">
          The homepage is showing starter content that hasn't been saved yet. Edit below and
          save to make it official.
        </div>
      )}

      {FIELD_GROUPS.map((group) => {
        const isOpen = openSection === group.title;
        return (
          <div key={group.title} className="overflow-hidden rounded-lg border border-base-800">
            <button
              type="button"
              onClick={() => setOpenSection(isOpen ? null : group.title)}
              className="flex w-full items-center justify-between bg-base-900 px-4 py-3 text-left text-sm font-semibold text-neutral-100"
            >
              {group.title}
              <span className="text-neutral-400">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div className="space-y-4 border-t border-base-800 bg-base-950 p-4">
                {group.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm text-neutral-400">{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        rows={3}
                        value={form[field.key] ?? ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
                      />
                    ) : (
                      <input
                        value={form[field.key] ?? ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

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
