import { connectToDatabase } from "@/lib/db";
import ProcessStep from "@/models/ProcessStep";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Our Process | TGO DevStudio Prime",
  description: "How TGO DevStudio takes a project from idea to launch.",
};

export default async function ProcessPage() {
  await connectToDatabase();
  const steps = await ProcessStep.find({ publishStatus: "published" }).sort({ displayOrder: 1 }).lean();

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <span className="eyebrow-label">Process</span>
        <h1 className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
          How We Work
        </h1>
        <p className="mt-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          A clear, deliberate approach from first conversation to launch day.
        </p>

        {steps.length === 0 ? (
          <p className="mt-14" style={{ color: "var(--text-muted)" }}>Our process breakdown is coming soon.</p>
        ) : (
          <div className="mt-14 space-y-0">
            {steps.map((step, index) => (
              <div key={step._id.toString()} className="relative flex gap-6 pb-10 last:pb-0">
                {index < steps.length - 1 && (
                  <span className="absolute left-[21px] top-11 h-full w-px" style={{ background: "linear-gradient(180deg, var(--color-brand-cyan-400), transparent)" }} />
                )}
                <span className="icon-badge-premium flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full brand-gradient-bg text-sm font-bold text-base-950">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{step.title}</h2>
                  <p className="mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
