import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import BookACallSettings from "@/models/BookACallSettings";

export const revalidate = 300;

const DEFAULTS = {
  heading: "Book a Discovery Call",
  description: "Pick a time that works for you, and let's talk about what you're building.",
  calendlyUrl: "https://calendly.com/testimonygboroye-dev/30min",
};

export const metadata: Metadata = {
  title: "Book a Call | TGO DevStudio Prime",
  description: "Schedule a discovery call with TGO DevStudio to discuss your project.",
};

export default async function BookACallPage() {
  await connectToDatabase();
  const saved = await BookACallSettings.findOne().lean();
  const settings = saved || DEFAULTS;

  return (
    <main className="ambient-glow relative min-h-screen px-6 py-24 sm:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow-label justify-center">Get Started</span>
        <h1
          className="heading-premium mt-4 text-5xl font-bold brand-gradient-text sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {settings.heading}
        </h1>
        <p className="mx-auto mt-5 max-w-xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {settings.description}
        </p>
      </div>

      <div className="surface-card mx-auto mt-12 max-w-3xl">
        <div className="surface-card-inner overflow-hidden">
          <iframe
            src={`${settings.calendlyUrl}?background_color=131722&text_color=f1f3f8&primary_color=2ec5f0`}
            width="100%"
            height="700"
            frameBorder="0"
            title="Book a call with TGO DevStudio"
          />
        </div>
      </div>
    </main>
  );
}
