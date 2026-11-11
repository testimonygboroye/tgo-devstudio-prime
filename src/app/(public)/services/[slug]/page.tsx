import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import { SERVICE_ICON_MAP } from "@/lib/constants/serviceIcons";
import { Code, ArrowLeft, ArrowUpRight, Compass, ShieldCheck, Rocket } from "lucide-react";
import SmartImage from "@/components/public/SmartImage";
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
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/services/${slug}`;
  const image = service.coverImage?.url || `${siteUrl}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      url: canonical,
      title,
      description,
      type: "website",
      siteName: "TGO DevStudio",
      images: [{ url: image, alt: service.coverImage?.altText || service.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
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
    <main className="service-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
      <div className="home-container service-detail-container">
        <Link href="/services" className="service-detail-back"><ArrowLeft size={16}/>{t("nav.services")}</Link>
        <section className="service-detail-hero">
          <div className="service-detail-hero-copy">
            <span className="service-detail-icon"><IconComp size={27}/></span>
            <span className="eyebrow-label">TGO DEVSTUDIO · SERVICE CAPABILITY</span>
            <h1>{service.title}</h1>
            <p>{service.summary}</p>
            <div className="service-detail-actions"><Link href="/contact" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white">Discuss this service <ArrowUpRight size={17}/></Link><Link href="/book-a-call" className="service-detail-secondary">Book a discovery call <ArrowUpRight size={16}/></Link></div>
          </div>
          {service.coverImage?.url&&<div className="service-detail-image"><SmartImage src={service.coverImage.url} alt={service.coverImage.altText||service.title} label={service.title}/></div>}
        </section>
        <section className="service-detail-method"><div className="service-detail-section-heading"><span className="eyebrow-label">How we deliver</span><h2>Considered at every layer.</h2><p>We connect the business goal, the user experience and the engineering decisions so the finished product works as one.</p></div>
          <div className="service-detail-pillars">
            <article><span><Compass size={21}/></span><small>01 / STRATEGY</small><h3>Start with the right problem.</h3><p>We align technical decisions with business objectives, users and long-term product growth.</p></article>
            <article><span><ShieldCheck size={21}/></span><small>02 / ENGINEERING</small><h3>Build on dependable foundations.</h3><p>Production-focused engineering built for reliability, maintainability, performance and scale.</p></article>
            <article><span><Rocket size={21}/></span><small>03 / DELIVERY</small><h3>Make progress visible.</h3><p>Clear communication, measurable milestones and a product that is ready for real users.</p></article>
          </div>
        </section>
        <section className="service-detail-cta"><div><span className="eyebrow-label">Make the next move</span><h2>Build with TGO DevStudio.</h2><p>Tell us what you are building, the problem you are solving and where you want the product to go. We can help turn the idea into a reliable, production-ready digital product.</p></div><div className="flex flex-wrap gap-3"><Link href="/contact" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white">Start a conversation <ArrowUpRight size={17}/></Link><Link href="/book-a-call" className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold" style={{color:"var(--text-primary)"}}>Book a call <ArrowUpRight size={17}/></Link></div></section>
      </div>
    </main>
  );
}
