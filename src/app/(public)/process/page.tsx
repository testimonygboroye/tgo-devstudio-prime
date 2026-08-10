import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import ProcessStep from "@/models/ProcessStep";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Our Process | TGO DevStudio Prime",
  description: "How TGO DevStudio takes a project from idea to launch.",
  openGraph: {
    title: "Our Process | TGO DevStudio Prime",
    description: "How TGO DevStudio takes a project from idea to launch.",
    type: "website",
  },
};

export default async function ProcessPage() {
  await connectToDatabase();
  const steps = await ProcessStep.find({ publishStatus: "published" })
    .sort({ displayOrder: 1 })
    .lean();

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Process</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">How We Work</h1>
        <p className="mt-4 text-neutral-100/70">
          A clear, deliberate approach from first conversation to launch day.
        </p>

        {steps.length === 0 ? (
          <p className="mt-12 text-neutral-400">Our process breakdown is coming soon.</p>
        ) : (
          <div className="mt-12 space-y-0">
            {steps.map((step, index) => (
              <div key={step._id.toString()} className="relative flex gap-6 pb-10 last:pb-0">
                {index < steps.length - 1 && (
                  <span className="absolute left-[19px] top-10 h-full w-px bg-base-800" />
                )}
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full brand-gradient-bg text-sm font-bold text-base-950">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-100">{step.title}</h2>
                  <p className="mt-1 text-neutral-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
