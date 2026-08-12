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
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Get Started</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">
          {settings.heading}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-neutral-100/70">{settings.description}</p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-xl border border-base-800">
        <iframe
          src={`${settings.calendlyUrl}?background_color=0a0a0f&text_color=f5f5f8&primary_color=2ec5f0`}
          width="100%"
          height="700"
          frameBorder="0"
          title="Book a call with TGO DevStudio"
        />
      </div>
    </main>
  );
}
