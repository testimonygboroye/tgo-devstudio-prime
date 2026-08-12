"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface HelpArticleFormProps {
  mode: "create" | "edit";
  articleId?: string;
  initialData?: {
    title: string;
    bodyHtml: string;
    visibility: string;
    requiredContentType?: string;
    category: string;
  };
}

const CONTENT_TYPE_OPTIONS = [
  "caseStudies", "team", "blogPosts", "jobOpenings", "jobApplications",
  "contactSubmissions", "reviews", "services", "processSteps", "pageContent",
  "homeSettings", "availabilityStatus", "helpArticles",
];

export default function HelpArticleForm({ mode, articleId, initialData }: HelpArticleFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [bodyHtml, setBodyHtml] = useState(initialData?.bodyHtml || "<p>Write the article here...</p>");
  const [visibility, setVisibility] = useState(initialData?.visibility || "anyAuthenticated");
  const [requiredContentType, setRequiredContentType] = useState(initialData?.requiredContentType || "");
  const [category, setCategory] = useState(initialData?.category || "General");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const endpoint = mode === "create" ? "/api/help-articles" : `/api/help-articles/${articleId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, bodyHtml, visibility, requiredContentType, category }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save article.");
        return;
      }

      router.push("../help-articles");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
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
        <label className="block text-sm text-neutral-400">Category</label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Admin, Public Site, Brand"
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          >
            <option value="public">Public (everyone, everywhere)</option>
            <option value="preLogin">Pre-Login (login page only)</option>
            <option value="anyAuthenticated">Any Logged-In Admin</option>
            <option value="permission">Requires Specific Permission</option>
          </select>
        </div>

        {visibility === "permission" && (
          <div>
            <label className="block text-sm text-neutral-400">Required Content Access</label>
            <select
              value={requiredContentType}
              onChange={(e) => setRequiredContentType(e.target.value)}
              className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
            >
              <option value="">Select a content type</option>
              {CONTENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Content</label>
        <div className="mt-1">
          <RichTextEditor content={bodyHtml} onChange={setBodyHtml} />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-md brand-gradient-bg px-5 py-2 font-semibold text-base-950 disabled:opacity-60"
      >
        {isSaving ? "Saving..." : mode === "create" ? "Create Article" : "Save Changes"}
      </button>
    </form>
  );
}
