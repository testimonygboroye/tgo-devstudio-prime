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

function extractSection(html: string, heading: string): string {
  const marker = `<h2>${heading}</h2>`;
  const start = html.indexOf(marker);
  if (start === -1) return "";
  const rest = html.slice(start + marker.length);
  const nextHeadingIdx = rest.search(/<h2>/);
  return nextHeadingIdx === -1 ? rest : rest.slice(0, nextHeadingIdx);
}

export default async function AboutPage() {
  await connectToDatabase();
  const [saved, founderSaved] = await Promise.all([
    PageContent.findOne({ type: "about" }).lean(),
    AboutSettings.findOne().lean(),
  ]);

  const page = saved || PAGE_DEFAULTS.about;
  const founder = founderSaved || FOUNDER_DEFAULTS;

  const partOfTgo = extractSection(page.content, "Part of TGO");
  const whyExists = extractSection(page.content, "Why TGO DevStudio Exists");
  const standFor = extractSection(page.content, "What We Stand For");

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="ambient-glow relative overflow-hidden px-6 py-24 text-center sm:px-12 sm:py-32">
        <span className="eyebrow-label justify-center">The Story</span>
        <h1
          className="heading-premium mx-auto mt-5 max-w-3xl text-5xl font-bold brand-gradient-text sm:text-7xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {page.title}
        </h1>
        {partOfTgo && (
          <div
            className="prose prose-invert mx-auto mt-8 max-w-2xl text-lg leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
            dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(partOfTgo) }}
          />
        )}
      </section>

      {/* Why We Exist — full-width statement */}
      {whyExists && (
        <section className="border-t px-6 py-20 sm:px-12" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow-label justify-center">Our Why</span>
            <div
              className="prose prose-invert mx-auto mt-6 max-w-none text-lg leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
              dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(whyExists) }}
            />
          </div>
        </section>
      )}

      {/* Founder Spotlight — dramatic, full treatment */}
      <section className="border-t px-6 py-24 sm:px-12" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="mx-auto max-w-5xl">
          <div className="surface-card">
            <div className="surface-card-inner grid gap-10 p-10 sm:grid-cols-[220px_1fr] sm:p-14">
              <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <ImageLightbox src={founder.founderPhotoUrl} alt={founder.founderName}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={founder.founderPhotoUrl}
                    alt={founder.founderName}
                    className="h-[180px] w-[180px] rounded-2xl object-cover"
                    style={{ boxShadow: "0 0 0 3px var(--border-subtle)" }}
                  />
                </ImageLightbox>
              </div>
              <div className="flex flex-col justify-center">
                <span className="eyebrow-label">Meet the Founder</span>
                <h2
                  className="heading-premium mt-3 text-3xl font-bold sm:text-4xl"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                >
                  {founder.founderName}
                </h2>
                <p className="mt-1 font-semibold text-brand-cyan-300">{founder.founderRole}</p>
                <p className="mt-5 text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {founder.founderDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Stand For — as a real values grid, not plain text */}
      {standFor && (
        <section className="border-t px-6 py-24 sm:px-12" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <span className="eyebrow-label justify-center">Our Principles</span>
              <h2
                className="heading-premium mt-3 text-4xl font-bold sm:text-5xl"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
              >
                What We Stand For
              </h2>
            </div>

            <div
              className="values-grid prose prose-invert mx-auto mt-12 max-w-3xl"
              style={{ color: "var(--text-secondary)" }}
              dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(standFor) }}
            />
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="ambient-glow relative border-t px-6 py-24 text-center sm:px-12" style={{ borderColor: "var(--border-subtle)" }}>
        <h2 className="heading-premium text-4xl font-bold brand-gradient-text sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
          Let&apos;s Build Something Real
        </h2>
        <p className="mx-auto mt-4 max-w-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Every project gets the same standard — no exceptions.
        </p>
        <a href="/contact" className="btn-premium-primary mt-9 inline-block rounded-full px-9 py-4 text-lg font-semibold text-base-950">
          Start a Conversation
        </a>
      </section>
    </main>
  );
}
