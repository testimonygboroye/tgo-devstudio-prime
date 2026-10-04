export type SEOKeywordCategory =
  | "brand"
  | "service"
  | "technology"
  | "industry"
  | "location"
  | "commercial"
  | "informational"
  | "problem"
  | "comparison";

export interface SEOKeywordTarget {
  keyword: string;
  category: SEOKeywordCategory;
  intent: "commercial" | "informational" | "navigational";
  priority: "high" | "medium" | "supporting";
}

const services = [
  "full stack development",
  "full stack software development",
  "custom software development",
  "software engineering",
  "web development",
  "website development",
  "web application development",
  "mobile app development",
  "android app development",
  "ios app development",
  "cross platform app development",
  "react development",
  "next.js development",
  "node.js development",
  "typescript development",
  "javascript development",
  "frontend development",
  "backend development",
  "api development",
  "rest api development",
  "graphql development",
  "saas development",
  "enterprise software development",
  "business software development",
  "digital product development",
  "product engineering",
  "software consulting",
  "technology consulting",
  "digital transformation",
  "cloud application development",
  "cloud software development",
  "database development",
  "mongodb development",
  "postgresql development",
  "authentication development",
  "payment integration",
  "third party api integration",
  "real time application development",
  "real time web application development",
  "ai application development",
  "artificial intelligence software development",
  "machine learning application development",
  "automation software development",
  "workflow automation",
  "dashboard development",
  "admin dashboard development",
  "business dashboard development",
  "ecommerce development",
  "marketplace development",
  "booking platform development",
  "customer portal development",
  "internal business software",
  "custom crm development",
  "custom erp development",
  "inventory management software",
  "business management software",
  "school management software",
  "church management software",
  "event management software",
  "livestream platform development",
  "media platform development",
  "security software development",
  "cybersecurity application development",
  "progressive web app development",
  "pwa development",
  "website redesign",
  "web application redesign",
  "software modernization",
  "legacy software modernization",
  "software maintenance",
  "software optimization",
  "performance optimization",
  "technical seo",
  "website seo",
  "web accessibility development",
  "ui ux engineering",
  "premium website development",
  "startup mvp development",
  "mvp software development",
  "prototype development",
  "proof of concept development",
  "software architecture",
  "system architecture",
  "technical architecture",
  "devops engineering",
  "deployment automation",
  "continuous integration",
  "continuous deployment",
];

const technologies = [
  "Next.js",
  "React",
  "Node.js",
  "TypeScript",
  "JavaScript",
  "MongoDB",
  "PostgreSQL",
  "Tailwind CSS",
  "REST API",
  "GraphQL",
  "WebSockets",
  "Socket.IO",
  "WebRTC",
  "GitHub",
  "Vercel",
  "Netlify",
  "Render",
  "cloud deployment",
  "serverless",
  "Docker",
  "AWS",
  "Google Cloud",
  "Cloudinary",
  "Tiptap",
  "JWT authentication",
  "OAuth",
  "two factor authentication",
];

const industries = [
  "business",
  "startups",
  "technology companies",
  "fintech",
  "healthtech",
  "edtech",
  "ecommerce",
  "real estate",
  "logistics",
  "transportation",
  "hospitality",
  "healthcare",
  "education",
  "churches",
  "ministries",
  "media companies",
  "events",
  "entertainment",
  "professional services",
  "consulting firms",
  "manufacturing",
  "construction",
  "retail",
  "agriculture",
  "oil and gas",
  "nonprofits",
  "government organizations",
];

const locations = [
  "Nigeria",
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
  "Benin City",
  "Enugu",
  "Kano",
  "Kaduna",
  "Warri",
  "Uyo",
  "Calabar",
  "Owerri",
  "Asaba",
  "Delta State",
  "Rivers State",
  "Bayelsa State",
  "Akwa Ibom",
  "Ondo State",
  "Oyo State",
  "West Africa",
  "Africa",
  "United Kingdom",
  "United States",
];

const commercialModifiers = [
  "company",
  "agency",
  "studio",
  "developers",
  "development company",
  "development agency",
  "software company",
  "software agency",
  "development team",
  "engineering team",
  "consultant",
  "consulting company",
  "experts",
  "specialists",
  "services",
  "solutions",
  "partner",
  "near me",
];

