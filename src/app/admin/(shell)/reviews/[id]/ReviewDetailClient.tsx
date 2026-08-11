"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface ModerationLogEntry {
  action: string;
  performedByName: string;
  timestamp: string;
  note?: string;
}

interface ReviewDetail {
  _id: string;
  submitterName: string;
  submitterEmail: string;
  rating: number;
  body: string;
  status: string;
  featured: boolean;
  featuredOnHomepage: boolean;
  targetLabelSnapshot?: string;
  customLabel?: string;
  moderationHistory: ModerationLogEntry[];
  createdAt: string;
}

export default function ReviewDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const basePathSegment = `/${pathname.split("/").filter(Boolean)[0]}`;

  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [editedBody, setEditedBody] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/reviews/${id}`);
      const data = await res.json();
      if (data.status !== "ok") {
        setError(data.message || "Failed to load review.");
        setIsLoading(false);
        return;
      }
      setReview(data.review);
      setEditedBody(data.review.body);
      setIsLoading(false);
    }
    load();
  }, [id]);

  async function performAction(action: string, extra: Record<string, unknown> = {}) {
    setIsSaving(true);
    setError("");
    const res = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = await res.json();
    if (data.status !== "ok") {
      setError(data.message || "Action failed.");
      setIsSaving(false);
      return;
    }
    setReview(data.review);
    setEditedBody(data.review.body);
    setIsEditing(false);
    setIsSaving(false);
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Delete this review from ${review?.submitterName}? This cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.status !== "ok") {
      setError(data.message || "Failed to delete review.");
      setIsDeleting(false);
      return;
    }
    router.push(`${basePathSegment}/reviews`);
  }

  if (isLoading) {
    return <p className="text-neutral-400">Loading review...</p>;
  }

  if (!review) {
    return <p className="text-red-400">{error || "Review not found."}</p>;
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">{review.submitterName}</h1>
      <p className="mt-1 text-neutral-400">
        {review.submitterEmail} · {"★".repeat(review.rating)} ·{" "}
        {review.customLabel || review.targetLabelSnapshot} ·{" "}
        {new Date(review.createdAt).toLocaleString()}
      </p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Review</p>
        {isEditing ? (
          <textarea
            rows={5}
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            className="mt-2 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        ) : (
          <p className="mt-2 whitespace-pre-wrap text-neutral-100">{review.body}</p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-base-800 pt-6">
        {review.status === "pending" && (
          <>
            <button
              onClick={() => performAction("approve")}
              disabled={isSaving}
              className="rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => performAction("reject")}
              disabled={isSaving}
              className="rounded-md border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-md border border-base-800 px-4 py-2 text-sm text-neutral-100 hover:bg-base-900"
          >
            Edit
          </button>
        ) : (
          <>
            <button
              onClick={() => performAction("edit", { editedBody })}
              disabled={isSaving}
              className="rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950 disabled:opacity-50"
            >
              Save Edit &amp; Approve
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedBody(review.body);
              }}
              className="rounded-md border border-base-800 px-4 py-2 text-sm text-neutral-100 hover:bg-base-900"
            >
              Cancel
            </button>
          </>
        )}

        {review.status === "approved" && (
          <>
            <button
              onClick={() => performAction("setFeatured", { featured: !review.featured })}
              disabled={isSaving}
              className="rounded-md border border-brand-cyan-400/50 px-4 py-2 text-sm text-brand-cyan-300 hover:bg-brand-cyan-400/10 disabled:opacity-50"
            >
              {review.featured ? "Unfeature (Testimonials Page)" : "Feature (Testimonials Page)"}
            </button>
            <button
              onClick={() =>
                performAction("setFeaturedOnHomepage", {
                  featuredOnHomepage: !review.featuredOnHomepage,
                })
              }
              disabled={isSaving}
              className="rounded-md border border-brand-violet-500/50 px-4 py-2 text-sm text-brand-cyan-300 hover:bg-brand-violet-500/10 disabled:opacity-50"
            >
              {review.featuredOnHomepage ? "Remove from Homepage" : "Show on Homepage"}
            </button>
          </>
        )}

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="ml-auto rounded-md border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <div className="mt-10 border-t border-base-800 pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          Moderation History
        </h2>
        {review.moderationHistory.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No moderation actions yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {review.moderationHistory.map((entry, index) => (
              <div key={index} className="rounded-md border border-base-800 bg-base-900 p-3 text-sm">
                <span className="font-semibold text-neutral-100">{entry.performedByName}</span>{" "}
                <span className="text-neutral-400">
                  {entry.action} on {new Date(entry.timestamp).toLocaleString()}
                </span>
                {entry.note && <p className="mt-1 text-xs text-neutral-500">{entry.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
