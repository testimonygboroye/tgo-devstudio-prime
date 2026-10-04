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
          "TGO DevStudio is a premium full-stack software engineering studio building websites, web applications, mobile applications, SaaS platforms, APIs, cloud systems, AI solutions, cybersecurity systems and custom digital products.",
        publisher: {
          "@id": organizationId,
        },
        inLanguage: [
          "en",
          "fr",
          "es",
          "ar",
          "de",
          "yo",
        ],
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
          "Premium full-stack software engineering, custom software development, web development, mobile application development, SaaS, AI, cloud engineering, cybersecurity and digital product engineering.",
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
          "Cross-platform development",
          "SaaS development",
          "MVP development",
          "Enterprise software",
          "React development",
          "Next.js development",
          "Node.js development",
          "TypeScript development",
          "Python development",
          "API development",
          "REST API development",
          "GraphQL development",
          "Database engineering",
          "MongoDB",
          "PostgreSQL",
          "Cloud engineering",
          "AWS",
          "Azure",
          "DevOps",
          "CI/CD",
          "Cybersecurity",
          "Application security",
          "AI development",
          "Generative AI",
          "AI agents",
          "Machine learning",
          "Business automation",
          "Digital transformation",
          "Ecommerce development",
          "Real-time applications",
          "Live streaming software",
          "UI UX engineering",
          "Digital product development",
          "Product engineering",
          "Software consulting",
          "Technology consulting",
        ],
        sameAs: [
          "https://github.com/testimonygboroye",
          "https://www.facebook.com/profile.php?id=61590906354276",
          "https://www.instagram.com/testimonygboroye",
        ],
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
