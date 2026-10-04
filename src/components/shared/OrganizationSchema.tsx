import { getSiteUrl } from "@/lib/siteUrl";

export default function OrganizationSchema() {
  const siteUrl = getSiteUrl();

  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const founderId = `${siteUrl}/about#founder`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": [
          "Organization",
          "ProfessionalService",
        ],
        "@id": organizationId,
        name: "TGO DevStudio",
        alternateName: [
          "TGO DevStudio Prime",
          "TGO DevStudio",
        ],
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        image: `${siteUrl}/logo.png`,
        description:
          "TGO DevStudio is a full-stack software engineering studio building websites, web applications, mobile applications, APIs, SaaS platforms, digital products, cloud systems, intelligent software, and custom business technology.",
        email: "testimonygboroye.dev@gmail.com",
        founder: {
          "@id": founderId,
        },
        areaServed: [
          {
            "@type": "Country",
            name: "Nigeria",
          },
          {
            "@type": "Place",
            name: "Worldwide",
          },
        ],
        knowsAbout: [
          "Full-stack software development",
          "Web development",
          "Website development",
          "Web application development",
          "Mobile application development",
          "Software engineering",
          "Custom software development",
          "Software architecture",
          "Frontend development",
          "Backend development",
          "API development",
          "REST API development",
          "GraphQL development",
          "SaaS development",
          "Cloud software development",
          "Cloud engineering",
          "DevOps",
          "Database engineering",
          "MongoDB",
          "PostgreSQL",
          "Node.js",
          "Next.js",
          "React",
          "TypeScript",
          "React Native",
          "Flutter",
          "Tailwind CSS",
          "Artificial intelligence",
          "Machine learning",
          "Generative AI",
          "AI agents",
          "Cybersecurity",
          "Application security",
          "UI/UX engineering",
          "Digital product development",
          "MVP development",
          "Ecommerce development",
          "Software consulting",
          "Technology consulting",
          "Digital transformation",
        ],
        sameAs: [
          "https://github.com/testimonygboroye",
          "https://www.facebook.com/profile.php?id=61590906354276",
          "https://www.instagram.com/testimonygboroye",
        ],
      },

      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl,
        name: "TGO DevStudio",
        alternateName: "TGO DevStudio Prime",
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
        "@type": "Person",
        "@id": founderId,
        name: "Testimony Oluwatimilehin Gboroye",
        jobTitle: "Founder & CEO",
        url: `${siteUrl}/about`,
        image: `${siteUrl}/founder.png`,
        worksFor: {
          "@id": organizationId,
        },
        affiliation: {
          "@id": organizationId,
        },
        knowsAbout: [
          "Software engineering",
          "Full-stack development",
          "Web development",
          "Mobile application development",
          "Software architecture",
          "Digital product development",
          "Technology",
          "Software consulting",
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
