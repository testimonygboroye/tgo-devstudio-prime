import Link from "next/link";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import Review from "@/models/Review";
import ReviewForm from "@/components/public/ReviewForm";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Testimonials | TGO DevStudio Prime",
  description: "See what people are saying about TGO DevStudio.",
};

export default async function TestimonialsPage() {
  await connectToDatabase();
  const reviews = await Review.find({ status: "approved" })
    .select("submitterName rating body targetLabelSnapshot customLabel featured createdAt")
    .sort({ featured: -1, createdAt: -1 })
    .lean();

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="eyebrow-label">Testimonials</span>
            <h1 className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
              What People Say
            </h1>
          </div>
          <a href="#review-form" className="btn-premium-secondary mt-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Skip to Review Form ↓
          </a>
        </div>

        {reviews.length === 0 ? (
          <p className="mt-10" style={{ color: "var(--text-muted)" }}>No reviews yet — be the first to share your experience.</p>
        ) : (
          <div className="mt-14 grid gap-7 sm:grid-cols-2">
            {reviews.map((review) => (
              <Link key={review._id.toString()} href={`/testimonials/${review._id.toString()}`} className="surface-card block">
                <div className="surface-card-inner p-7">
                  {review.featured && (
                    <span className="mb-3 inline-block rounded-full bg-brand-cyan-400/20 px-2 py-0.5 text-xs text-brand-cyan-300">Featured</span>
                  )}
                  <div className="flex gap-1 text-brand-cyan-300">
                    {"★".repeat(review.rating)}
                    <span style={{ color: "var(--border-subtle)" }}>{"★".repeat(5 - review.rating)}</span>
                  </div>
                  <p className="mt-3 line-clamp-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{review.body}</p>
                  <p className="mt-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{review.submitterName}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{review.customLabel || review.targetLabelSnapshot}</p>
                  <p className="mt-3 text-xs font-semibold text-brand-cyan-300">Read full review →</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div id="review-form" className="mt-20 scroll-mt-20 border-t pt-12" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="heading-premium text-3xl font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            Share Your Experience
          </h2>
          <div className="mt-7">
            <ReviewForm />
          </div>
        </div>
      </div>
    </main>
  );
}
