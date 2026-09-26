"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProcessStepFormProps {
  mode: "create" | "edit";
  stepId?: string;
  initialData?: {
    title: string;
    description: string;
    displayOrder: number;
    publishStatus: string;
    featured?: boolean;
  };
}

export default function ProcessStepForm({ mode, stepId, initialData }: ProcessStepFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [displayOrder, setDisplayOrder] = useState(initialData?.displayOrder ?? 0);
  const [publishStatus, setPublishStatus] = useState(initialData?.publishStatus || "draft");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSavedMessage("");
    setIsSaving(true);

    const endpoint = mode === "create" ? "/api/process-steps" : `/api/process-steps/${stepId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, displayOrder, publishStatus, featured }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save process step.");
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
    if (confirmText !== "DELETE") {
      setError("You must type DELETE exactly to confirm.");
      return;
    }
    setIsDeleting(true);
    setError("");
    const res = await fetch(`/api/process-steps/${stepId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Failed to delete process step.");
      setIsDeleting(false);
      return;
    }
    router.refresh();
    setSavedMessage("Saved successfully.");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-base-800 bg-base-900/50 p-6 shadow-xl space-y-4 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-neutral-100">
          {mode === "create" ? "New Process Step" : "Edit Process Step"}
        </h2>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Step Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Discovery & Strategy"
            className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happens in this step..."
            className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Step Order</label>
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

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="featured"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-base-800 bg-base-950 text-brand-cyan-400 focus:ring-brand-cyan-400/20"
          />
          <label htmlFor="featured" className="text-sm text-neutral-300 select-none cursor-pointer">
            Feature on homepage
          </label>
        </div>

        {error && <p className="text-sm font-medium text-red-400">{error}</p>}
        {savedMessage && <p className="text-sm font-medium text-brand-cyan-300">{savedMessage}</p>}

        <div className="flex items-center gap-3 pt-4 border-t border-base-800">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg brand-gradient-bg px-6 py-2.5 font-semibold text-base-950 shadow-md transition hover:opacity-90 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : mode === "create" ? "Add Step" : "Save Changes"}
          </button>

          {mode === "edit" && (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="rounded-lg border border-red-500/40 px-5 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-base-800 bg-base-950 p-6 shadow-2xl">
            <p className="text-lg font-semibold text-neutral-100">Delete this process step?</p>
            <p className="mt-2 text-sm text-neutral-400">
              Type <span className="font-mono font-bold text-red-400">DELETE</span> below to confirm.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="mt-3 w-full rounded-lg border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText("");
                  setError("");
                }}
                className="flex-1 rounded-lg border border-base-800 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-base-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