const problemTerms = [
  "for startups",
  "for small businesses",
  "for growing businesses",
  "for enterprises",
  "for companies",
  "for organizations",
  "for churches",
  "for events",
  "for Nigerian businesses",
  "for African businesses",
  "for modern businesses",
  "for digital products",
  "for scalable products",
  "for high traffic applications",
  "for secure applications",
  "for real time applications",
  "for business automation",
  "for digital transformation",
  "for MVPs",
  "for SaaS products",
];

const coreBrandKeywords = [
  "TGO DevStudio",
  "TGO DevStudio Prime",
  "TGO DevStudio Nigeria",
  "TGO DevStudio Lagos",
  "TGO DevStudio Abuja",
  "TGO DevStudio Port Harcourt",
  "TGO DevStudio software company",
  "TGO DevStudio software engineering",
  "TGO DevStudio full stack development",
  "TGO DevStudio web development",
  "TGO DevStudio mobile app development",
  "TGO DevStudio custom software",
  "TGO DevStudio digital products",
  "TGO DevStudio software consulting",
  "TGO DevStudio technology company",
];

const keywordMap = new Map<string, SEOKeywordTarget>();

function add(
  keyword: string,
  category: SEOKeywordCategory,
  intent: SEOKeywordTarget["intent"],
  priority: SEOKeywordTarget["priority"],
) {
  const normalized = keyword.trim().replace(/\s+/g, " ");
  if (!normalized) return;

  const existing = keywordMap.get(normalized.toLowerCase());

  if (!existing) {
    keywordMap.set(normalized.toLowerCase(), {
      keyword: normalized,
      category,
      intent,
      priority,
    });
  }
}

for (const keyword of coreBrandKeywords) {
  add(keyword, "brand", "navigational", "high");
}

for (const service of services) {
  add(service, "service", "commercial", "high");

  for (const modifier of commercialModifiers) {
    add(`${service} ${modifier}`, "commercial", "commercial", "medium");
  }

  for (const location of locations) {
    add(`${service} ${location}`, "location", "commercial", "high");
    add(`${service} company ${location}`, "location", "commercial", "high");
  }

  for (const problem of problemTerms) {
    add(`${service} ${problem}`, "problem", "commercial", "medium");
  }
}

for (const technology of technologies) {
  add(`${technology} development`, "technology", "commercial", "high");
  add(`${technology} developer`, "technology", "commercial", "medium");
  add(`${technology} development company`, "technology", "commercial", "high");
  add(`${technology} development Nigeria`, "technology", "commercial", "high");

  for (const location of locations.slice(0, 12)) {
    add(`${technology} development ${location}`, "location", "commercial", "medium");
  }
}

for (const industry of industries) {
  for (const service of services.slice(0, 30)) {
    add(`${service} for ${industry}`, "industry", "commercial", "medium");
  }
}

const informationalTemplates = [
  "what is",
  "how to choose",
  "how much does",
  "how long does",
  "best",
  "guide to",
  "benefits of",
  "cost of",
  "difference between",
  "how does",
  "why use",
  "when to use",
];

for (const service of services) {
  for (const template of informationalTemplates) {
    add(`${template} ${service}`, "informational", "informational", "supporting");
  }
}

for (const technology of technologies) {
  for (const template of informationalTemplates.slice(0, 7)) {
    add(`${template} ${technology}`, "informational", "informational", "supporting");
  }
}

export const SEO_KEYWORD_TARGETS: SEOKeywordTarget[] = Array.from(
  keywordMap.values(),
);

export const SEO_KEYWORD_COUNT = SEO_KEYWORD_TARGETS.length;

export function getKeywordsByCategory(
  category: SEOKeywordCategory,
): SEOKeywordTarget[] {
  return SEO_KEYWORD_TARGETS.filter((item) => item.category === category);
}

export function getHighPriorityKeywords(): SEOKeywordTarget[] {
  return SEO_KEYWORD_TARGETS.filter((item) => item.priority === "high");
}
