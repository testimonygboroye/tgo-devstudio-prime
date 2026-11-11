import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BrainCircuit, Cloud, Code2, Compass,
  Layers3, LockKeyhole, MonitorSmartphone, Rocket, ShieldCheck,
  Sparkles, Workflow, Zap, Quote, CheckCircle2
} from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import HomeSettings from "@/models/HomeSettings";
import Project from "@/models/Project";
import Service from "@/models/Service";
import ProcessStep from "@/models/ProcessStep";
import TeamMember from "@/models/TeamMember";
import BlogPost from "@/models/BlogPost";
import JobOpening from "@/models/JobOpening";
import Review from "@/models/Review";
import LaunchSettings from "@/models/LaunchSettings";
import { HOME_DEFAULTS } from "@/lib/constants/pageDefaults";
import { SERVICE_ICON_MAP } from "@/lib/constants/serviceIcons";
import { getPubliclyVisibleFilter } from "@/lib/utils/blogVisibility";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import AvailabilityBadge from "@/components/public/AvailabilityBadge";
import HeroMoment from "@/components/public/HeroMoment";
import HomepageMediaExperience from "@/components/public/HomepageMediaExperience";
import SmartImage from "@/components/public/SmartImage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const capabilityPillars = [
  { icon: Code2, title: "Digital products", text: "Websites, web applications and mobile experiences built around real user needs." },
  { icon: BrainCircuit, title: "Intelligent systems", text: "Practical AI, automation and connected workflows that make work smarter." },
  { icon: Cloud, title: "Cloud & platforms", text: "Reliable SaaS platforms, APIs, infrastructure and data foundations." },
  { icon: ShieldCheck, title: "Security & trust", text: "Security-minded engineering, resilient architecture and thoughtful delivery." },
];

const deliveryPrinciples = [
  { icon: Compass, number: "01", title: "Understand the real problem", text: "We align on the people, goals and constraints before choosing the technology." },
  { icon: Layers3, number: "02", title: "Design the right system", text: "We shape the experience, architecture and delivery plan as one connected product." },
  { icon: Workflow, number: "03", title: "Build with discipline", text: "Clear milestones, careful engineering and frequent, useful communication." },
  { icon: Rocket, number: "04", title: "Launch and keep improving", text: "We validate, release and refine so the product keeps creating value." },
];

function SectionHeading({ eyebrow, title, description, href, action }: {
  eyebrow: string; title: string; description?: string; href?: string; action?: string;
}) {
  return (
    <div className="home-section-heading">
      <div className="max-w-3xl">
        <span className="eyebrow-label">{eyebrow}</span>
        <h2 className="home-heading mt-4">{title}</h2>
        {description && <p className="mt-4 max-w-2xl text-base leading-8" style={{ color: "var(--text-secondary)" }}>{description}</p>}
      </div>
      {href && <Link href={href} className="home-text-link">{action || "Explore more"} <ArrowUpRight size={17} /></Link>}
    </div>
  );
}

