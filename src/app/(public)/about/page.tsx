import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import PageContent from "@/models/PageContent";
import AboutSettings from "@/models/AboutSettings";
import { PAGE_DEFAULTS } from "@/lib/constants/pageDefaults";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";

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
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">About</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">{page.title}</h1>

        <div
          className="prose prose-invert mt-10 max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(beforeFounder) }}
        />

        <div className="mt-10 flex flex-col items-center gap-6 rounded-xl border border-base-800 bg-base-900 p-8 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={founder.founderPhotoUrl}
            alt={founder.founderName}
            className="h-[140px] w-[140px] flex-shrink-0 rounded-full object-cover"
          />
          <div>
            <p className="text-lg font-semibold text-neutral-100">{founder.founderName}</p>
            <p className="text-sm text-brand-cyan-300">{founder.founderRole}</p>
            <p className="mt-3 text-neutral-100/70">{founder.founderDescription}</p>
          </div>
        </div>

        {afterFounder && (
          <div
            className="prose prose-invert mt-10 max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(afterFounder) }}
          />
        )}
      </div>
    </main>
  );
}
