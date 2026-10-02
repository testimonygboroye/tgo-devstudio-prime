import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import Review from "@/models/Review";
import { ArrowLeft } from "lucide-react";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getReview(id: string) {
  await connectToDatabase();

  return Review.findOne({
    _id: id,
    status: "approved",
  })
    .select(
      "submitterName rating body targetLabelSnapshot customLabel featured createdAt translations"
    )
    .lean();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getServerLocale();
  const { id } = await params;
  const rawReview = await getReview(id);

  if (!rawReview) {
    return { title: "Testimonial Not Found | TGO DevStudio Prime" };
  }

  const review = getLocalizedContent(
    rawReview,
    locale,
    TRANSLATABLE_FIELDS.Review
  );

  return {
    title: `${review.submitterName}'s Review | TGO DevStudio Prime`,
    description: review.body.slice(0, 150),
  };
}

export default async function TestimonialDetailPage({ params }: PageProps) {
  const locale = await getServerLocale();
  const t = createTranslator(locale);

  const { id } = await params;
  const rawReview = await getReview(id);

  if (!rawReview) {
    notFound();
  }

  const review = getLocalizedContent(
    rawReview,
    locale,
    TRANSLATABLE_FIELDS.Review
  );

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/testimonials"
          className="flex items-center gap-1 text-sm text-neutral-400 hover:text-brand-cyan-300"
        >
          <ArrowLeft size={16} /> {t("testimonials.backToTestimonials")}
        </Link>

        <div className="mt-8 rounded-xl border border-base-800 bg-base-900 p-8">
          {review.featured && (
            <span className="mb-4 inline-block rounded-full bg-brand-cyan-400/20 px-2 py-0.5 text-xs text-brand-cyan-300">
              {t("testimonials.featured")}
            </span>
          )}

          <div className="flex gap-1 text-brand-cyan-300">
            {"★".repeat(review.rating)}
            <span className="text-base-800">
              {"★".repeat(5 - review.rating)}
            </span>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-lg text-neutral-100/90">
            {review.body}
          </p>

          <p className="mt-6 text-sm font-semibold text-neutral-100">
            {review.submitterName}
          </p>

          <p className="text-xs text-neutral-500">
            {review.customLabel || review.targetLabelSnapshot}
          </p>
        </div>
      </div>
    </main>
  );
}
