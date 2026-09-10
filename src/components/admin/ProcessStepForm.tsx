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

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
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

      router.push("../process");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (confirmText !== "DELETE") {
      setError('You must type DELETE exactly to confirm.');
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
    router.push("../process");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm text-neutral-400">Step Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Discovery"
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Description</label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">Step Order</label>
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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md brand-gradient-bg px-5 py-2 font-semibold text-base-950 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : mode === "create" ? "Add Step" : "Save Changes"}
        </button>

        {mode === "edit" && (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="rounded-md border border-red-500/50 px-5 py-2 text-sm text-red-300 hover:bg-red-500/10"
          >
            Delete
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-xl border border-base-800 bg-base-950 p-6">
            <p className="font-semibold text-neutral-100">Delete this process step?</p>
            <p className="mt-2 text-sm text-neutral-400">
              Type <span className="font-mono font-bold text-red-300">DELETE</span> below to confirm.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-3 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
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
                className="rounded-md border border-base-800 px-4 py-2 text-sm text-neutral-100 hover:bg-base-900"
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
