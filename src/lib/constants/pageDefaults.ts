import { PageContentType } from "@/models/PageContent";
import { LEGAL_PAGE_DEFAULTS } from "@/lib/constants/legalContent";

interface PageDefault {
  title: string;
  content: string;
}

export const PAGE_DEFAULTS: Record<PageContentType, PageDefault> = {
  about: {
    title: "About TGO DevStudio",
    content: "<h2>Part of TGO</h2><p>TGO DevStudio is the full-stack software engineering arm of <strong>TGO</strong> &mdash; a parent brand built to house a family of ventures, each carrying the TGO name with its own distinct focus. DevStudio is where TGO's engineering work lives today; over time, other TGO-branded ventures will stand alongside it, each built with the same standard of craft.</p><h2>Why TGO DevStudio Exists</h2><p>TGO DevStudio exists to bring world-class engineering discipline to every project it takes on &mdash; built for everyone, without compromise. We believe great software shouldn't be defined by who can access it, but by the standard behind it. Every project that comes through TGO DevStudio is built the way we'd build it for ourselves: with full ownership of the outcome, from the first conversation to the day it ships, and long after.</p><h2>What We Stand For</h2><ul><li><strong>We don't ship anything we wouldn't trust in production ourselves.</strong> Quality isn't negotiable, regardless of project size or timeline.</li><li><strong>Every project gets the same standard.</strong> The same level of care and craftsmanship, every time.</li><li><strong>We explain our decisions.</strong> You'll always know why something was built the way it was &mdash; no black boxes, no unexplained trade-offs.</li><li><strong>We build for the long term.</strong> Code that's easy to maintain, extend, and hand off &mdash; not just code that works today.</li><li><strong>Security and quality are built in from day one</strong>, not bolted on after the fact.</li><li><strong>We stay honest</strong> about trade-offs, timelines, and limitations &mdash; even when it's the harder conversation to have.</li></ul>"
  },
  ...LEGAL_PAGE_DEFAULTS,
};

export const ACCESSIBILITY_DEFAULT = PAGE_DEFAULTS.accessibility;

export const HOME_DEFAULTS = {
  heroHeadline: "Software Built Like It Matters",
  heroSubheadline:
    "TGO DevStudio is a full-stack engineering studio building production-grade products with real ownership, from first conversation to launch day.",
  primaryCtaLabel: "View Our Work",
  primaryCtaHref: "/portfolio",
  secondaryCtaLabel: "Start a Project",
  secondaryCtaHref: "/contact",
  caseStudiesLabel: "Selected Work",
  caseStudiesHeading: "Featured Case Studies",
  servicesLabel: "Capabilities",
  servicesHeading: "What We Do",
  processLabel: "Approach",
  processHeading: "How We Work",
  teamLabel: "People",
  teamHeading: "The Team",
  testimonialsLabel: "Testimonials",
  testimonialsHeading: "What People Say",
  blogLabel: "Insights",
  blogHeading: "From the Blog",
  careersLabel: "Careers",
  careersHeading: "We're Building Something Worth Joining",
  careersNoRolesMessage: "No open roles right now — but we're always building our culture and team.",
  finalCtaHeading: "Ready to Build Something Real?",
  finalCtaDescription: "Let's talk about what you're building and how TGO DevStudio can help bring it to life.",
  finalCtaButtonLabel: "Start a Conversation",
  statOneValue: "1+",
  statOneLabel: "Years Active",
  statTwoValue: "5+",
  statTwoLabel: "Projects Shipped",
  statThreeValue: "10+",
  statThreeLabel: "Technologies Mastered",
};

export const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  accepting: { label: "Currently accepting new projects", color: "bg-green-500" },
  limited: { label: "Limited availability", color: "bg-amber-500" },
  booked: { label: "Fully booked", color: "bg-red-500" },
};

export const AVAILABILITY_DEFAULT = {
  state: "accepting",
  customMessage: "",
  indicatorColor: "#22c55e",
};
