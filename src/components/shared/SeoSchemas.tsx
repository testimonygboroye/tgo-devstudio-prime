import { getSiteUrl } from "@/lib/siteUrl";

export default function SeoSchemas() {
  const siteUrl = getSiteUrl();

  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl,
        name: "TGO DevStudio",
        alternateName: "TGO DevStudio Prime",
        description:
          "TGO DevStudio is a premium full-stack software engineering studio building websites, web applications, mobile applications, SaaS platforms, APIs, cloud systems, intelligent software and custom digital products.",
        publisher: {
          "@id": organizationId,
        },
        inLanguage: ["en", "fr", "es", "ar", "de", "yo"],
      },

      {
        "@type": "Organization",
        "@id": organizationId,
        name: "TGO DevStudio",
        alternateName: "TGO DevStudio Prime",
        url: siteUrl,
        logo: `${siteUrl}/icons/icon-512x512.png`,
        image: `${siteUrl}/icons/icon-512x512.png`,
        description:
          "Premium full-stack software engineering, custom software development, web development, mobile application development, AI, cloud engineering, cybersecurity, SaaS and digital product engineering.",
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
        knowsAbout: [
          "Full-stack software development",
          "Custom software development",
          "Software engineering",
          "Web development",
          "Website development",
          "Web application development",
          "Mobile application development",
          "Android development",
          "iOS development",
          "React development",
          "Next.js development",
          "Node.js development",
          "TypeScript development",
          "API development",
          "REST API development",
          "GraphQL development",
          "SaaS development",
          "AI development",
          "Artificial intelligence",
          "Generative AI",
          "AI agents",
          "Machine learning",
          "Cloud engineering",
          "Cloud application development",
          "DevOps",
          "Database engineering",
          "MongoDB",
          "PostgreSQL",
          "Cybersecurity",
          "Application security",
          "UI UX engineering",
          "Digital product development",
          "Product engineering",
          "MVP development",
          "Ecommerce development",
          "Software consulting",
          "Technology consulting",
          "Digital transformation",
          "Business automation",
          "Real-time application development",
          "Live streaming software",
        ],
        sameAs: [
          "https://github.com/testimonygboroye",
          "https://www.facebook.com/profile.php?id=61590906354276",
          "https://www.instagram.com/testimonygboroye",
        ],
      },

      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#webpage`,
        url: siteUrl,
        name: "TGO DevStudio Prime",
        description:
          "Premium full-stack software engineering and digital product development by TGO DevStudio.",
        isPartOf: {
          "@id": websiteId,
        },
        about: {
          "@id": organizationId,
        },
        inLanguage: ["en", "fr", "es", "ar", "de", "yo"],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}
