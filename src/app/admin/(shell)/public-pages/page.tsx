import Link from "next/link";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import { getAdminBasePath } from "@/lib/adminPath";
import { ArrowUpRight, Building2, Handshake, Info, Mail, Workflow, Layers3, Briefcase, Newspaper, Users, DoorOpen, Star, Boxes, HelpCircle, CalendarDays, Package, Home, Scale } from "lucide-react";

export default async function PublicLandingPagesHub() {
  const session = await getServerSession();
  guardCanEdit(session!, "pageContent");
  const basePath = getAdminBasePath();
  const pages = [
    { key: "home", title: "Homepage", description: "Edit the homepage hero, media, sections and featured content in the existing homepage settings.", icon: Home, href: basePath + "/home-settings" },
    { key: "legal", title: "Legal & policy pages", description: "Edit Privacy, Terms, Usage Policy and Accessibility content in the existing Site Pages manager.", icon: Scale, href: basePath + "/pages" },
    { key: "industries", title: "Industries", description: "Edit industry positioning, sector cards and calls to action.", icon: Building2 },
    { key: "engagement-models", title: "Engagement Models", description: "Edit ways of working, delivery models and engagement cards.", icon: Handshake },
    { key: "about", title: "About", description: "Edit the public About page hero, story framing and closing call to action.", icon: Info },
    { key: "contact", title: "Contact", description: "Edit contact page messaging and enquiry introduction.", icon: Mail },
    { key: "process", title: "Our Process", description: "Edit the process page hero, introduction and closing action.", icon: Workflow },
    { key: "services", title: "Services", description: "Edit service page positioning, capability introduction and calls to action.", icon: Layers3 },
    { key: "portfolio", title: "Portfolio", description: "Edit portfolio page messaging and case-study introduction.", icon: Briefcase },
    { key: "blog", title: "Blog", description: "Edit journal messaging, SEO and article introduction.", icon: Newspaper },
    { key: "team", title: "Team", description: "Edit team page messaging and studio introduction.", icon: Users },
    { key: "careers", title: "Careers", description: "Edit careers messaging and opportunity introduction.", icon: DoorOpen },
    { key: "testimonials", title: "Testimonials", description: "Edit testimonials page copy and review introduction.", icon: Star },
    { key: "stack", title: "Technology Stack", description: "Edit technology page messaging and engineering introduction.", icon: Boxes },
    { key: "help", title: "Help Centre", description: "Edit help centre headings and support messaging.", icon: HelpCircle },
    { key: "book-a-call", title: "Book a Call", description: "Edit discovery call messaging and scheduler introduction.", icon: CalendarDays },
    { key: "services-catalogue", title: "Service Catalogue", description: "Edit service package catalogue messaging and CTAs.", icon: Package },
    { key: "faq", title: "FAQ", description: "Edit FAQ page headings, introductory copy and fallback answers.", icon: HelpCircle },
  ];
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Website Content · Landing pages</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Public Landing Pages</h1>
      <p className="mt-2 max-w-3xl text-sm text-neutral-400">Manage the content and SEO for the additional public pages introduced in Phase 15.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {pages.map((page) => { const Icon = page.icon; return <Link key={page.key} href={"href" in page ? page.href : basePath + "/public-pages/" + page.key} className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 transition hover:-translate-y-1 hover:border-cyan-400/50">
          <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-cyan-300"><Icon size={21}/></span><ArrowUpRight size={18} className="text-neutral-500 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-cyan-300"/></div>
          <h2 className="mt-5 text-lg font-bold text-neutral-100">{page.title}</h2><p className="mt-2 text-sm leading-relaxed text-neutral-400">{page.description}</p>
          <span className="mt-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs font-semibold text-cyan-300">Edit page content</span>
        </Link>; })}
      </div>
    </div>
  );
}
