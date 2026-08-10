"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";

interface ReviewListItem {
  _id: string;
  submitterName: string;
  rating: number;
  body: string;
  status: string;
  featured: boolean;
  targetLabelSnapshot?: string;
  customLabel?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-brand-cyan-400/20 text-brand-cyan-300",
  approved: "bg-green-500/20 text-green-300",
  rejected: "bg-red-500/20 text-red-300",
};

export default function ReviewsListClient() {
  const pathname = usePathname();
  const basePathSegment = `/${pathname.split("/").filter(Boolean)[0]}`;

  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/reviews?${params.toString()}`);
    const data = await res.json();

    if (data.status !== "ok") {
      setError(data.message || "Failed to load reviews.");
      setIsLoading(false);
      return;
    }

    setReviews(data.reviews);
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function handleToggleFeatured(event: React.MouseEvent, review: ReviewListItem) {
    event.preventDefault();
    event.stopPropagation();

    if (review.status !== "approved") return;

    setTogglingId(review._id);
    const res = await fetch(`/api/reviews/${review._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setFeatured", featured: !review.featured }),
    });
    const data = await res.json();

    if (data.status === "ok") {
      setReviews((prev) =>
        prev.map((r) => (r._id === review._id ? { ...r, featured: data.review.featured } : r))
      );
    }
    setTogglingId(null);
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Reviews & Feedback</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-neutral-400">Loading reviews...</p>}

        {!isLoading && reviews.length === 0 && (
          <p className="text-neutral-400">No reviews match this filter.</p>
        )}

        {!isLoading &&
          reviews.map((review) => (
            <Link
              key={review._id}
              href={`${basePathSegment}/reviews/${review._id}`}
              className="block rounded-lg border border-base-800 bg-base-900 p-4 hover:border-brand-cyan-400"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-100">{review.submitterName}</span>
                <div className="flex items-center gap-2">
                  {review.status === "approved" && (
                    <button
                      onClick={(e) => handleToggleFeatured(e, review)}
                      disabled={togglingId === review._id}
                      title={review.featured ? "Unfeature from homepage" : "Feature on homepage"}
                      className={`rounded-full p-1.5 transition-colors ${
                        review.featured
                          ? "text-brand-cyan-300 hover:bg-brand-cyan-400/10"
                          : "text-neutral-500 hover:bg-base-800 hover:text-neutral-300"
                      }`}
                    >
                      <Star size={16} fill={review.featured ? "currentColor" : "none"} />
                    </button>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[review.status] || ""}`}>
                    {review.status}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-sm text-brand-cyan-300">{"★".repeat(review.rating)}</p>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-400">{review.body}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {review.customLabel || review.targetLabelSnapshot} ·{" "}
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
      </div>
    </div>
  );
}
