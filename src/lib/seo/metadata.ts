import { SEO_KEYWORD_TARGETS } from "@/lib/seo/keywordTargets";

export type SeoPage =
  | "home"
  | "services"
  | "portfolio"
  | "blog"
  | "about"
  | "process"
  | "contact"
  | "careers"
  | "team"
  | "testimonials"
  | "help"
  | "book-a-call"
  | "stack";

const PAGE_TERMS: Record<SeoPage, string[]> = {
  home: [
    "TGO DevStudio",
    "TGO DevStudio Prime",
    "full stack",
    "software engineering",
    "custom software",
    "digital product",
    "technology consulting",
    "Nigeria",
  ],

  services: [
    "development services",
    "engineering services",
    "software",
    "web",
    "mobile",
    "AI",
    "cloud",
    "cybersecurity",
    "database",
    "DevOps",
    "API",
    "SaaS",
  ],

  portfolio: [
    "portfolio",
    "projects",
    "case studies",
    "product",
    "software",
    "web",
    "mobile",
    "SaaS",
    "engineering",
  ],

  blog: [
    "software",
    "engineering",
    "development",
    "AI",
    "cloud",
    "security",
    "database",
    "SaaS",
    "technology",
  ],

  about: [
    "TGO DevStudio",
    "software engineering",
    "technology company",
    "digital product",
    "Nigeria",
  ],

  process: [
    "software project planning",
    "software development",
    "software engineering",
    "product development",
    "technical architecture",
    "MVP",
  ],

  contact: [
    "software development company",
    "software engineering company",
    "custom software",
    "technology consulting",
    "Nigeria",
  ],

  careers: [
    "TGO DevStudio careers",
    "software engineers",
    "software developers",
    "full stack developers",
    "AI developers",
    "cloud engineers",
    "DevOps engineers",
  ],

  team: [
    "TGO DevStudio",
    "software engineers",
    "software developers",
    "engineering team",
    "technology company",
  ],

  testimonials: [
    "TGO DevStudio",
    "software development company",
    "software engineering company",
    "digital products",
    "client projects",
  ],

  help: [
    "software development",
    "software engineering",
    "technology",
    "web development",
    "mobile app development",
    "AI development",
  ],

  "book-a-call": [
    "software development consultation",
    "software architecture consultation",
    "technology strategy consulting",
    "MVP consulting",
    "software engineering consulting",
  ],

  stack: [
    "Next.js",
    "React",
    "TypeScript",
    "MongoDB",
    "PostgreSQL",
    "Node.js",
    "software architecture",
    "web development",
  ],
};

export function getPageKeywords(
  page: SeoPage,
  limit = 24
): string[] {
  const terms = PAGE_TERMS[page];

  const scored = SEO_KEYWORD_TARGETS.map((keyword, index) => {
    const lower = keyword.toLowerCase();

    let score = 0;

    for (const term of terms) {
      if (lower.includes(term.toLowerCase())) {
        score += term.length;
      }
    }

    if (lower.includes("tgo devstudio")) {
      score += 1000;
    }

    if (lower.includes("nigeria")) {
      score += 20;
    }

    return {
      keyword,
      score,
      index,
    };
  });

  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.index - b.index
    )
    .slice(0, limit)
    .map(({ keyword }) => keyword);
}

export function getAllKeywordTargets(): readonly string[] {
  return SEO_KEYWORD_TARGETS;
}
