"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SERVICE_ICON_NAMES, SERVICE_ICON_MAP } from "@/lib/constants/serviceIcons";

interface ServiceFormProps {
  mode: "create" | "edit";
  serviceId?: string;
  initialData?: {
    title: string;
    summary: string;
    icon: string;
    displayOrder: number;
    publishStatus: string;
    featured?: boolean;
  };
}

export default function ServiceForm({ mode, serviceId, initialData }: ServiceFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [icon, setIcon] = useState(initialData?.icon || "Code");
  const [displayOrder, setDisplayOrder] = useState(initialData?.displayOrder ?? 0);
  const [publishStatus, setPublishStatus] = useState(initialData?.publishStatus || "draft");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const endpoint = mode === "create" ? "/api/services" : `/api/services/${serviceId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, summary, icon, displayOrder, publishStatus, featured }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save service.");
        return;
      }

      router.push("../services");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm text-neutral-400">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Summary</label>
        <textarea
          required
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Icon</label>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {SERVICE_ICON_NAMES.map((name) => {
            const IconComp = SERVICE_ICON_MAP[name];
            return (
              <button
                key={name}
                type="button"
                onClick={() => setIcon(name)}
                title={name}
                className={`flex h-12 items-center justify-center rounded-md border ${
                  icon === name
                    ? "border-brand-cyan-400 bg-brand-cyan-400/10 text-brand-cyan-300"
                    : "border-base-800 bg-base-900 text-neutral-400 hover:bg-base-800"
                }`}
              >
                <IconComp size={20} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">Display Order</label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Status</label>
          <select
            value={publishStatus}
            onChange={(e) => setPublishStatus(e.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="featured"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="h-4 w-4 rounded border-base-800 bg-base-900"
        />
        <label htmlFor="featured" className="text-sm text-neutral-400">
          Feature on homepage
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-md brand-gradient-bg px-5 py-2 font-semibold text-base-950 disabled:opacity-60"
      >
        {isSaving ? "Saving..." : mode === "create" ? "Create Service" : "Save Changes"}
      </button>
    </form>
  );
}
