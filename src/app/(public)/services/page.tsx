import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import { SERVICE_ICON_MAP } from "@/lib/constants/serviceIcons";
import { Code } from "lucide-react";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import {
  createTranslator,
  getLocalizedContent,
} from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import { slugify } from "@/lib/utils/slugify";
import { getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getServerLocale());

  return {
    title: `${t("nav.services")} | TGO DevStudio Prime`,
    description:
      "Explore TGO DevStudio's full-stack software engineering services, including custom software, web applications, mobile apps, SaaS, APIs, AI, cloud, cybersecurity and digital products.",
    alternates: {
      canonical: "/services",
    },
    openGraph: {
      title: "Software Engineering Services | TGO DevStudio Prime",
      description:
        "Custom software, web, mobile, SaaS, AI, cloud, cybersecurity and digital product engineering.",
      type: "website",
    },
  };
}

export default async function ServicesPage() {
  await connectToDatabase();

  const locale = await getServerLocale();
  const t = createTranslator(locale);

  const services = (
    await Service.find({
      publishStatus: "published",
    })
      .sort({ displayOrder: 1 })
      .lean()
  ).map((service) =>
    getLocalizedContent(
      service,
      locale,
      TRANSLATABLE_FIELDS.Service
    )
  );

  const siteUrl = getSiteUrl();

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "TGO DevStudio Software Engineering Services",
    url: `${siteUrl}/services`,
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: service.title,
      url: `${siteUrl}/services/${slugify(service.title)}`,
    })),
  };

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      <div className="mx-auto max-w-6xl">
        <span className="eyebrow-label">{t("nav.services")}</span>

        <h1
          className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("services.title")}
        </h1>

        <p
          className="mt-4 max-w-3xl leading-relaxed"
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
              const IconComp =
                SERVICE_ICON_MAP[service.icon] || Code;

              return (
                <Link
                  key={service._id.toString()}
                  href={`/services/${slugify(service.title)}`}
                  className="surface-card group block"
                >
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

                    <span className="mt-5 inline-block text-xs font-semibold text-brand-cyan-300">
                      Explore service →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
