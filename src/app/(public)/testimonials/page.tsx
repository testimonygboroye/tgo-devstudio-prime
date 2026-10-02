import Link from "next/link";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import Review from "@/models/Review";
import ReviewForm from "@/components/public/ReviewForm";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Testimonials | TGO DevStudio Prime",
  description: "See what people are saying about TGO DevStudio.",
};

export default async function TestimonialsPage() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);

  await connectToDatabase();

  const rawReviews = await Review.find({
    status: "approved",
  })
    .select(
      "submitterName rating body targetLabelSnapshot customLabel featured createdAt translations"
    )
    .sort({ featured: -1, createdAt: -1 })
    .lean();

  const reviews = rawReviews.map((review) =>
    getLocalizedContent(review, locale, TRANSLATABLE_FIELDS.Review)
  );

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-5xl">
        <span className="eyebrow-label">{t("nav.testimonials")}</span>

        <h1
          className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("testimonials.title")}
        </h1>

        <p
          className="mt-4 max-w-2xl leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {t("testimonials.subtitle")}
        </p>

        <div className="mt-14 grid gap-7 sm:grid-cols-2">
          {reviews.map((review) => (
            <Link
              key={review._id.toString()}
              href={`/testimonials/${review._id.toString()}`}
              className="surface-card block"
            >
              <div className="surface-card-inner p-7">
                <div className="flex gap-1 text-brand-cyan-300">
                  {"★".repeat(review.rating)}
                  <span className="text-base-800">
                    {"★".repeat(5 - review.rating)}
                  </span>
                </div>

                <p
                  className="mt-3 line-clamp-3 leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {review.body}
                </p>

                <p
                  className="mt-4 text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {review.submitterName}
                </p>

                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {review.customLabel || review.targetLabelSnapshot}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div
          id="review-form"
          className="mt-20 border-t pt-12"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <h2
            className="text-3xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("common.submit")}
          </h2>

          <div className="mt-7">
            <ReviewForm />
          </div>
        </div>
      </div>
    </main>
  );
}
