import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import HomeSettings from "@/models/HomeSettings";
import Project from "@/models/Project";
import Service from "@/models/Service";
import ProcessStep from "@/models/ProcessStep";
import TeamMember from "@/models/TeamMember";
import BlogPost from "@/models/BlogPost";
import JobOpening from "@/models/JobOpening";
import Review from "@/models/Review";
import { HOME_DEFAULTS } from "@/lib/constants/pageDefaults";
import { SERVICE_ICON_MAP } from "@/lib/constants/serviceIcons";
import { Code } from "lucide-react";
import { getPubliclyVisibleFilter } from "@/lib/utils/blogVisibility";
import ScrollReveal from "@/components/public/ScrollReveal";
import AvailabilityBadge from "@/components/public/AvailabilityBadge";
import HeroMoment from "@/components/public/HeroMoment";

export const revalidate = 300;

export default async function HomePage() {
  await connectToDatabase();

  const [
    settings,
    featuredProjects,
    services,
    processSteps,
    teamMembers,
    latestPosts,
    openRolesCount,
    featuredReviews,
  ] = await Promise.all([
    HomeSettings.findOne().lean(),
    Project.find({ featured: true, publishStatus: "published" }).sort({ createdAt: -1 }).limit(3).lean(),
    Service.find({ publishStatus: "published" }).sort({ featured: -1, displayOrder: 1 }).limit(3).lean(),
    ProcessStep.find({ publishStatus: "published" }).sort({ displayOrder: 1 }).limit(6).lean(),
    TeamMember.find({ publishStatus: "published" }).sort({ featured: -1, displayOrder: 1 }).limit(4).lean(),
    BlogPost.find(getPubliclyVisibleFilter()).sort({ featured: -1, createdAt: -1 }).limit(3).lean(),
    JobOpening.countDocuments({ publishStatus: "published" }),
    Review.find({ status: "approved", featuredOnHomepage: true }).sort({ createdAt: -1 }).limit(3).lean(),
  ]);

  const hero = { ...HOME_DEFAULTS, ...(settings || {}) };

  return (
    <main style={{ backgroundColor: "var(--bg-page)" }}>
      {/* Hero */}
      <section className="ambient-glow relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 text-center sm:px-12">
        <HeroMoment />
        <div className="relative z-10">
          <ScrollReveal>
            <div className="mb-6 flex justify-center">
              <AvailabilityBadge />
            </div>
            <span className="eyebrow-label justify-center">TGO DevStudio</span>
            <h1
              className="heading-premium mt-6 text-6xl font-bold brand-gradient-text sm:text-8xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {hero.heroHeadline}
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {hero.heroSubheadline}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href={hero.primaryCtaHref}
                className="btn-premium-primary rounded-full px-8 py-3.5 font-semibold text-base-950"
              >
                {hero.primaryCtaLabel}
              </Link>
              <Link
                href={hero.secondaryCtaHref}
                className="btn-premium-secondary rounded-full px-8 py-3.5 font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {hero.secondaryCtaLabel}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-t px-6 py-14 sm:px-12" style={{ borderColor: "var(--border-subtle)" }}>
        <ScrollReveal>
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-6 text-center">
            <div>
              <p className="heading-premium text-4xl font-bold brand-gradient-text sm:text-5xl">{hero.statOneValue}</p>
              <p className="mt-2 text-xs uppercase tracking-widest sm:text-sm" style={{ color: "var(--text-muted)" }}>
                {hero.statOneLabel}
              </p>
            </div>
            <div>
              <p className="heading-premium text-4xl font-bold brand-gradient-text sm:text-5xl">{hero.statTwoValue}</p>
              <p className="mt-2 text-xs uppercase tracking-widest sm:text-sm" style={{ color: "var(--text-muted)" }}>
                {hero.statTwoLabel}
              </p>
            </div>
            <div>
              <p className="heading-premium text-4xl font-bold brand-gradient-text sm:text-5xl">{hero.statThreeValue}</p>
              <p className="mt-2 text-xs uppercase tracking-widest sm:text-sm" style={{ color: "var(--text-muted)" }}>
                {hero.statThreeLabel}
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Featured Case Studies */}
      <section className="border-t px-6 py-24 sm:px-12" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="eyebrow-label">{hero.caseStudiesLabel}</span>
                <h2 className="heading-premium mt-3 text-4xl font-bold sm:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                  {hero.caseStudiesHeading}
                </h2>
              </div>
              <Link href="/portfolio" className="flex items-center gap-1 text-brand-cyan-300 hover:underline">
                View all work <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>

          {featuredProjects.length === 0 ? (
            <p className="mt-10" style={{ color: "var(--text-muted)" }}>Featured case studies are coming soon.</p>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {featuredProjects.map((project, index) => (
                <ScrollReveal key={project._id.toString()} delay={index * 100}>
                  <Link href={`/portfolio/${project.slug}`} className="surface-card block">
                    <div className="surface-card-inner p-7">
                      <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{project.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{project.summary}</p>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services teaser */}
      <section className="border-t px-6 py-24 sm:px-12" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="eyebrow-label">{hero.servicesLabel}</span>
                <h2 className="heading-premium mt-3 text-4xl font-bold sm:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                  {hero.servicesHeading}
                </h2>
              </div>
              <Link href="/services" className="flex items-center gap-1 text-brand-cyan-300 hover:underline">
                View all services <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>

          {services.length === 0 ? (
            <p className="mt-10" style={{ color: "var(--text-muted)" }}>Our service offerings are being finalized.</p>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {services.map((service, index) => {
                const IconComp = SERVICE_ICON_MAP[service.icon] || Code;
                return (
                  <ScrollReveal key={service._id.toString()} delay={index * 100}>
                    <div className="surface-card">
                      <div className="surface-card-inner p-7">
                        <span className="icon-badge-premium flex h-12 w-12 items-center justify-center rounded-xl brand-gradient-bg text-base-950">
                          <IconComp size={22} />
                        </span>
                        <h3 className="mt-5 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{service.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{service.summary}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Process teaser */}
      {processSteps.length > 0 && (
        <section className="border-t px-6 py-24 sm:px-12" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="mx-auto max-w-3xl">
            <ScrollReveal>
              <span className="eyebrow-label">{hero.processLabel}</span>
              <h2 className="heading-premium mt-3 text-4xl font-bold sm:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                {hero.processHeading}
              </h2>
            </ScrollReveal>

            <div className="mt-12 space-y-0">
              {processSteps.map((step, index) => (
                <ScrollReveal key={step._id.toString()} delay={index * 80}>
                  <div className="relative flex gap-6 pb-9 last:pb-0">
                    {index < processSteps.length - 1 && (
                      <span className="absolute left-[21px] top-11 h-full w-px" style={{ background: "var(--border-subtle)" }} />
                    )}
                    <span className="icon-badge-premium flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full brand-gradient-bg text-sm font-bold text-base-950">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{step.title}</h3>
                      <p className="mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal>
              <Link href="/process" className="mt-8 inline-flex items-center gap-1 text-brand-cyan-300 hover:underline">
                See our full process <ArrowRight size={16} />
              </Link>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Team preview */}
      <section className="border-t px-6 py-24 sm:px-12" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="eyebrow-label">{hero.teamLabel}</span>
                <h2 className="heading-premium mt-3 text-4xl font-bold sm:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                  {hero.teamHeading}
                </h2>
              </div>
              <Link href="/team" className="flex items-center gap-1 text-brand-cyan-300 hover:underline">
                Meet everyone <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>

          {teamMembers.length === 0 ? (
            <p className="mt-10" style={{ color: "var(--text-muted)" }}>Team profiles are coming soon.</p>
          ) : (
            <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {teamMembers.map((member, index) => (
                <ScrollReveal key={member._id.toString()} delay={index * 100}>
                  <div className="text-center">
                    {member.photo?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photo.url}
                        alt={member.photo.altText || member.name}
                        className="mx-auto h-24 w-24 rounded-full object-cover ring-2"
                        style={{ boxShadow: "0 0 0 2px var(--border-subtle)" }}
                      />
                    ) : (
                      <div className="mx-auto h-24 w-24 rounded-full" style={{ backgroundColor: "var(--bg-surface-2)" }} />
                    )}
                    <p className="mt-4 font-semibold" style={{ color: "var(--text-primary)" }}>{member.name}</p>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>{member.jobTitle}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials preview */}
      {featuredReviews.length > 0 && (
        <section className="border-t px-6 py-24 sm:px-12" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="mx-auto max-w-6xl">
            <ScrollReveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="eyebrow-label">{hero.testimonialsLabel}</span>
                  <h2 className="heading-premium mt-3 text-4xl font-bold sm:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                    {hero.testimonialsHeading}
                  </h2>
                </div>
                <Link href="/testimonials" className="flex items-center gap-1 text-brand-cyan-300 hover:underline">
                  Read more <ArrowRight size={16} />
                </Link>
              </div>
            </ScrollReveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {featuredReviews.map((review, index) => (
                <ScrollReveal key={review._id.toString()} delay={index * 100}>
                  <Link href={`/testimonials/${review._id.toString()}`} className="surface-card block">
                    <div className="surface-card-inner p-7">
                      <div className="flex gap-1 text-brand-cyan-300">
                        {"★".repeat(review.rating)}
                        <span style={{ color: "var(--border-subtle)" }}>{"★".repeat(5 - review.rating)}</span>
                      </div>
                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{review.body}</p>
                      <p className="mt-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{review.submitterName}</p>
                      <p className="mt-2 text-xs font-semibold text-brand-cyan-300">Read full review →</p>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog preview */}
      {latestPosts.length > 0 && (
        <section className="border-t px-6 py-24 sm:px-12" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="mx-auto max-w-6xl">
            <ScrollReveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="eyebrow-label">{hero.blogLabel}</span>
                  <h2 className="heading-premium mt-3 text-4xl font-bold sm:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                    {hero.blogHeading}
                  </h2>
                </div>
                <Link href="/blog" className="flex items-center gap-1 text-brand-cyan-300 hover:underline">
                  Read all posts <ArrowRight size={16} />
                </Link>
              </div>
            </ScrollReveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {latestPosts.map((post, index) => (
                <ScrollReveal key={post._id.toString()} delay={index * 100}>
                  <Link href={`/blog/${post.slug}`} className="surface-card block">
                    <div className="surface-card-inner p-7">
                      <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{post.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{post.excerpt}</p>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Careers teaser */}
      <section className="border-t px-6 py-24 sm:px-12" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <span className="eyebrow-label justify-center">{hero.careersLabel}</span>
            <h2 className="heading-premium mt-3 text-4xl font-bold sm:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              {hero.careersHeading}
            </h2>
            <p className="mt-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {openRolesCount > 0
                ? `We currently have ${openRolesCount} open role${openRolesCount === 1 ? "" : "s"}.`
                : hero.careersNoRolesMessage}
            </p>
            <Link href="/careers" className="btn-premium-secondary mt-7 inline-flex items-center gap-1 rounded-full px-7 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>
              View Careers <ArrowRight size={16} />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="ambient-glow relative border-t px-6 py-28 text-center sm:px-12" style={{ borderColor: "var(--border-subtle)" }}>
        <ScrollReveal>
          <h2 className="heading-premium text-5xl font-bold brand-gradient-text sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
            {hero.finalCtaHeading}
          </h2>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {hero.finalCtaDescription}
          </p>
          <Link href="/contact" className="btn-premium-primary mt-9 inline-block rounded-full px-9 py-4 text-lg font-semibold text-base-950">
            {hero.finalCtaButtonLabel}
          </Link>
        </ScrollReveal>
      </section>
    </main>
  );
}
