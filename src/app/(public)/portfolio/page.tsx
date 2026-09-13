import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Portfolio | TGO DevStudio Prime",
  description: "Explore case studies of full-stack software products built by TGO DevStudio — from concept to launch.",
};

interface PageProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function PortfolioPage({ searchParams }: PageProps) {
  await connectToDatabase();
  const { tag } = await searchParams;

  const allProjects = await Project.find({ publishStatus: "published" })
    .sort({ featured: -1, createdAt: -1 })
    .lean();

  const allTags = Array.from(new Set(allProjects.flatMap((p) => p.tags || []))).sort();
  const projects = tag ? allProjects.filter((p) => p.tags?.includes(tag)) : allProjects;

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-5xl">
        <span className="eyebrow-label">Portfolio</span>
        <h1 className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
          Case Studies
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          A look at the products, platforms, and tools we&apos;ve built — from problem to launch.
        </p>

        {allTags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              href="/portfolio"
              className="rounded-full border px-4 py-1.5 text-xs font-medium transition-colors"
              style={
                !tag
                  ? { borderColor: "var(--color-brand-cyan-400)", backgroundColor: "rgba(46,197,240,0.1)", color: "var(--color-brand-cyan-400)" }
                  : { borderColor: "var(--border-subtle)", color: "var(--text-muted)" }
              }
            >
              All
            </Link>
            {allTags.map((t) => (
              <Link
                key={t}
                href={`/portfolio?tag=${encodeURIComponent(t)}`}
                className="rounded-full border px-4 py-1.5 text-xs font-medium transition-colors"
                style={
                  tag === t
                    ? { borderColor: "var(--color-brand-cyan-400)", backgroundColor: "rgba(46,197,240,0.1)", color: "var(--color-brand-cyan-400)" }
                    : { borderColor: "var(--border-subtle)", color: "var(--text-muted)" }
                }
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {projects.length === 0 && (
          <p className="mt-14" style={{ color: "var(--text-muted)" }}>
            {tag ? `No case studies tagged "${tag}".` : "Case studies are on the way. Check back soon."}
          </p>
        )}

        <div className="mt-14 grid gap-7 sm:grid-cols-2">
          {projects.map((project) => (
            <Link key={project._id.toString()} href={`/portfolio/${project.slug}`} className="surface-card group block">
              <div className="surface-card-inner">
                {project.images?.[0] && (
                  <div className="relative h-48 w-full overflow-hidden rounded-t-2xl">
                    <Image
                      src={project.images[0].url}
                      alt={project.images[0].altText}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-7">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{project.title}</h2>
                    {project.featured && (
                      <span className="rounded-full bg-brand-violet-600/20 px-2 py-0.5 text-xs text-brand-cyan-300">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{project.summary}</p>
                  {project.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.tags.map((t: string) => (
                        <span key={t} className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-4 text-xs font-semibold text-brand-cyan-300">View case study →</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
