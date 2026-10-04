import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import { SERVICE_ICON_MAP } from "@/lib/constants/serviceIcons";
import { Code, ArrowLeft } from "lucide-react";
import { slugify } from "@/lib/utils/slugify";
import { getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getService(slug: string) {
  await connectToDatabase();

  const services = await Service.find({
    publishStatus: "published",
  })
    .sort({ displayOrder: 1 })
    .lean();

  return (
    services.find((service) => slugify(service.title) === slug) ||
    null
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await getServerLocale();
  const { slug } = await params;
  const rawService = await getService(slug);

  if (!rawService) {
    return {
      title: "Service Not Found | TGO DevStudio Prime",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const service = getLocalizedContent(
    rawService,
    locale,
    TRANSLATABLE_FIELDS.Service
  );

  const title = `${service.title} | TGO DevStudio Prime`;
  const description = service.summary;

  return {
    title,
    description,
    alternates: {
      canonical: `/services/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: PageProps) {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const { slug } = await params;

  const rawService = await getService(slug);

  if (!rawService) {
    notFound();
  }

  const service = getLocalizedContent(
    rawService,
    locale,
    TRANSLATABLE_FIELDS.Service
  );

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/services/${slug}`;
  const IconComp = SERVICE_ICON_MAP[service.icon] || Code;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        name: service.title,
        description: service.summary,
        url: pageUrl,
        provider: {
          "@type": "Organization",
          name: "TGO DevStudio",
          url: siteUrl,
        },
        areaServed: [
          {
            "@type": "Country",
            name: "Nigeria",
          },
          {
            "@type": "Place",
            name: "Africa",
          },
          {
            "@type": "Place",
            name: "Worldwide",
          },
        ],
        serviceType: service.title,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Services",
            item: `${siteUrl}/services`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: service.title,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      <div className="mx-auto max-w-4xl">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-brand-cyan-300"
        >
          <ArrowLeft size={16} />
          {t("nav.services")}
        </Link>

        <div className="mt-10 flex h-16 w-16 items-center justify-center rounded-2xl brand-gradient-bg text-base-950">
          <IconComp size={28} />
        </div>

        <span className="eyebrow-label mt-8 block">
          TGO DevStudio Service
        </span>

        <h1
          className="heading-premium mt-4 text-5xl font-bold brand-gradient-text sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {service.title}
        </h1>

        <p
          className="mt-6 max-w-3xl text-xl leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {service.summary}
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="surface-card">
            <div className="surface-card-inner p-6">
              <p className="text-sm font-semibold text-brand-cyan-300">
                Strategy
              </p>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                We align technical decisions with business objectives,
                users and long-term product growth.
              </p>
            </div>
          </div>

          <div className="surface-card">
            <div className="surface-card-inner p-6">
              <p className="text-sm font-semibold text-brand-cyan-300">
                Engineering
              </p>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Production-focused engineering built for reliability,
                maintainability, performance and scale.
              </p>
            </div>
          </div>

          <div className="surface-card">
            <div className="surface-card-inner p-6">
              <p className="text-sm font-semibold text-brand-cyan-300">
                Delivery
              </p>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Clear communication, measurable progress and a product
                that is ready for real users.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-16 border-t pt-12" style={{ borderColor: "var(--border-subtle)" }}>
          <h2
            className="text-3xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Build with TGO DevStudio
          </h2>

          <p
            className="mt-4 max-w-3xl leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Tell us what you are building, the problem you are solving and
            where you want the product to go. TGO DevStudio can help turn
            the idea into a reliable, production-ready digital product.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="btn-premium-primary rounded-full px-7 py-3 font-semibold text-base-950"
            >
              Start a Conversation
            </Link>

            <Link
              href="/book-a-call"
              className="btn-premium-secondary rounded-full px-7 py-3 font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Book a Discovery Call
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
