import Link from "next/link";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import Review from "@/models/Review";
import ReviewForm from "@/components/public/ReviewForm";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Testimonials | TGO DevStudio Prime",
  description: "See what people are saying about TGO DevStudio.",
  openGraph: {
    title: "Testimonials | TGO DevStudio Prime",
    description: "See what people are saying about TGO DevStudio.",
    type: "website",
  },
};

export default async function TestimonialsPage() {
  await connectToDatabase();
  const reviews = await Review.find({ status: "approved" })
    .select("submitterName rating body targetLabelSnapshot customLabel featured createdAt")
    .sort({ featured: -1, createdAt: -1 })
    .lean();

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Testimonials</p>
            <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">What People Say</h1>
          </div>
          <a
            href="#review-form"
            className="mt-2 whitespace-nowrap rounded-md border border-brand-cyan-400/50 px-4 py-2 text-sm font-semibold text-brand-cyan-300 hover:bg-brand-cyan-400/10"
          >
            Skip to Review Form ↓
          </a>
        </div>

        {reviews.length === 0 ? (
          <p className="mt-8 text-neutral-400">No reviews yet — be the first to share your experience.</p>
        ) : (
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {reviews.map((review) => (
              <Link
                key={review._id.toString()}
                href={`/testimonials/${review._id.toString()}`}
                className={`block rounded-xl border p-6 transition-colors hover:border-brand-cyan-400 ${
                  review.featured ? "border-brand-cyan-400/50 bg-base-900" : "border-base-800 bg-base-900"
                }`}
              >
                {review.featured && (
                  <span className="mb-3 inline-block rounded-full bg-brand-cyan-400/20 px-2 py-0.5 text-xs text-brand-cyan-300">
                    Featured
                  </span>
                )}
                <div className="flex gap-1 text-brand-cyan-300">
                  {"★".repeat(review.rating)}
                  <span className="text-base-800">{"★".repeat(5 - review.rating)}</span>
                </div>
                <p className="mt-3 line-clamp-3 text-neutral-100/90">{review.body}</p>
                <p className="mt-4 text-sm font-semibold text-neutral-100">{review.submitterName}</p>
                <p className="text-xs text-neutral-500">{review.customLabel || review.targetLabelSnapshot}</p>
                <p className="mt-3 text-xs font-semibold text-brand-cyan-300">Read full review →</p>
              </Link>
            ))}
          </div>
        )}

        <div id="review-form" className="mt-16 scroll-mt-20 border-t border-base-800 pt-10">
          <h2 className="text-2xl font-semibold text-neutral-100">Share Your Experience</h2>
          <div className="mt-6">
            <ReviewForm />
          </div>
        </div>
      </div>
    </main>
  );
}
