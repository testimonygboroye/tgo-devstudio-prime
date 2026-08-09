"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface ContactDetail {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

const STATUS_OPTIONS = ["new", "read", "replied", "archived"];

export default function ContactDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const basePathSegment = `/${pathname.split("/").filter(Boolean)[0]}`;

  const [submission, setSubmission] = useState<ContactDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/contact/${id}`);
      const data = await res.json();
      if (data.status !== "ok") {
        setError(data.message || "Failed to load message.");
        setIsLoading(false);
        return;
      }
      setSubmission(data.submission);
      setIsLoading(false);
    }
    load();
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    setIsSaving(true);
    setError("");
    const res = await fetch(`/api/contact/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.status !== "ok") {
      setError(data.message || "Failed to update status.");
      setIsSaving(false);
      return;
    }
    setSubmission(data.submission);
    setIsSaving(false);
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Delete the message from ${submission?.name}? This cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    const res = await fetch(`/api/contact/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.status !== "ok") {
      setError(data.message || "Failed to delete message.");
      setIsDeleting(false);
      return;
    }
    router.push(`${basePathSegment}/contact`);
  }

  if (isLoading) {
    return <p className="text-neutral-400">Loading message...</p>;
  }

  if (!submission) {
    return <p className="text-red-400">{error || "Message not found."}</p>;
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">{submission.name}</h1>
      <p className="mt-1 text-neutral-400">
        {submission.email} · {submission.subject} · {new Date(submission.createdAt).toLocaleString()}
      </p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Message</p>
        <p className="mt-2 whitespace-pre-wrap text-neutral-100">{submission.message}</p>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-base-800 pt-6">
        <div>
          <p className="mb-1 text-xs uppercase tracking-widest text-neutral-500">Status</p>
          <select
            value={submission.status}
            disabled={isSaving}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <a
          href={`mailto:${submission.email}?subject=${encodeURIComponent(`Re: ${submission.subject}`)}`}
          className="rounded-md border border-base-800 px-4 py-2 text-sm text-neutral-100 hover:bg-base-900"
        >
          Reply via Email
        </a>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="ml-auto rounded-md border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete Message"}
        </button>
      </div>
    </div>
  );
}
