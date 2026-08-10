import type { Metadata } from "next";
import Image from "next/image";
import { connectToDatabase } from "@/lib/db";
import PageContent from "@/models/PageContent";
import { PAGE_DEFAULTS } from "@/lib/constants/pageDefaults";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About | TGO DevStudio Prime",
  description: "The story, mission, and people behind TGO DevStudio.",
  openGraph: {
    title: "About | TGO DevStudio Prime",
    description: "The story, mission, and people behind TGO DevStudio.",
    type: "website",
  },
};

export default async function AboutPage() {
  await connectToDatabase();
  const saved = await PageContent.findOne({ type: "about" }).lean();
  const page = saved || PAGE_DEFAULTS.about;

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">About</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">{page.title}</h1>

        <div
          className="prose prose-invert mt-10 max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(page.content) }}
        />

        <div className="mt-12 flex flex-col items-center gap-6 rounded-xl border border-base-800 bg-base-900 p-8 sm:flex-row sm:items-start">
          <Image
            src="/founder.png"
            alt="Testimony Oluwatimilehin Gboroye, Founder of TGO DevStudio"
            width={140}
            height={140}
            className="flex-shrink-0 rounded-full object-cover"
          />
          <div>
            <p className="text-lg font-semibold text-neutral-100">
              Testimony Oluwatimilehin Gboroye
            </p>
            <p className="text-sm text-brand-cyan-300">Founder, TGO DevStudio</p>
            <p className="mt-3 text-neutral-100/70">
              Building TGO DevStudio Prime from the ground up as the studio's flagship proof of
              standard — the same care given to every project the studio takes on.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
