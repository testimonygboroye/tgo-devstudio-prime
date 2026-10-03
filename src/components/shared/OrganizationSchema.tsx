import { getSiteUrl } from "@/lib/siteUrl";

export default async function OrganizationSchema() {
  const siteUrl = await getSiteUrl();

  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#organization`,
    name: "TGO DevStudio",
    alternateName: "TGO DevStudio Prime",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    image: `${siteUrl}/logo.png`,
    description:
      "TGO DevStudio is a full-stack software engineering studio building production-grade websites, mobile applications, web applications, platforms, digital products, APIs, cloud systems, and intelligent software.",
    email: "testimonygboroye.dev@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Akure",
      addressRegion: "Ondo State",
      addressCountry: "NG",
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
      "Web application development",
      "Website development",
      "Mobile application development",
      "Software engineering",
      "Custom software development",
      "Software architecture",
      "API development",
      "Backend development",
      "Frontend development",
      "Cloud application development",
      "SaaS development",
      "Artificial intelligence software",
      "Machine learning software",
      "DevOps",
      "Database engineering",
      "Cybersecurity",
      "UI/UX engineering",
      "Digital product development",
      "Software consulting",
    ],
    sameAs: [
      "https://github.com/testimonygboroye",
      "https://www.facebook.com/profile.php?id=61590906354276",
      "https://www.instagram.com/testimonygboroye",
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
