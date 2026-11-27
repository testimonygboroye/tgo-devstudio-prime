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
];
