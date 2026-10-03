export type SeoIntent =
  | "brand"
  | "service"
  | "solution"
  | "industry"
  | "location"
  | "technology"
  | "commercial"
  | "informational";

export interface SeoKeywordCluster {
  id: string;
  intent: SeoIntent;
  topic: string;
  core: readonly string[];
  modifiers: readonly string[];
  locations?: readonly string[];
  technologies?: readonly string[];
}

/**
 * Internal SEO/content-planning architecture.
 *
 * IMPORTANT:
 * These targets are NOT automatically converted into thousands of
 * thin/indexable pages.
 *
 * A keyword becomes an indexable page only when TGO DevStudio has
 * genuinely useful, original content that satisfies that search intent.
 */
export const SEO_KEYWORD_CLUSTERS: readonly SeoKeywordCluster[] = [
  {
    id: "brand",
    intent: "brand",
    topic: "TGO DevStudio",
    core: [
      "TGO DevStudio",
      "TGO DevStudio Prime",
      "TGO software company",
      "TGO software engineering",
      "TGO full stack development",
      "TGO digital products",
    ],
    modifiers: [
      "company",
      "agency",
      "studio",
      "developers",
      "software company",
      "engineering company",
      "technology company",
      "development company",
    ],
  },

  {
    id: "full-stack",
    intent: "service",
    topic: "Full-stack software engineering",
    core: [
      "full stack development",
      "full stack software development",
      "full stack engineering",
      "custom software engineering",
      "end to end software development",
      "full stack development services",
    ],
    modifiers: [
      "company",
      "agency",
      "services",
      "consultant",
      "developers",
      "experts",
      "team",
      "studio",
      "partner",
    ],
  },

  {
    id: "web-development",
    intent: "service",
    topic: "Web development",
    core: [
      "web development",
      "custom web development",
      "website development",
      "web application development",
      "modern web development",
      "enterprise web development",
      "business website development",
      "professional website development",
      "responsive web development",
      "high performance web development",
    ],
    modifiers: [
      "company",
      "agency",
      "services",
      "developer",
      "developers",
      "consultant",
      "team",
      "studio",
    ],
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "Node.js",
      "Tailwind CSS",
    ],
  },

  {
    id: "mobile-development",
    intent: "service",
    topic: "Mobile applications",
    core: [
      "mobile app development",
      "custom mobile app development",
      "mobile application development",
      "iOS app development",
      "Android app development",
      "cross platform app development",
      "business mobile app development",
      "enterprise mobile app development",
    ],
    modifiers: [
      "company",
      "agency",
      "services",
      "developer",
      "developers",
      "consultant",
      "team",
    ],
    technologies: [
      "React Native",
      "Flutter",
      "TypeScript",
    ],
  },

  {
    id: "backend",
    intent: "service",
    topic: "Backend engineering",
    core: [
      "backend development",
      "backend engineering",
      "API development",
      "REST API development",
      "GraphQL development",
      "database development",
      "server side development",
      "scalable backend development",
      "secure backend development",
      "microservices development",
    ],
    modifiers: [
      "company",
      "agency",
      "services",
      "developer",
      "consultant",
      "engineering team",
    ],
    technologies: [
      "Node.js",
      "TypeScript",
      "MongoDB",
      "PostgreSQL",
      "Redis",
    ],
  },

  {
    id: "ai",
    intent: "solution",
    topic: "Artificial intelligence",
    core: [
      "AI development",
      "AI application development",
      "AI software development",
      "AI integration",
      "generative AI development",
      "AI automation",
      "AI chatbot development",
      "AI agent development",
      "intelligent software development",
      "machine learning application development",
    ],
    modifiers: [
      "company",
      "agency",
      "services",
      "developer",
      "consultant",
      "engineering team",
      "implementation",
    ],
  },

  {
    id: "saas",
    intent: "solution",
    topic: "SaaS and platforms",
    core: [
      "SaaS development",
      "SaaS application development",
      "SaaS platform development",
      "custom SaaS development",
      "B2B SaaS development",
      "software platform development",
      "business platform development",
      "cloud software development",
      "multi tenant SaaS development",
    ],
    modifiers: [
      "company",
      "agency",
      "services",
      "developer",
      "consultant",
      "team",
    ],
  },

  {
    id: "digital-products",
    intent: "solution",
    topic: "Digital product engineering",
    core: [
      "digital product development",
      "custom software development",
      "MVP development",
      "startup MVP development",
      "enterprise software development",
      "business software development",
      "marketplace development",
      "platform development",
      "product engineering",
      "software product development",
    ],
    modifiers: [
      "company",
      "agency",
      "services",
      "partner",
      "team",
      "studio",
    ],
  },

  {
    id: "ui-ux",
    intent: "service",
    topic: "UI UX engineering",
    core: [
      "UI UX design and development",
      "UX engineering",
      "product design and development",
      "design system development",
      "design system implementation",
      "premium website design",
      "SaaS UI UX design",
      "web application UI design",
      "digital product design",
    ],
    modifiers: [
      "company",
      "agency",
      "services",
      "studio",
      "team",
    ],
  },

  {
    id: "cloud-devops",
    intent: "service",
    topic: "Cloud and DevOps",
    core: [
      "cloud engineering",
      "cloud application development",
      "DevOps services",
      "CI CD implementation",
      "cloud deployment",
      "cloud infrastructure",
      "infrastructure automation",
      "Docker development",
      "Kubernetes services",
      "production deployment",
    ],
    modifiers: [
      "company",
      "agency",
      "consultant",
      "services",
      "engineering team",
      "partner",
    ],
    technologies: [
      "AWS",
      "Google Cloud",
      "Azure",
      "Docker",
      "Kubernetes",
      "Vercel",
      "Netlify",
    ],
  },

  {
    id: "security",
    intent: "service",
    topic: "Application security",
    core: [
      "application security",
      "web application security",
      "API security",
      "secure software development",
      "authentication implementation",
      "authorization implementation",
      "security engineering",
      "application security audit",
      "secure web development",
    ],
    modifiers: [
      "company",
      "services",
      "consultant",
      "engineering",
      "development",
      "audit",
    ],
  },

  {
    id: "ecommerce",
    intent: "solution",
    topic: "Ecommerce engineering",
    core: [
      "ecommerce development",
      "custom ecommerce development",
      "online store development",
      "ecommerce platform development",
      "headless ecommerce development",
      "marketplace development",
      "payment integration",
      "shopping platform development",
    ],
    modifiers: [
      "company",
      "agency",
      "services",
      "developer",
      "consultant",
    ],
  },

  {
    id: "integrations",
    intent: "solution",
    topic: "Software integrations",
    core: [
      "API integration",
      "third party API integration",
      "payment gateway integration",
      "CRM integration",
      "ERP integration",
      "email integration",
      "cloud service integration",
      "webhook integration",
      "software integration services",
    ],
    modifiers: [
      "company",
      "agency",
      "services",
      "developer",
      "consultant",
    ],
  },

  {
    id: "industries",
    intent: "industry",
    topic: "Industry-specific software",
    core: [
      "fintech software development",
      "healthcare software development",
      "education software development",
      "ecommerce software development",
      "real estate software development",
      "logistics software development",
      "media software development",
      "church software development",
      "event technology development",
      "manufacturing software development",
      "business management software development",
      "professional services software development",
    ],
    modifiers: [
      "company",
      "agency",
      "services",
      "platform",
      "solutions",
      "consultant",
    ],
  },

  {
    id: "locations",
    intent: "location",
    topic: "Location-based software engineering",
    core: [
      "software development company",
      "web development company",
      "mobile app development company",
      "software engineering company",
      "full stack development company",
      "custom software company",
      "technology company",
      "software consulting company",
    ],
    modifiers: [
      "near me",
      "in Nigeria",
      "in Lagos",
      "in Abuja",
      "in Port Harcourt",
      "in Ibadan",
      "in Benin City",
      "in Enugu",
      "in Kano",
      "in Ghana",
      "in Kenya",
      "in South Africa",
      "in the UK",
      "in the United States",
      "in Canada",
    ],
    locations: [
      "Nigeria",
      "Lagos",
      "Abuja",
      "Port Harcourt",
      "Ibadan",
      "Benin City",
      "Enugu",
      "Kano",
      "Ghana",
      "Kenya",
      "South Africa",
      "United Kingdom",
      "United States",
      "Canada",
    ],
  },

  {
    id: "technology",
    intent: "technology",
    topic: "Technology-specific engineering",
    core: [
      "Next.js development",
      "React development",
      "TypeScript development",
      "Node.js development",
      "MongoDB development",
      "PostgreSQL development",
      "React Native development",
      "Flutter development",
      "Tailwind CSS development",
      "API development",
    ],
    modifiers: [
      "company",
      "agency",
      "services",
      "developer",
      "developers",
      "consultant",
      "experts",
      "team",
    ],
  },

  {
    id: "consulting",
    intent: "commercial",
    topic: "Software consulting",
    core: [
      "software consulting",
      "technology consulting",
      "software architecture consulting",
      "technical consulting",
      "digital transformation consulting",
      "product engineering consulting",
      "software modernization consulting",
      "technology strategy consulting",
    ],
    modifiers: [
      "company",
      "firm",
      "services",
      "partner",
      "consultant",
      "experts",
    ],
  },

  {
    id: "informational",
    intent: "informational",
    topic: "Software engineering knowledge",
    core: [
      "how to build a web application",
      "how to build a SaaS platform",
      "how to build a mobile app",
      "how to choose a software development company",
      "how much does custom software cost",
      "how much does web development cost",
      "how much does mobile app development cost",
      "software development process",
      "software architecture guide",
      "MVP development guide",
      "SaaS development guide",
      "web application security guide",
      "API development guide",
      "cloud deployment guide",
    ],
    modifiers: [
      "guide",
      "explained",
      "best practices",
      "checklist",
      "tutorial",
      "comparison",
      "framework",
      "for businesses",
      "for startups",
    ],
  },
];

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

/**
 * Generates a large internal search-target inventory.
 *
 * These targets are planning data. They should only become indexable
 * pages when the site has substantial content for the search intent.
 */
export function generateSeoKeywordTargets(): string[] {
  const targets: string[] = [];

  for (const cluster of SEO_KEYWORD_CLUSTERS) {
    for (const core of cluster.core) {
      targets.push(core);

      for (const modifier of cluster.modifiers) {
        targets.push(`${core} ${modifier}`);
      }

      for (const technology of cluster.technologies ?? []) {
        targets.push(`${technology} ${core}`);

        for (const modifier of cluster.modifiers) {
          targets.push(`${technology} ${core} ${modifier}`);
        }
      }

      for (const location of cluster.locations ?? []) {
        targets.push(`${core} in ${location}`);

        for (const modifier of cluster.modifiers) {
          targets.push(`${core} ${modifier} ${location}`);
        }
      }
    }
  }

  return unique(targets);
}

export const SEO_KEYWORD_TARGET_COUNT =
  generateSeoKeywordTargets().length;
