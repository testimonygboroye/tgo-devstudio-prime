import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Call | TGO DevStudio Prime",
  description: "Schedule a discovery call with TGO DevStudio to discuss your project.",
  openGraph: {
    title: "Book a Call | TGO DevStudio Prime",
    description: "Schedule a discovery call with TGO DevStudio to discuss your project.",
    type: "website",
  },
};

export default function BookACallPage() {
  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Get Started</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">
          Book a Discovery Call
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-neutral-100/70">
          Pick a time that works for you, and let's talk about what you're building.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-xl border border-base-800">
        <iframe
          src="https://calendly.com/testimonygboroye-dev/30min?background_color=0a0a0f&text_color=f5f5f8&primary_color=2ec5f0"
          width="100%"
          height="700"
          frameBorder="0"
          title="Book a call with TGO DevStudio"
        />
      </div>
    </main>
  );
}
