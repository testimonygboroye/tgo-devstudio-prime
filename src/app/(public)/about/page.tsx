import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import PageContent from "@/models/PageContent";
import AboutSettings from "@/models/AboutSettings";
import { PAGE_DEFAULTS } from "@/lib/constants/pageDefaults";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";
import ImageLightbox from "@/components/shared/ImageLightbox";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About | TGO DevStudio Prime",
  description: "The story, mission, and people behind TGO DevStudio.",
};

const FOUNDER_DEFAULTS = {
  founderName: "Testimony Oluwatimilehin Gboroye",
  founderRole: "Founder, TGO DevStudio",
  founderDescription:
    "Building TGO DevStudio Prime from the ground up as the studio's flagship proof of standard — the same care given to every project the studio takes on.",
  founderPhotoUrl: "/founder.png",
};

export default async function AboutPage() {
  await connectToDatabase();
  const [saved, founderSaved] = await Promise.all([
    PageContent.findOne({ type: "about" }).lean(),
    AboutSettings.findOne().lean(),
  ]);

  const page = saved || PAGE_DEFAULTS.about;
  const founder = founderSaved || FOUNDER_DEFAULTS;

  const contentParts = page.content.split("<h2>What We Stand For</h2>");
  const beforeFounder = contentParts[0] || page.content;
  const afterFounder = contentParts[1] ? `<h2>What We Stand For</h2>${contentParts[1]}` : "";

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <span className="eyebrow-label">About</span>
        <h1 className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
          {page.title}
        </h1>

        <div
          className="prose prose-invert mt-10 max-w-none"
          style={{ color: "var(--text-secondary)" }}
          dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(beforeFounder) }}
        />

        <div className="surface-card mt-12">
          <div className="surface-card-inner flex flex-col items-center gap-7 p-8 sm:flex-row sm:items-start">
            <ImageLightbox src={founder.founderPhotoUrl} alt={founder.founderName}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={founder.founderPhotoUrl}
                alt={founder.founderName}
                className="h-[140px] w-[140px] flex-shrink-0 rounded-full object-cover"
                style={{ boxShadow: "0 0 0 3px var(--border-subtle)" }}
              />
            </ImageLightbox>
            <div>
              <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{founder.founderName}</p>
              <p className="text-sm text-brand-cyan-300">{founder.founderRole}</p>
              <p className="mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{founder.founderDescription}</p>
            </div>
          </div>
        </div>

        {afterFounder && (
          <div
            className="prose prose-invert mt-12 max-w-none"
            style={{ color: "var(--text-secondary)" }}
            dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(afterFounder) }}
          />
        )}
      </div>
    </main>
  );
}
