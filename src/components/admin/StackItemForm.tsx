"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StackItemFormProps {
  mode: "create" | "edit";
  itemId?: string;
  initialData?: {
    category: string;
    title: string;
    description: string;
    displayOrder: number;
    publishStatus: string;
  };
}

export default function StackItemForm({ mode, itemId, initialData }: StackItemFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState(initialData?.category || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [displayOrder, setDisplayOrder] = useState(initialData?.displayOrder ?? 0);
  const [publishStatus, setPublishStatus] = useState(initialData?.publishStatus || "draft");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSavedMessage("");
    setIsSaving(true);

    const endpoint = mode === "create" ? "/api/stack-items" : `/api/stack-items/${itemId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, description, displayOrder, publishStatus }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save stack item.");
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

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-base-800 bg-base-900/50 p-6 shadow-xl space-y-4 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-neutral-100">
          {mode === "create" ? "New Tech Stack Item" : "Edit Tech Stack Item"}
        </h2>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Category</label>
          <input
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Framework, Database, Hosting"
            className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Next.js"
            className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Description / Reasoning</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why do we use this technology?"
            className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Display Order</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Status</label>
            <select
              value={publishStatus}
              onChange={(e) => setPublishStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-400">{error}</p>}
        {savedMessage && <p className="text-sm font-medium text-brand-cyan-300">{savedMessage}</p>}

        <div className="pt-4 border-t border-base-800">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg brand-gradient-bg px-6 py-2.5 font-semibold text-base-950 shadow-md transition hover:opacity-90 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : mode === "create" ? "Add Stack Item" : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
