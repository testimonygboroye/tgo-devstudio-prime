"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star, Home } from "lucide-react";

interface ReviewListItem {
  _id: string;
  submitterName: string;
  rating: number;
  body: string;
  status: string;
  featured: boolean;
  featuredOnHomepage: boolean;
  targetLabelSnapshot?: string;
  customLabel?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-brand-cyan-400/20 text-brand-cyan-300",
  approved: "bg-green-500/20 text-green-300",
  rejected: "bg-red-500/20 text-red-300",
};

const PAGE_SIZE = 10;

export default function ReviewsListClient() {
  const pathname = usePathname();
  const basePathSegment = `/${pathname.split("/").filter(Boolean)[0]}`;

  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const filteredReviews = useMemo(() => {
    if (!searchQuery.trim()) return reviews;
    const term = searchQuery.toLowerCase();
    return reviews.filter(
      (r) => r.submitterName.toLowerCase().includes(term) || r.body.toLowerCase().includes(term)
    );
  }, [reviews, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const pageItems = filteredReviews.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleToggle(
    event: React.MouseEvent,
    review: ReviewListItem,
    action: "setFeatured" | "setFeaturedOnHomepage"
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (review.status !== "approved") return;

    const key = action === "setFeatured" ? "featured" : "featuredOnHomepage";
    setTogglingId(review._id + action);

    const res = await fetch(`/api/reviews/${review._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, [key]: !review[key] }),
    });
    const data = await res.json();

    if (data.status === "ok") {
      setReviews((prev) =>
        prev.map((r) => (r._id === review._id ? { ...r, [key]: data.review[key] } : r))
      );
    }
    setTogglingId(null);
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Reviews & Feedback</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or content..."
          className="w-full max-w-xs rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
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

      {searchQuery && (
        <p className="mt-2 text-xs text-neutral-500">Showing results for "{searchQuery}"</p>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-neutral-400">Loading reviews...</p>}

        {!isLoading && pageItems.length === 0 && (
          <p className="text-neutral-400">No reviews match this filter.</p>
        )}

        {!isLoading &&
          pageItems.map((review) => (
            <Link
              key={review._id}
              href={`${basePathSegment}/reviews/${review._id}`}
              className="block rounded-lg border border-base-800 bg-base-900 p-4 hover:border-brand-cyan-400"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-100">{review.submitterName}</span>
                <div className="flex items-center gap-1.5">
                  {review.status === "approved" && (
                    <>
                      <button
                        onClick={(e) => handleToggle(e, review, "setFeatured")}
                        disabled={togglingId === review._id + "setFeatured"}
                        title={review.featured ? "Unfeature on Testimonials page" : "Feature on Testimonials page"}
                        className={`rounded-full p-1.5 transition-colors ${
                          review.featured
                            ? "text-brand-cyan-300 hover:bg-brand-cyan-400/10"
                            : "text-neutral-500 hover:bg-base-800 hover:text-neutral-300"
                        }`}
                      >
                        <Star size={16} fill={review.featured ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={(e) => handleToggle(e, review, "setFeaturedOnHomepage")}
                        disabled={togglingId === review._id + "setFeaturedOnHomepage"}
                        title={review.featuredOnHomepage ? "Remove from Homepage" : "Show on Homepage"}
                        className={`rounded-full p-1.5 transition-colors ${
                          review.featuredOnHomepage
                            ? "text-brand-violet-300 hover:bg-brand-violet-500/10"
                            : "text-neutral-500 hover:bg-base-800 hover:text-neutral-300"
                        }`}
                      >
                        <Home size={16} fill={review.featuredOnHomepage ? "currentColor" : "none"} />
                      </button>
                    </>
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

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-md border border-base-800 px-3 py-1.5 text-neutral-100 hover:bg-base-900 disabled:pointer-events-none disabled:text-neutral-600"
          >
            ← Previous
          </button>
          <span className="text-neutral-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-base-800 px-3 py-1.5 text-neutral-100 hover:bg-base-900 disabled:pointer-events-none disabled:text-neutral-600"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
