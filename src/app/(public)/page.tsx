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
    <main>
      {/* Hero */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 text-center sm:px-12">
        <HeroMoment />
        <div className="relative z-10">
        <ScrollReveal>
          <div className="mb-4 flex justify-center">
            <AvailabilityBadge />
          </div>
          <p className="font-mono text-sm uppercase tracking-widest text-neutral-400">
            TGO DevStudio
          </p>
          <h1 className="mt-4 text-5xl font-bold brand-gradient-text sm:text-7xl">
            {hero.heroHeadline}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-100/80">
            {hero.heroSubheadline}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={hero.primaryCtaHref}
              className="rounded-md brand-gradient-bg px-6 py-3 font-semibold text-base-950"
            >
              {hero.primaryCtaLabel}
            </Link>
            <Link
              href={hero.secondaryCtaHref}
              className="rounded-md border border-base-800 px-6 py-3 font-semibold text-neutral-100 hover:bg-base-900"
            >
              {hero.secondaryCtaLabel}
            </Link>
          </div>
        </ScrollReveal>
        </div>
      </section>

      {/* Featured Case Studies */}
      <section className="border-t border-base-800 px-6 py-20 sm:px-12">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                  {hero.caseStudiesLabel}
                </p>
                <h2 className="mt-2 text-3xl font-bold text-neutral-100 sm:text-4xl">
                  {hero.caseStudiesHeading}
                </h2>
              </div>
              <Link href="/portfolio" className="flex items-center gap-1 text-brand-cyan-300 hover:underline">
                View all work <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>

          {featuredProjects.length === 0 ? (
            <p className="mt-10 text-neutral-400">Featured case studies are coming soon.</p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {featuredProjects.map((project, index) => (
                <ScrollReveal key={project._id.toString()} delay={index * 100}>
                  <Link
                    href={`/portfolio/${project.slug}`}
                    className="block rounded-xl border border-base-800 bg-base-900 p-6 transition-colors hover:border-brand-cyan-400/50"
                  >
                    <h3 className="text-lg font-semibold text-neutral-100">{project.title}</h3>
                    <p className="mt-2 text-sm text-neutral-400">{project.summary}</p>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services teaser */}
      <section className="border-t border-base-800 px-6 py-20 sm:px-12">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                  {hero.servicesLabel}
                </p>
                <h2 className="mt-2 text-3xl font-bold text-neutral-100 sm:text-4xl">
                  {hero.servicesHeading}
                </h2>
              </div>
              <Link href="/services" className="flex items-center gap-1 text-brand-cyan-300 hover:underline">
                View all services <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>

          {services.length === 0 ? (
            <p className="mt-10 text-neutral-400">Our service offerings are being finalized.</p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {services.map((service, index) => {
                const IconComp = SERVICE_ICON_MAP[service.icon] || Code;
                return (
                  <ScrollReveal key={service._id.toString()} delay={index * 100}>
                    <div className="rounded-xl border border-base-800 bg-base-900 p-6">
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg brand-gradient-bg text-base-950">
                        <IconComp size={22} />
                      </span>
                      <h3 className="mt-4 text-lg font-semibold text-neutral-100">{service.title}</h3>
                      <p className="mt-2 text-sm text-neutral-400">{service.summary}</p>
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
        <section className="border-t border-base-800 px-6 py-20 sm:px-12">
          <div className="mx-auto max-w-3xl">
            <ScrollReveal>
              <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                {hero.processLabel}
              </p>
              <h2 className="mt-2 text-3xl font-bold text-neutral-100 sm:text-4xl">
                {hero.processHeading}
              </h2>
            </ScrollReveal>

            <div className="mt-10 space-y-0">
              {processSteps.map((step, index) => (
                <ScrollReveal key={step._id.toString()} delay={index * 80}>
                  <div className="relative flex gap-6 pb-8 last:pb-0">
                    {index < processSteps.length - 1 && (
                      <span className="absolute left-[19px] top-10 h-full w-px bg-base-800" />
                    )}
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full brand-gradient-bg text-sm font-bold text-base-950">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-100">{step.title}</h3>
                      <p className="mt-1 text-neutral-400">{step.description}</p>
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
      <section className="border-t border-base-800 px-6 py-20 sm:px-12">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                  {hero.teamLabel}
                </p>
                <h2 className="mt-2 text-3xl font-bold text-neutral-100 sm:text-4xl">
                  {hero.teamHeading}
                </h2>
              </div>
              <Link href="/team" className="flex items-center gap-1 text-brand-cyan-300 hover:underline">
                Meet everyone <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>

          {teamMembers.length === 0 ? (
            <p className="mt-10 text-neutral-400">Team profiles are coming soon.</p>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {teamMembers.map((member, index) => (
                <ScrollReveal key={member._id.toString()} delay={index * 100}>
                  <div className="text-center">
                    {member.photo?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photo.url}
                        alt={member.photo.altText || member.name}
                        className="mx-auto h-24 w-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="mx-auto h-24 w-24 rounded-full bg-base-800" />
                    )}
                    <p className="mt-3 font-semibold text-neutral-100">{member.name}</p>
                    <p className="text-sm text-neutral-400">{member.jobTitle}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials preview */}
      {featuredReviews.length > 0 && (
        <section className="border-t border-base-800 px-6 py-20 sm:px-12">
          <div className="mx-auto max-w-6xl">
            <ScrollReveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                    {hero.testimonialsLabel}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-neutral-100 sm:text-4xl">
                    {hero.testimonialsHeading}
                  </h2>
                </div>
                <Link href="/testimonials" className="flex items-center gap-1 text-brand-cyan-300 hover:underline">
                  Read more <ArrowRight size={16} />
                </Link>
              </div>
            </ScrollReveal>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {featuredReviews.map((review, index) => (
                <ScrollReveal key={review._id.toString()} delay={index * 100}>
                  <div className="rounded-xl border border-brand-cyan-400/50 bg-base-900 p-6">
                    <div className="flex gap-1 text-brand-cyan-300">
                      {"★".repeat(review.rating)}
                      <span className="text-base-800">{"★".repeat(5 - review.rating)}</span>
                    </div>
                    <p className="mt-3 text-sm text-neutral-100/90">{review.body}</p>
                    <p className="mt-4 text-sm font-semibold text-neutral-100">{review.submitterName}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog preview */}
      {latestPosts.length > 0 && (
        <section className="border-t border-base-800 px-6 py-20 sm:px-12">
          <div className="mx-auto max-w-6xl">
            <ScrollReveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                    {hero.blogLabel}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-neutral-100 sm:text-4xl">
                    {hero.blogHeading}
                  </h2>
                </div>
                <Link href="/blog" className="flex items-center gap-1 text-brand-cyan-300 hover:underline">
                  Read all posts <ArrowRight size={16} />
                </Link>
              </div>
            </ScrollReveal>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {latestPosts.map((post, index) => (
                <ScrollReveal key={post._id.toString()} delay={index * 100}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block rounded-xl border border-base-800 bg-base-900 p-6 transition-colors hover:border-brand-cyan-400/50"
                  >
                    <h3 className="text-lg font-semibold text-neutral-100">{post.title}</h3>
                    <p className="mt-2 text-sm text-neutral-400">{post.excerpt}</p>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Careers teaser */}
      <section className="border-t border-base-800 px-6 py-20 sm:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              {hero.careersLabel}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-neutral-100 sm:text-4xl">
              {hero.careersHeading}
            </h2>
            <p className="mt-4 text-neutral-100/70">
              {openRolesCount > 0
                ? `We currently have ${openRolesCount} open role${openRolesCount === 1 ? "" : "s"}.`
                : hero.careersNoRolesMessage}
            </p>
            <Link
              href="/careers"
              className="mt-6 inline-flex items-center gap-1 rounded-md border border-base-800 px-6 py-3 font-semibold text-neutral-100 hover:bg-base-900"
            >
              View Careers <ArrowRight size={16} />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-base-800 px-6 py-24 text-center sm:px-12">
        <ScrollReveal>
          <h2 className="text-4xl font-bold brand-gradient-text sm:text-5xl">
            {hero.finalCtaHeading}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-neutral-100/70">
            {hero.finalCtaDescription}
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-md brand-gradient-bg px-8 py-4 text-lg font-semibold text-base-950"
          >
            {hero.finalCtaButtonLabel}
          </Link>
        </ScrollReveal>
      </section>
    </main>
  );
}