export default async function HomePage() {
  await connectToDatabase();
  const locale = await getServerLocale();

  const [rawSettings, featuredProjects, services, processSteps, teamMembers, latestPosts, openRolesCount, featuredReviews, launchSettings] = await Promise.all([
    HomeSettings.findOne().lean(),
    Project.find({ featured: true, publishStatus: "published" }).sort({ createdAt: -1 }).limit(4).lean(),
    Service.find({ publishStatus: "published" }).sort({ featured: -1, displayOrder: 1 }).limit(6).lean(),
    ProcessStep.find({ publishStatus: "published" }).sort({ displayOrder: 1 }).limit(4).lean(),
    TeamMember.find({ publishStatus: "published" }).sort({ featured: -1, displayOrder: 1 }).limit(4).lean(),
    BlogPost.find(getPubliclyVisibleFilter()).sort({ featured: -1, createdAt: -1 }).limit(3).lean(),
    JobOpening.countDocuments({ publishStatus: "published" }),
    Review.find({ status: "approved", featuredOnHomepage: true }).sort({ createdAt: -1 }).limit(3).lean(),
    LaunchSettings.findOne().lean(),
  ]);

  const localize = <T extends Record<string, unknown>>(doc: T, fields: readonly string[]) => getLocalizedContent(doc, locale, fields as readonly (keyof T)[]);
  const hero = localize({ ...HOME_DEFAULTS, ...(rawSettings || {}) }, TRANSLATABLE_FIELDS.HomeSettings);
  const projects = featuredProjects.map((item) => localize(item, TRANSLATABLE_FIELDS.Project));
  const serviceList = services.map((item) => localize(item, TRANSLATABLE_FIELDS.Service));
  const steps = processSteps.map((item) => localize(item, TRANSLATABLE_FIELDS.ProcessStep));
  const team = teamMembers.map((item) => localize(item, TRANSLATABLE_FIELDS.TeamMember));
  const posts = latestPosts.map((item) => localize(item, TRANSLATABLE_FIELDS.BlogPost));
  const reviews = featuredReviews.map((item) => localize(item, TRANSLATABLE_FIELDS.Review));

  return (
    <main className="home-page">
      <HomepageMediaExperience settings={launchSettings || { enabled: false }} />

      <section className="home-hero ambient-glow">
        <HeroMoment />
        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <div className="mb-7 flex flex-wrap items-center gap-3">
              <AvailabilityBadge />
              <span className="home-kicker"><span className="home-kicker-dot" /> Independent technology studio</span>
            </div>
            <span className="eyebrow-label">TGO DEVSTUDIO PRIME · ENGINEERING THE NEXT</span>
            <h1 className="home-hero-title">{hero.heroHeadline}</h1>
            <p className="home-hero-description">{hero.heroSubheadline}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={hero.primaryCtaHref || "/contact"} className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-4 font-bold text-white">
                {hero.primaryCtaLabel || "Start a project"} <ArrowUpRight size={18} />
              </Link>
              <Link href={hero.secondaryCtaHref || "/portfolio"} className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold" style={{ color: "var(--text-primary)" }}>
                {hero.secondaryCtaLabel || "Explore our work"} <ArrowRight size={17} />
              </Link>
            </div>
            <div className="home-hero-assurance">
              <span><CheckCircle2 size={15} /> Thoughtful strategy</span>
              <span><CheckCircle2 size={15} /> Full-stack delivery</span>
              <span><CheckCircle2 size={15} /> Long-term partnership</span>
            </div>
          </div>

          <div className="home-visual-wrap" aria-label="Illustration of a connected digital product ecosystem">
            <div className="home-visual-orbit home-orbit-one" />
            <div className="home-visual-orbit home-orbit-two" />
            <div className="home-visual-glow" />
            <div className="home-product-window">
              <div className="home-window-top">
                <div className="flex gap-1.5"><i /><i /><i /></div>
                <span> TGO / PRODUCT SYSTEMS</span>
                <span className="home-window-status"><b /> LIVE</span>
              </div>
              <div className="home-window-body">
                <div className="home-window-sidebar"><span /><span /><span /><span /><span /></div>
                <div className="home-window-main">
                  <div className="home-window-greeting"><small>YOUR NEXT BIG IDEA</small><strong>Built to move<br />your business forward.</strong></div>
                  <div className="home-window-metrics"><div><small>Performance</small><b>98.6%</b><span>↗ Optimised</span></div><div><small>Systems online</small><b>12 / 12</b><span>● All operational</span></div></div>
                  <div className="home-window-chart"><div className="home-chart-label"><span>Growth trajectory</span><b>+32.8%</b></div><div className="home-chart-bars">{[34,48,41,63,53,76,68,91,78,100,87,112].map((height,index)=><i key={index} style={{height:height+"%"}} />)}</div></div>
                  <div className="home-window-footer"><span><Zap size={13}/> Intelligent by design</span><span>Secure · Scalable · Ready</span></div>
                </div>
              </div>
            </div>
            <div className="home-float-card home-float-ai"><span><BrainCircuit size={17}/></span><div><b>AI-powered</b><small>Intelligence built in</small></div></div>
            <div className="home-float-card home-float-cloud"><span><Cloud size={17}/></span><div><b>Cloud-ready</b><small>Built to scale</small></div></div>
            <div className="home-visual-caption"><Sparkles size={14}/> Ideas become useful technology.</div>
          </div>
        </div>
        <div className="home-hero-bottom"><span>SCROLL TO EXPLORE</span><i /></div>
      </section>

      <section className="home-proof-strip">
        <div className="home-proof-inner">
          <div className="home-proof-intro"><span className="eyebrow-label">ONE PARTNER</span><b>From first idea<br/>to lasting impact.</b></div>
          <div className="home-proof-stat"><strong>{hero.statOneValue}</strong><span>{hero.statOneLabel}</span></div>
          <div className="home-proof-stat"><strong>{hero.statTwoValue}</strong><span>{hero.statTwoLabel}</span></div>
          <div className="home-proof-stat"><strong>{hero.statThreeValue}</strong><span>{hero.statThreeLabel}</span></div>
          <div className="home-proof-mark"><MonitorSmartphone size={25}/><span>Strategy · Design · Engineering</span></div>
        </div>
      </section>

      <section className="home-section home-capabilities">
        <div className="home-container">
          <SectionHeading eyebrow="What we bring together" title="Technology that works beautifully — and works hard." description="We connect product thinking, refined experiences and dependable engineering to create digital systems that solve meaningful business problems." href="/services" action="Explore all capabilities" />
          <div className="home-capability-grid">
            {capabilityPillars.map(({icon:Icon,title,text},index)=><article className="home-capability-card" key={title}><div className="home-card-index">0{index+1}</div><span className="home-icon-tile"><Icon size={23}/></span><h3>{title}</h3><p>{text}</p><Link href="/services" aria-label={"Explore "+title}><ArrowUpRight size={18}/></Link></article>)}
          </div>
          {serviceList.length>0&&<div className="home-service-ribbon"><span>OUR SERVICE LINES</span><div>{serviceList.map((service)=>{const Icon=SERVICE_ICON_MAP[service.icon];return <Link href="/services" key={service._id.toString()}>{Icon?<Icon size={15}/>:<Code2 size={15}/>} {service.title}</Link>})}</div></div>}
        </div>
      </section>

      <section className="home-section home-work-section">
        <div className="home-container">
          <SectionHeading eyebrow={hero.caseStudiesLabel || "Selected work"} title={hero.caseStudiesHeading || "A closer look at what we make."} description="A selection of ideas translated into useful, carefully engineered digital experiences." href="/portfolio" action="View the portfolio"/>
          {projects.length>0?<div className="home-project-grid">{projects.map((project,index)=><Link href={"/portfolio/"+project.slug} className={"home-project-card home-project-"+index} key={project._id.toString()}><div className="home-project-image"><SmartImage src={project.images?.[0]?.url} alt={project.images?.[0]?.altText || project.title} label={project.title}/><span className="home-project-number">0{index+1}</span><span className="home-project-open"><ArrowUpRight size={19}/></span></div><div className="home-project-meta"><div><span>{project.tags?.[0] || "Digital product"}</span><h3>{project.title}</h3><p>{project.summary}</p></div><ArrowUpRight size={21}/></div></Link>)}</div>:<div className="home-empty-panel"><Layers3 size={28}/><h3>Good work starts with a clear challenge.</h3><p>Talk with us about the product or system you want to bring to life.</p><Link href="/contact" className="home-text-link">Start a conversation <ArrowUpRight size={17}/></Link></div>}
        </div>
      </section>

      <section className="home-section home-approach-section">
        <div className="home-container home-approach-layout">
          <div className="home-approach-intro"><span className="eyebrow-label">{hero.processLabel || "How we work"}</span><h2 className="home-heading">{hero.processHeading || "A clear path from possibility to progress."}</h2><p>Great technology is not an accident. It comes from asking better questions, making deliberate decisions and caring about every detail from the first conversation to the next release.</p><Link href="/process" className="home-text-link">Explore our process <ArrowUpRight size={17}/></Link><div className="home-approach-note"><Sparkles size={18}/><span>Built around clarity, quality and momentum.</span></div></div>
          <div className="home-steps">{(steps.length?steps:deliveryPrinciples).map((step,index)=>{const Icon=deliveryPrinciples[index]?.icon || CheckCircle2;return <article className="home-step" key={index}><span className="home-step-icon"><Icon size={20}/></span><div><small>STEP 0{index+1}</small><h3>{step.title}</h3><p>{"description" in step ? step.description : step.text}</p></div><span className="home-step-line"/></article>})}</div>
        </div>
      </section>

      <section className="home-section home-difference-section">
        <div className="home-container"><div className="home-difference-panel"><div><span className="eyebrow-label">The TGO difference</span><h2 className="home-heading">One connected team.<br/><em>Every layer considered.</em></h2><p>We do not treat design, software and infrastructure as separate afterthoughts. We bring them together so the finished product feels coherent, performs reliably and is ready for what comes next.</p><Link href="/about" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white">Get to know the studio <ArrowUpRight size={17}/></Link></div><div className="home-difference-list"><div><Code2/><span><b>Product-minded engineering</b><small>Technology decisions grounded in outcomes.</small></span></div><div><LockKeyhole/><span><b>Security-aware foundations</b><small>Resilience and trust designed in from day one.</small></span></div><div><Zap/><span><b>Performance without shortcuts</b><small>Fast, accessible and dependable experiences.</small></span></div><div><Layers3/><span><b>Room to grow</b><small>Systems designed for the next chapter.</small></span></div></div></div></div>
      </section>

      {reviews.length>0&&<section className="home-section home-testimonials-section"><div className="home-container"><SectionHeading eyebrow={hero.testimonialsLabel || "Client perspectives"} title={hero.testimonialsHeading || "Good work is remembered."} href="/testimonials" action="Read all testimonials"/><div className="home-testimonial-grid">{reviews.map(review=><article className="home-testimonial" key={review._id.toString()}><Quote size={24}/><div className="home-stars">{"★".repeat(review.rating)}<span>{"★".repeat(Math.max(0,5-review.rating))}</span></div><p>{review.body}</p><div className="home-review-author"><b>{review.submitterName}</b><span>Verified client feedback</span></div></article>)}</div></div></section>}

      {team.length>0&&<section className="home-section home-team-section"><div className="home-container"><SectionHeading eyebrow={hero.teamLabel || "People behind the work"} title={hero.teamHeading || "Thoughtful people. Meaningful technology."} href="/team" action="Meet the team"/><div className="home-team-grid">{team.map(member=><article className="home-team-card" key={member._id.toString()}><div className="home-team-photo"><SmartImage src={member.photo?.url} alt={member.photo?.altText || member.name} label={member.name}/></div><h3>{member.name}</h3><p>{member.jobTitle}</p></article>)}</div></div></section>}

      {posts.length>0&&<section className="home-section home-insights-section"><div className="home-container"><SectionHeading eyebrow={hero.blogLabel || "Ideas & perspectives"} title={hero.blogHeading || "Useful thinking for what comes next."} description="Notes, guides and perspectives from the world of product, software and technology." href="/blog" action="Visit the insights hub"/><div className="home-insights-grid">{posts.map((post,index)=><Link href={"/blog/"+post.slug} className="home-insight-card" key={post._id.toString()}><div className="home-insight-image"><SmartImage src={post.coverImage?.url} alt={post.coverImage?.altText || post.title} label="TGO Insights"/><span>INSIGHT 0{index+1}</span></div><div className="home-insight-copy"><small>{post.tags?.[0] || "Studio journal"}</small><h3>{post.title}</h3><p>{post.excerpt}</p><b>Read article <ArrowUpRight size={16}/></b></div></Link>)}</div></div></section>}

      <section className="home-section home-careers-section"><div className="home-container"><div className="home-careers-panel"><div><span className="eyebrow-label">{hero.careersLabel || "Build with us"}</span><h2>{hero.careersHeading || "Make useful things with good people."}</h2><p>{openRolesCount>0?"We currently have "+openRolesCount+" open role"+(openRolesCount===1?"":"s")+".":hero.careersNoRolesMessage}</p></div><Link href="/careers" className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold">Explore careers <ArrowUpRight size={17}/></Link></div></div></section>

      <section className="home-final-cta ambient-glow"><div className="home-final-orb"/><div className="home-container"><span className="eyebrow-label">YOUR NEXT CHAPTER STARTS HERE</span><h2>{hero.finalCtaHeading || "Have a bold idea? Let’s build what’s next."}</h2><p>{hero.finalCtaDescription || "Tell us what you are working towards. We will help turn the challenge into a clear, achievable plan."}</p><div className="flex flex-wrap justify-center gap-3"><Link href="/contact" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-8 py-4 font-bold text-white">{hero.finalCtaButtonLabel || "Start a conversation"} <ArrowUpRight size={18}/></Link><Link href="/book-a-call" className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold" style={{color:"var(--text-primary)"}}>Book a discovery call <ArrowRight size={17}/></Link></div><div className="home-final-footnote"><span><CheckCircle2 size={14}/> No pressure</span><span><CheckCircle2 size={14}/> Clear next steps</span><span><CheckCircle2 size={14}/> Real people, real answers</span></div></div></section>
    </main>
  );
}
