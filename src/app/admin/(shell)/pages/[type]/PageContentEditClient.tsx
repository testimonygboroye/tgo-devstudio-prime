"use client";

import { useState, useEffect } from "react";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface PageContentEditClientProps {
  type: "about" | "privacy-policy" | "terms-of-service" | "usage-policy" | "accessibility";
  defaultTitle?: string;
}

async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  let res = await fetch(url, options);
  if (res.status === 401) {
    const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
    if (refreshRes.ok) {
      res = await fetch(url, options);
    }
  }
  return res;
}

export default function PageContentEditClient({ type, defaultTitle }: PageContentEditClientProps) {
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [content, setContent] = useState("<p>Start writing here...</p>");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await authFetch(`/api/pages/${type}`);
      const data = await res.json();
      if (data.status === "ok" && data.page) {
        setTitle(data.page.title);
        setContent(data.page.content);
        setIsDefault(Boolean(data.isDefault));
      }
      setIsLoading(false);
    }
    load();
  }, [type]);

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setSavedMessage("");

    const res = await authFetch(`/api/pages/${type}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    const data = await res.json();

    if (data.status !== "ok") {
      setError(data.message || "Failed to save. If this keeps happening, try logging in again.");
      setIsSaving(false);
      return;
    }

    setSavedMessage("Saved successfully.");
    setIsSaving(false);
  }

  if (isLoading) {
    return <p className="text-neutral-400">Loading document...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-brand-cyan-400">Page management</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{isDefault ? "Updated editorial version loaded. Save to publish it." : "This page is using its saved database content."}</p></div><a href={type === "about" ? "/about" : `/${type}`} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:border-brand-cyan-400">View public page ↗</a></div>
      </div>
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-7">
      <div>
        <label className="block text-sm text-neutral-400">Page Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full max-w-xl rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div className="mt-6">
        <label className="block text-sm text-neutral-400">Content</label>
        <div className="mt-1">
          <RichTextEditor content={content} onChange={setContent} />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {savedMessage && <p className="mt-4 text-sm text-brand-cyan-300">{savedMessage}</p>}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-6 rounded-md brand-gradient-bg px-5 py-2 font-semibold text-base-950 disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save Document"}
      </button>
      </div>
    </div>
  );
}
