"use client";

import { useState, useEffect } from "react";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface LegalDocumentEditClientProps {
  type: "privacy-policy" | "terms-of-service";
  defaultTitle: string;
}

export default function LegalDocumentEditClient({ type, defaultTitle }: LegalDocumentEditClientProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState("<p>Start writing here...</p>");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/legal/${type}`);
      const data = await res.json();
      if (data.status === "ok" && data.document) {
        setTitle(data.document.title);
        setContent(data.document.content);
      }
      setIsLoading(false);
    }
    load();
  }, [type]);

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setSavedMessage("");

    const res = await fetch(`/api/legal/${type}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
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
    return <p className="text-neutral-400">Loading document...</p>;
  }

  return (
    <div>
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
  );
}
