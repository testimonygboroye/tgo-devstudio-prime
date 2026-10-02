import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import { SERVICE_ICON_MAP } from "@/lib/constants/serviceIcons";
import { Code } from "lucide-react";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getServerLocale());
  return {
    title: `${t("nav.services")} | TGO DevStudio Prime`,
    description: t("services.subtitle"),
  };
}

export default async function ServicesPage() {
  await connectToDatabase();

  const locale = await getServerLocale();
  const t = createTranslator(locale);

  const services = (await Service.find({
    publishStatus: "published",
  }).sort({ displayOrder: 1 }).lean()).map((service) =>
    getLocalizedContent(
      service,
      locale,
      TRANSLATABLE_FIELDS.Service
    )
  );

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <span className="eyebrow-label">{t("nav.services")}</span>

        <h1
          className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("services.title")}
        </h1>

        <p
          className="mt-4 max-w-2xl leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {t("services.subtitle")}
        </p>

        {services.length === 0 ? (
          <p className="mt-14" style={{ color: "var(--text-muted)" }}>
            {t("home.noServices")}
          </p>
        ) : (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const IconComp = SERVICE_ICON_MAP[service.icon] || Code;

              return (
                <div key={service._id.toString()} className="surface-card">
                  <div className="surface-card-inner p-7">
                    <span className="icon-badge-premium flex h-12 w-12 items-center justify-center rounded-xl brand-gradient-bg text-base-950">
                      <IconComp size={22} />
                    </span>

                    <h2
                      className="mt-5 text-lg font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {service.title}
                    </h2>

                    <p
                      className="mt-2 text-sm leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {service.summary}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
