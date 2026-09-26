"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FaqItemFormProps {
  mode: "create" | "edit";
  itemId?: string;
  initialData?: {
    question: string;
    answer: string;
    category: string;
    displayOrder: number;
    publishStatus: string;
  };
}

export default function FaqItemForm({ mode, itemId, initialData }: FaqItemFormProps) {
  const router = useRouter();
  const [question, setQuestion] = useState(initialData?.question || "");
  const [answer, setAnswer] = useState(initialData?.answer || "");
  const [category, setCategory] = useState(initialData?.category || "General");
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

    const endpoint = mode === "create" ? "/api/faq-items" : `/api/faq-items/${itemId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer, category, displayOrder, publishStatus }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save FAQ item.");
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
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="surface-card p-6 sm:p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Question</label>
          <input
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="input-premium mt-1.5"
            placeholder="Frequently asked question..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Answer</label>
          <textarea
            required
            rows={4}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="textarea-premium mt-1.5"
            placeholder="Detailed answer..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. General, Pricing, Process"
            className="input-premium mt-1.5"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Display Order</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              className="input-premium mt-1.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Status</label>
            <select
              value={publishStatus}
              onChange={(e) => setPublishStatus(e.target.value)}
              className="select-premium mt-1.5"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}
      {savedMessage && <p className="text-sm font-medium text-brand-cyan-300 bg-brand-cyan-400/10 p-3 rounded-xl border border-brand-cyan-400/20">{savedMessage}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="btn-premium-primary rounded-xl px-6 py-3 font-semibold text-white shadow-lg shadow-brand-violet-600/20 disabled:opacity-60"
      >
        {isSaving ? "Saving..." : mode === "create" ? "Add FAQ" : "Save Changes"}
      </button>
    </form>
  );
}
