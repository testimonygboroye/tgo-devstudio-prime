import type { PublicPageKey } from "@/models/PublicPageContent";

export const PUBLIC_SITE_SETTINGS_DEFAULTS = {
  brandName: "TGO DevStudio",
  brandDescriptor: "TGO DevStudio Prime",
  siteTitle: "TGO DevStudio Prime",
  siteDescription: "TGO DevStudio builds premium software, websites, apps, SaaS platforms, AI systems, cloud solutions, and custom digital products.",
  faviconUrl: "/favicon.png",
  openGraphImageUrl: "/opengraph-image",
  logoUrl: "/logo.png",
  logoAlt: "TGO DevStudio logo",
  announcementEnabled: false,
  announcementText: "",
  headerCtaLabel: "Start a project",
  headerCtaHref: "/contact",
  clientPortalLabel: "Client Portal",
  clientPortalHref: "/client/login",
  footerTagline: "A full-stack software engineering studio building premium, production-grade products from the ground up.",
  footerAddress: "Akure, Ondo State, Nigeria",
  contactEmail: "testimonygboroye.dev@gmail.com",
  contactPhone: "",
  newsletterEnabled: true,
  copyrightText: "© {year} TGO DevStudio. All rights reserved.",
  navigationGroups: [
    { title: "Company", links: [{ label: "About", href: "/about", icon: "Info" }] },
    { title: "Capabilities & Work", links: [
      { label: "Services", href: "/services", icon: "Layers" },
      { label: "Industries", href: "/industries", icon: "Building2" },
      { label: "Ways to work together", href: "/engagement-models", icon: "Handshake" },
      { label: "Service Packages", href: "/services/catalogue", icon: "Package" },
      { label: "Our Process", href: "/process", icon: "Workflow" },
      { label: "Portfolio", href: "/portfolio", icon: "Briefcase" },
      { label: "Technology Stack", href: "/stack", icon: "Boxes" },
    ] },
    { title: "Insights & Community", links: [
      { label: "Blog", href: "/blog", icon: "Newspaper" },
      { label: "Team", href: "/team", icon: "Users" },
      { label: "Testimonials", href: "/testimonials", icon: "Star" },
      { label: "FAQ", href: "/faq", icon: "MessageCircleQuestion" },
    ] },
    { title: "Connect & Support", links: [
      { label: "Careers", href: "/careers", icon: "DoorOpen" },
      { label: "Contact", href: "/contact", icon: "Mail" },
      { label: "Book a Call", href: "/book-a-call", icon: "PhoneCall" },
      { label: "Help Centre", href: "/help", icon: "HelpCircle" },
      { label: "Preferences", href: "/settings", icon: "Settings" },
      { label: "Privacy Policy", href: "/privacy-policy", icon: "ShieldCheck" },
      { label: "Consumer Terms", href: "/terms-of-service", icon: "FileText" },
      { label: "Usage Policy", href: "/usage-policy", icon: "ShieldCheck" },
      { label: "Accessibility", href: "/accessibility", icon: "FileText" },
    ] },
  ],
  footerSections: [
    { title: "Company", links: [
      { label: "About", href: "/about" },
      { label: "Services", href: "/services" },
      { label: "Industries", href: "/industries" },
      { label: "Ways to work together", href: "/engagement-models" },
      { label: "Service packages", href: "/services/catalogue" },
      { label: "Our Process", href: "/process" },
      { label: "Team", href: "/team" },
      { label: "Technology Stack", href: "/stack" },
    ] },
    { title: "Explore", links: [
      { label: "Portfolio", href: "/portfolio" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Testimonials", href: "/testimonials" },
    ] },
    { title: "Connect & Support", links: [
      { label: "Client Portal", href: "/client/login" },
      { label: "Contact", href: "/contact" },
      { label: "Book a Call", href: "/book-a-call" },
      { label: "Help Centre", href: "/help" },
      { label: "FAQ", href: "/faq" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Consumer Terms", href: "/terms-of-service" },
      { label: "Usage Policy", href: "/usage-policy" },
      { label: "Accessibility Statement", href: "/accessibility" },
      { label: "Preferences", href: "/settings" },
    ] },
  ],
  socialLinks: [
    { label: "WhatsApp", href: "https://wa.me/message/LUJ6PXE3ISDZF1", platform: "whatsapp" },
    { label: "GitHub", href: "https://github.com/testimonygboroye", platform: "github" },
    { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61590906354276", platform: "facebook" },
    { label: "Instagram", href: "https://www.instagram.com/testimonygboroye?igsh=MXU0dmxraXRwN2lnbw==", platform: "instagram" },
  ],
} as const;

export const PUBLIC_PAGE_DEFAULTS: Record<PublicPageKey, {
  pageKey: PublicPageKey;
  metaTitle: string;
  metaDescription: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroAccent: string;
  heroDescription: string;
  heroNote: string;
  introEyebrow: string;
  introHeading: string;
  introDescription: string;
  cards: Array<{ icon: string; eyebrow: string; title: string; subtitle: string; description: string; bulletPoints: string[]; displayOrder: number }>;
  ctaEyebrow: string;
  ctaHeading: string;
  ctaDescription: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
}> = {
  industries: {
    pageKey: "industries",
    metaTitle: "Industry Solutions | TGO DevStudio Prime",
    metaDescription: "Explore the business and operational challenges TGO DevStudio can help address through custom software, digital products, AI and cloud engineering.",
    heroEyebrow: "Industry solutions · Applied engineering",
    heroHeadline: "Technology shaped",
    heroAccent: "around real work.",
    heroDescription: "Different industries have different pressures, users and workflows. We start by understanding those realities, then build digital products and systems around the way your organisation needs to operate.",
    heroNote: "Industry context first. Technology choices second. Useful outcomes always.",
    introEyebrow: "Where we can help",
    introHeading: "One engineering mindset. Many kinds of challenges.",
    introDescription: "These are not off-the-shelf promises. They are examples of the types of problems we can scope and solve with a tailored approach.",
    cards: [
      { icon: "ShoppingBag", eyebrow: "SECTOR / 01", title: "Commerce & retail", subtitle: "", description: "Digital storefronts, customer experiences, inventory workflows, order management and connected commerce operations.", bulletPoints: ["E-commerce platforms", "Customer portals", "Inventory and order workflows"], displayOrder: 1 },
      { icon: "Landmark", eyebrow: "SECTOR / 02", title: "Finance & professional services", subtitle: "", description: "Secure client-facing systems and internal tools that make complex services easier to access, manage and understand.", bulletPoints: ["Client onboarding", "Workflow automation", "Reporting and account portals"], displayOrder: 2 },
      { icon: "GraduationCap", eyebrow: "SECTOR / 03", title: "Education & learning", subtitle: "", description: "Learning platforms and administration systems that connect learners, educators, content and progress.", bulletPoints: ["Learning management systems", "Student and staff portals", "Assessment and progress tools"], displayOrder: 3 },
      { icon: "HeartPulse", eyebrow: "SECTOR / 04", title: "Health & wellbeing", subtitle: "", description: "Thoughtful digital experiences for service discovery, appointment coordination and operational workflows, with privacy and security considered from the start.", bulletPoints: ["Appointment experiences", "Secure information workflows", "Service and provider directories"], displayOrder: 4 },
      { icon: "Truck", eyebrow: "SECTOR / 05", title: "Logistics & operations", subtitle: "", description: "Connected systems that improve visibility across tasks, teams, assets and the movement of work.", bulletPoints: ["Operations dashboards", "Dispatch and tracking tools", "Field-team applications"], displayOrder: 5 },
      { icon: "Video", eyebrow: "SECTOR / 06", title: "Media & creator platforms", subtitle: "", description: "Digital products for publishing, communities, streaming workflows and audience engagement.", bulletPoints: ["Content platforms", "Membership experiences", "Media workflow tools"], displayOrder: 6 },
      { icon: "Building2", eyebrow: "SECTOR / 07", title: "Business & enterprise", subtitle: "", description: "Custom systems that replace disconnected processes with clear, measurable and scalable operations.", bulletPoints: ["Internal business applications", "CRM and ERP integrations", "Executive reporting"], displayOrder: 7 },
      { icon: "Workflow", eyebrow: "SECTOR / 08", title: "Technology & SaaS", subtitle: "", description: "Product engineering for teams bringing new software products, APIs and intelligent services to market.", bulletPoints: ["SaaS platforms", "API ecosystems", "AI-enabled products"], displayOrder: 8 },
    ],
    ctaEyebrow: "Your context is unique",
    ctaHeading: "Let’s solve the problem behind the brief.",
    ctaDescription: "Tell us about your industry, users and the work you need technology to make easier.",
    ctaPrimaryLabel: "Discuss your challenge",
    ctaPrimaryHref: "/contact",
    ctaSecondaryLabel: "",
    ctaSecondaryHref: "",
  },
  "engagement-models": {
    pageKey: "engagement-models",
    metaTitle: "Engagement Models | TGO DevStudio Prime",
    metaDescription: "Explore flexible ways to work with TGO DevStudio, from scoped product delivery to dedicated engineering and ongoing improvement.",
    heroEyebrow: "Working together · Flexible delivery",
    heroHeadline: "The right working model",
    heroAccent: "for the work ahead.",
    heroDescription: "Not every challenge needs the same kind of engagement. We shape the working relationship around your goals, timeline, internal team and the level of support the product needs.",
    heroNote: "Clear scope and expectations · Visible progress · Agreed responsibilities",
    introEyebrow: "Ways to work with TGO",
    introHeading: "Start with the outcome. Choose the structure that fits.",
    introDescription: "We will recommend a model after understanding the work. Scope, fees, delivery schedule and responsibilities are documented and agreed before an engagement begins.",
    cards: [
      { icon: "Layers3", eyebrow: "MODEL / 01", title: "Project-based delivery", subtitle: "A defined product, feature or transformation", description: "A clear scope, agreed deliverables, milestones and acceptance criteria. Ideal when the outcome can be described and planned before implementation.", bulletPoints: ["Discovery and requirements", "Design and engineering milestones", "Testing, handover and launch planning"], displayOrder: 1 },
      { icon: "Users", eyebrow: "MODEL / 02", title: "Dedicated product team", subtitle: "An evolving roadmap with ongoing priorities", description: "A focused engineering relationship for organisations that need consistent product development capacity and a team that builds context over time.", bulletPoints: ["Agreed team composition and responsibilities", "Prioritised delivery backlog", "Regular reviews and progress reporting"], displayOrder: 2 },
      { icon: "LifeBuoy", eyebrow: "MODEL / 03", title: "Continuous improvement", subtitle: "An existing product that needs care and momentum", description: "A structured way to maintain, improve and extend a live system without treating every enhancement as a disconnected project.", bulletPoints: ["Maintenance and reliability planning", "Performance and UX improvements", "Feature enhancements and technical upkeep"], displayOrder: 3 },
      { icon: "Compass", eyebrow: "MODEL / 04", title: "Discovery & technical advisory", subtitle: "An early idea or a complex technical decision", description: "A focused engagement to clarify the problem, assess options, map risks and create a practical technical or product roadmap before a larger build.", bulletPoints: ["Product and technical discovery", "Architecture and integration assessment", "Prioritised recommendations and roadmap"], displayOrder: 4 },
    ],
    ctaEyebrow: "Not sure which model fits?",
    ctaHeading: "We’ll help you work it out.",
    ctaDescription: "Share the challenge and we’ll recommend a sensible structure for the work.",
    ctaPrimaryLabel: "Discuss your project",
    ctaPrimaryHref: "/contact",
    ctaSecondaryLabel: "Book a call",
    ctaSecondaryHref: "/book-a-call",
  },
};
