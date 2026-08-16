const siteUrl = process.env.SITE_URL || "https://tgo-devstudio-prime.onrender.com";

export default function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "TGO DevStudio",
    alternateName: "TGO DevStudio Prime",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    image: `${siteUrl}/logo.png`,
    description:
      "TGO DevStudio is a full-stack software engineering studio building production-grade websites, apps, and platforms.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Akure",
      addressRegion: "Ondo State",
      addressCountry: "NG",
    },
    email: "testimonygboroye.dev@gmail.com",
    sameAs: [
      "https://github.com/testimonygboroye",
      "https://www.facebook.com/profile.php?id=61590906354276",
      "https://www.instagram.com/testimonygboroye",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
