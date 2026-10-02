import { connectToDatabase } from "@/lib/db";
import ProcessStep from "@/models/ProcessStep";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getServerLocale());

  return {
    title: `${t("nav.process")} | TGO DevStudio Prime`,
    description: t("process.subtitle"),
  };
}

export default async function ProcessPage() {
  await connectToDatabase();

  const locale = await getServerLocale();
  const t = createTranslator(locale);

  const steps = (await ProcessStep.find({
    publishStatus: "published",
  }).sort({ displayOrder: 1 }).lean()).map((step) =>
    getLocalizedContent(
      step,
      locale,
      TRANSLATABLE_FIELDS.ProcessStep
    )
  );

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <span className="eyebrow-label">{t("nav.process")}</span>

        <h1
          className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("process.title")}
        </h1>

        <p
          className="mt-4 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {t("process.subtitle")}
        </p>

        {steps.length === 0 ? (
          <p className="mt-14" style={{ color: "var(--text-muted)" }}>
            {t("common.loading")}
          </p>
        ) : (
          <div className="mt-14 space-y-0">
            {steps.map((step, index) => (
              <div
                key={step._id.toString()}
                className="relative flex gap-6 pb-10 last:pb-0"
              >
                {index < steps.length - 1 && (
                  <span
                    className="absolute left-[21px] top-11 h-full w-px"
                    style={{
                      background:
                        "linear-gradient(180deg, var(--color-brand-cyan-400), transparent)",
                    }}
                  />
                )}

                <span className="icon-badge-premium flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full brand-gradient-bg text-sm font-bold text-base-950">
                  {index + 1}
                </span>

                <div>
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {step.title}
                  </h2>

                  <p
                    className="mt-1.5 leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
