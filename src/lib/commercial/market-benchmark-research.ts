export interface ResearchedMarketBenchmark {
  serviceNames: string[];
  benchmark: {
    low: number;
    high: number;
    typical: number;
    currency: "NGN";
    checkedAt: string;
    methodology: string;
    sources: Array<{ label: string; url: string; note: string }>;
  };
}

/**
 * Public Nigerian provider price evidence checked 2026-11-27.
 * "typical" is the arithmetic midpoint of the observed range, not a claimed
 * market mean or median. Each record is scoped to the described service.
 */
export const MARKET_BENCHMARK_RESEARCH: ResearchedMarketBenchmark[] = [
  {
    serviceNames: ["Custom Business Website"],
    benchmark: {
      low: 150000, high: 2500000, typical: 1325000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "Broad business-website comparison: the lower bound reflects a five-provider Nigerian entry business-site sample (₦150,000–₦500,000); the upper bound reflects a published Nigerian agency custom-designed business-site range (₦800,000–₦2,500,000+). The upper source tier is open-ended (₦2,500,000+), so the stored high value is not a hard ceiling. The midpoint is a calculated range midpoint, not an observed average. Scope and page count must be matched before quoting.",
      sources: [
        { label: "Etchpoint — What a Website Actually Costs in Nigeria (21 Aug 2026)", url: "https://etchpoint.com/what-a-website-costs/", note: "Reports ₦150,000–₦500,000 entry business-site prices across five Nigerian providers." },
        { label: "LineTech — Outsourcing Software Development in Nigeria (2026)", url: "https://www.linestech.com.ng/blog/outsourcing-software-development-in-nigeria/", note: "Reports ₦800,000–₦2,500,000+ for agency custom-designed business websites." },
      ],
    },
  },
  {
    serviceNames: ["Custom Web Application"],
    benchmark: {
      low: 1500000, high: 10000000, typical: 5750000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "Published Nigerian planning range for custom web application projects. Covers focused tools through complex platforms. The source reports an open-ended ₦10,000,000+ upper tier, so ₦10,000,000 is not a ceiling. The midpoint is arithmetic only and must not be treated as a market mean. Multi-role workflows, payment integrations, security, data migration and scale change the quote materially.",
      sources: [
        { label: "LineTech — Custom Web Application Development in Nigeria (2026)", url: "https://www.linestech.com.ng/blog/custom-web-application-development-in-nigeria/", note: "Reports ₦1,500,000–₦10,000,000+ by scope tier." },
        { label: "Nivarix — Custom Software Development Cost in Nigeria (28 Sep 2026)", url: "https://nivarix.com/insights/custom-software-development-cost-nigeria", note: "Reports focused tools at ₦1.5m–₦6m and business web applications at ₦6m–₦20m." },
      ],
    },
  },
  {
    serviceNames: ["AI Solutions & Intelligent Automation"],
    benchmark: {
      low: 300000, high: 5000000, typical: 2650000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "Broad published range from basic rule-based chatbots (₦300,000–₦1,500,000) to AI assistants using a business knowledge base (₦1,000,000–₦5,000,000). The midpoint is arithmetic only, not a market average. Agentic workflows, private-data access, governance, evaluation and usage charges require separate scoping.",
      sources: [
        { label: "LineTech — Digital Transformation Cost in Nigeria (2026)", url: "https://www.linestech.com.ng/blog/digital-transformation-cost-in-nigeria/", note: "Separately lists basic chatbots at ₦300,000–₦1,500,000 and business-knowledge AI assistants at ₦1,000,000–₦5,000,000." },
        { label: "LineTech — Outsourcing Software Development in Nigeria (2026)", url: "https://www.linestech.com.ng/blog/outsourcing-software-development-in-nigeria/", note: "Business automation project range is ₦500,000–₦5,000,000+ before tool subscriptions." },
      ],
    },
  },
  {
    serviceNames: ["Software Maintenance & Managed Support"],
    benchmark: {
      low: 50000, high: 350000, typical: 200000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "Monthly Nigerian software-support retainer range for basic through standard support. The midpoint is arithmetic only, not a market average. 24/7 coverage, infrastructure operations, guaranteed response times and dedicated engineering capacity may exceed this band and must be quoted separately.",
      sources: [
        { label: "LineTech — Software Maintenance Costs in Nigeria (2026)", url: "https://www.linestech.com.ng/blog/software-maintenance-costs-in-nigeria/", note: "Lists basic support at ₦50,000–₦120,000/month and standard retainers at ₦120,000–₦350,000/month; managed service at ₦350,000–₦900,000+." },
        { label: "LineTech — Outsourcing Software Development in Nigeria (2026)", url: "https://www.linestech.com.ng/blog/outsourcing-software-development-in-nigeria/", note: "Reports maintenance/support retainers at ₦150,000–₦1,000,000/month depending on scope." },
      ],
    },
  },

  {
    serviceNames: ["Software Consulting & Strategy"],
    benchmark: {
      low: 300000, high: 1500000, typical: 900000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "One-off discovery and requirements-planning range published for Nigerian software outsourcing. Midpoint is arithmetic only, not a market average; ongoing advisory retainers and enterprise architecture programmes need separate scoping.",
      sources: [{ label: "LineTech — Outsourcing Software Development in Nigeria (2026)", url: "https://www.linestech.com.ng/blog/outsourcing-software-development-in-nigeria/", note: "Discovery and requirements phase: ₦300,000–₦1,500,000." }],
    },
  },
  {
    serviceNames: ["Mobile Application Development"],
    benchmark: {
      low: 1300000, high: 4000000, typical: 2650000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "Comparable simple single-platform MVP band. DPX publishes Android from ₦1,300,000 and iOS from ₦1,500,000; Inventrium reports simple single-platform MVPs at ₦1,500,000–₦4,000,000. Midpoint is arithmetic only, not a market average. Backend services, payments and multi-platform scope may increase cost.",
      sources: [
        { label: "DPX — App Development Cost Nigeria (updated 25 Nov 2026)", url: "https://dpx.com.ng/app-development-cost-nigeria", note: "Android starts at ₦1,300,000; iOS starts at ₦1,500,000." },
        { label: "Inventrium — Mobile App Development Cost Nigeria (2026)", url: "https://www.inventrium.net/guides/mobile-app-development-cost-nigeria", note: "Simple single-platform MVP: ₦1,500,000–₦4,000,000." },
      ],
    },
  },
  {
    serviceNames: ["E-commerce & Marketplaces"],
    benchmark: {
      low: 400000, high: 3500000, typical: 1950000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "Published one-off Nigerian ecommerce website range. This covers store builds and catalogues; multi-vendor marketplace workflows, complex inventory, logistics and custom settlement systems require a separate quote. Midpoint is arithmetic only, not a market average.",
      sources: [{ label: "LineTech — Digital Transformation Cost in Nigeria (2026)", url: "https://www.linestech.com.ng/blog/digital-transformation-cost-in-nigeria/", note: "E-commerce website: ₦400,000–₦3,500,000+." }],
    },
  },
  {
    serviceNames: ["Backend & API Engineering"],
    benchmark: {
      low: 150000, high: 1200000, typical: 675000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "Component-level reference for payment gateway/API integration only, not a whole backend platform or a general API engineering day rate. Midpoint is arithmetic only, not a market average.",
      sources: [{ label: "LineTech — Digital Transformation Cost in Nigeria (2026)", url: "https://www.linestech.com.ng/blog/digital-transformation-cost-in-nigeria/", note: "Payment gateway integration: ₦150,000–₦1,200,000." }],
    },
  },
  {
    serviceNames: ["Database & Data Engineering"],
    benchmark: {
      low: 200000, high: 3000000, typical: 1600000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "Component-level Nigerian price range for data cleaning and migration. It is not a benchmark for large-scale analytics platforms, streaming pipelines or data warehouses. Midpoint is arithmetic only, not a market average.",
      sources: [{ label: "LineTech — Digital Transformation Cost in Nigeria (2026)", url: "https://www.linestech.com.ng/blog/digital-transformation-cost-in-nigeria/", note: "Data cleaning and migration: ₦200,000–₦3,000,000." }],
    },
  },
  {
    serviceNames: ["Business Automation"],
    benchmark: {
      low: 500000, high: 5000000, typical: 2750000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "Published one-off Nigerian business-automation project range. Third-party subscriptions and usage charges are excluded. Midpoint is arithmetic only, not a market average.",
      sources: [{ label: "LineTech — Outsourcing Software Development in Nigeria (2026)", url: "https://www.linestech.com.ng/blog/outsourcing-software-development-in-nigeria/", note: "Business automation project: ₦500,000–₦5,000,000+ before subscriptions." }],
    },
  },
  {
    serviceNames: ["Enterprise Software"],
    benchmark: {
      low: 2000000, high: 30000000, typical: 16000000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "Published Nigerian custom CRM and business-management software planning range. The source is open-ended above ₦30,000,000, so this is not a ceiling. Midpoint is arithmetic only, not a market average; ERP and regulated enterprise systems need custom discovery.",
      sources: [{ label: "LineTech — Outsourcing Software Development in Nigeria (2026)", url: "https://www.linestech.com.ng/blog/outsourcing-software-development-in-nigeria/", note: "Custom CRM/business management software: ₦2,000,000–₦30,000,000+." }],
    },
  },
  {
    serviceNames: ["Systems Integration"],
    benchmark: {
      low: 500000, high: 4000000, typical: 2250000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "Component-level one-off reference for accounting/ERP integration. Scope, API quality, data migration and reconciliation requirements change the estimate. Midpoint is arithmetic only, not a market average.",
      sources: [{ label: "LineTech — Digital Transformation Cost in Nigeria (2026)", url: "https://www.linestech.com.ng/blog/digital-transformation-cost-in-nigeria/", note: "Accounting or ERP integration: ₦500,000–₦4,000,000." }],
    },
  },
  {
    serviceNames: ["Technical Training & Enablement"],
    benchmark: {
      low: 150000, high: 1500000, typical: 825000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "Published one-off Nigerian training and adoption-support range. Group size, curriculum depth, delivery format and follow-up coaching must be matched before quoting. Midpoint is arithmetic only, not a market average.",
      sources: [{ label: "LineTech — Digital Transformation Cost in Nigeria (2026)", url: "https://www.linestech.com.ng/blog/digital-transformation-cost-in-nigeria/", note: "Training and adoption support: ₦150,000–₦1,500,000." }],
    },
  },
  {
    serviceNames: ["UI/UX & Product Design", "UI/UX & Digital Product Design", "UI/UX Design & Product Design"],
    benchmark: {
      low: 120000, high: 1200000, typical: 660000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "Published Nigerian product-design project range from a UX audit to a full/enterprise product design engagement. Screen count, research depth, prototypes, usability testing and design-system scope materially change the quote. Midpoint is arithmetic only, not a market average.",
      sources: [
        { label: "DigitalX — UI/UX Design Packages", url: "https://www.digitalx.com.ng/uiux-design", note: "UX audit ₦120,000; full UX/UI design ₦500,000; enterprise product design ₦1,200,000." },
        { label: "MZ Technologies — UI/UX Design Pricing", url: "https://mztech.com.ng/ui-ux-design.html", note: "Single product design ₦280,000 and full product suite ₦600,000." },
      ],
    },
  },
  {
    serviceNames: ["Cybersecurity", "Cybersecurity & Application Security", "Cybersecurity Services"],
    benchmark: {
      low: 150000, high: 2000000, typical: 1075000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "One-off Nigerian security audit and penetration-test reference range. It excludes managed security retainers and large red-team/cloud/network engagements, which can be substantially higher. Midpoint is arithmetic only, not a market average.",
      sources: [
        { label: "Inventrium — Cybersecurity Cost Nigeria (2026)", url: "https://www.inventrium.net/guides/cybersecurity-cost-nigeria", note: "One-off security audit ₦150,000–₦800,000; penetration testing ₦300,000–₦2,000,000." },
        { label: "6030 Technologies — Penetration Testing in Nigeria: Costs & Compliance (2026)", url: "https://6030technologies.com/penetration-testing-in-nigeria-and-costs/", note: "Complex engagements range from ₦1.5m to ₦15m+ depending on scope." },
      ],
    },
  },
  {
    serviceNames: ["Technical SEO & Optimisation", "Technical SEO & Website Optimisation", "SEO & Website Optimisation"],
    benchmark: {
      low: 150000, high: 500000, typical: 325000, currency: "NGN", checkedAt: "2026-11-27",
      methodology: "Monthly retainer band for established Nigerian agencies. Wider market prices can range from about ₦50,000/month to ₦1,500,000+/month for highly competitive campaigns; this stored typical band is the established-agency segment, not a universal rate. One-off technical audits are priced separately.",
      sources: [
        { label: "KD Tech NG — SEO Cost Nigeria (15 Jul 2026)", url: "https://www.kdtechng.com/tech-blog/seo-cost-nigeria", note: "Reports most established agencies around ₦150,000–₦500,000/month, with larger campaigns above ₦1.5m." },
        { label: "Nivarix — SEO Cost Nigeria 2026 (8 Oct 2026)", url: "https://nivarix.com/insights/seo-cost-nigeria-2026", note: "Reports common freelancer/small-agency work around ₦100,000–₦500,000/month and larger campaigns ₦500,000–₦1.5m+." },
      ],
    },
  },
];
