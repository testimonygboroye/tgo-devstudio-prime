const SERVICE_TERMS = [
  "custom software development",
  "software development company",
  "web development",
  "website development",
  "web application development",
  "mobile app development",
  "Android app development",
  "iOS app development",
  "cross-platform app development",
  "SaaS development",
  "MVP development",
  "enterprise software development",
  "API development",
  "backend development",
  "frontend development",
  "full-stack development",
  "React development",
  "Next.js development",
  "Node.js development",
  "TypeScript development",
  "Python development",
  "database development",
  "MongoDB development",
  "PostgreSQL development",
  "cloud engineering",
  "AWS development",
  "Azure development",
  "DevOps services",
  "CI/CD automation",
  "cybersecurity services",
  "application security",
  "AI development",
  "generative AI development",
  "AI agent development",
  "machine learning development",
  "business automation",
  "digital transformation",
  "ecommerce development",
  "real-time application development",
  "live streaming software development",
] as const;

const SEARCH_INTENTS = [
  "company",
  "agency",
  "studio",
  "services",
  "developer",
  "developers",
  "team",
  "consultant",
  "consulting",
  "cost",
  "pricing",
  "company in Nigeria",
  "company in Africa",
  "company in Lagos",
  "company in Abuja",
  "company in Port Harcourt",
] as const;

/**
 * Search-intent catalog.
 *
 * This is intentionally NOT injected as a giant meta-keyword list.
 * It is a planning/index used to guide real pages, service pages,
 * articles, case studies, FAQs and internal linking.
 */
export const SEO_SEARCH_INTENTS = Array.from(
  new Set(
    SERVICE_TERMS.flatMap((service) =>
      SEARCH_INTENTS.map((intent) => `${service} ${intent}`)
    )
  )
);

export const SEO_SEARCH_INTENT_COUNT = SEO_SEARCH_INTENTS.length;

export const SEO_SERVICE_TERMS = [...SERVICE_TERMS];

export const SEO_SEARCH_INTENT_GROUPS = SERVICE_TERMS.map((service) => ({
  service,
  intents: SEARCH_INTENTS.map((intent) => `${service} ${intent}`),
}));

if (SEO_SEARCH_INTENT_COUNT < 500) {
  throw new Error(
    `SEO search-intent catalog must contain at least 500 entries; found ${SEO_SEARCH_INTENT_COUNT}.`
  );
}
