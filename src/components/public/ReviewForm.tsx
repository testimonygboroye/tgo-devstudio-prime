"use client";

import { useState, useEffect, useCallback } from "react";
import {
  REVIEW_TARGET_TYPES,
  REVIEW_TARGET_LABELS,
  ReviewTargetType,
} from "@/lib/constants/reviewTargets";

const ID_REQUIRED_TYPES: ReviewTargetType[] = ["caseStudy", "teamMember", "blogPost", "jobOpening", "review"];

interface TargetItem {
  id: string;
  label: string;
}

export default function ReviewForm() {
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [targetType, setTargetType] = useState<ReviewTargetType>("general");
  const [targetId, setTargetId] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [targetItems, setTargetItems] = useState<TargetItem[]>([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const needsIdPicker = ID_REQUIRED_TYPES.includes(targetType);
  const needsCustomLabel = targetType === "custom";

  const loadTargets = useCallback(async (type: ReviewTargetType) => {
    setIsLoadingTargets(true);
    setTargetId("");
    try {
      const res = await fetch(`/api/reviews/targets?targetType=${type}`);
      const data = await res.json();
      if (data.status === "ok") {
        setTargetItems(data.items);
      }
    } finally {
      setIsLoadingTargets(false);
    }
  }, []);

  useEffect(() => {
    if (needsIdPicker) {
      loadTargets(targetType);
    } else {
      setTargetItems([]);
      setTargetId("");
    }
  }, [targetType, needsIdPicker, loadTargets]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (needsIdPicker && !targetId) {
      setError("Please select what this review is about.");
      return;
    }
    if (needsCustomLabel && !customLabel.trim()) {
      setError("Please describe what this review is about.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitterName,
          submitterEmail,
          rating,
          reviewBody,
          targetType,
          targetId: needsIdPicker ? targetId : undefined,
          customLabel: needsCustomLabel ? customLabel : undefined,
          companyWebsite,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to submit review.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-brand-cyan-400/40 bg-brand-cyan-400/10 p-6 text-center">
        <p className="font-semibold text-neutral-100">Thank you for your feedback</p>
        <p className="mt-1 text-sm text-neutral-400">
          Your review has been submitted and will appear once approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={companyWebsite}
        onChange={(event) => setCompanyWebsite(event.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-neutral-400">Your Name</label>
          <input
            required
            value={submitterName}
            onChange={(event) => setSubmitterName(event.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Email (not shown publicly)</label>
          <input
            required
            type="email"
            value={submitterEmail}
            onChange={(event) => setSubmitterEmail(event.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Rating</label>
        <div className="mt-1 flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`h-9 w-9 rounded-md border text-sm font-semibold ${
                star <= rating
                  ? "border-brand-cyan-400 brand-gradient-bg text-base-950"
                  : "border-base-800 bg-base-900 text-neutral-400"
              }`}
            >
              {star}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-neutral-400">What is this review about?</label>
        <select
          value={targetType}
          onChange={(event) => setTargetType(event.target.value as ReviewTargetType)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        >
          {REVIEW_TARGET_TYPES.map((type) => (
            <option key={type} value={type}>
              {REVIEW_TARGET_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {needsIdPicker && (
        <div>
          <label className="block text-sm text-neutral-400">Select specific item</label>
          <select
            required
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            disabled={isLoadingTargets}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400 disabled:opacity-60"
          >
            <option value="">{isLoadingTargets ? "Loading..." : "Select one"}</option>
            {targetItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {needsCustomLabel && (
        <div>
          <label className="block text-sm text-neutral-400">Describe what this is about</label>
          <input
            required
            value={customLabel}
            onChange={(event) => setCustomLabel(event.target.value)}
            placeholder="e.g. a project we did that isn't listed here"
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
      )}

      <div>
        <label className="block text-sm text-neutral-400">Your Review</label>
        <textarea
          required
          rows={5}
          value={reviewBody}
          onChange={(event) => setReviewBody(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md brand-gradient-bg px-5 py-2 font-semibold text-base-950 disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
