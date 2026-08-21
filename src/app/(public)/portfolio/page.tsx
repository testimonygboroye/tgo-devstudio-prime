import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Portfolio | TGO DevStudio Prime",
  description:
    "Explore case studies of full-stack software products built by TGO DevStudio — from concept to launch.",
  openGraph: {
    title: "Portfolio | TGO DevStudio Prime",
    description:
      "Explore case studies of full-stack software products built by TGO DevStudio — from concept to launch.",
    type: "website",
  },
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
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Portfolio</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">Case Studies</h1>
        <p className="mt-4 max-w-2xl text-neutral-100/70">
          A look at the products, platforms, and tools we&apos;ve built — from problem to launch.
        </p>

        {allTags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/portfolio"
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                !tag
                  ? "border-brand-cyan-400 bg-brand-cyan-400/10 text-brand-cyan-300"
                  : "border-base-800 text-neutral-400 hover:border-neutral-600"
              }`}
            >
              All
            </Link>
            {allTags.map((t) => (
              <Link
                key={t}
                href={`/portfolio?tag=${encodeURIComponent(t)}`}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  tag === t
                    ? "border-brand-cyan-400 bg-brand-cyan-400/10 text-brand-cyan-300"
                    : "border-base-800 text-neutral-400 hover:border-neutral-600"
                }`}
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {projects.length === 0 && (
          <p className="mt-12 text-neutral-400">
            {tag ? `No case studies tagged "${tag}".` : "Case studies are on the way. Check back soon."}
          </p>
        )}

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project._id.toString()}
              href={`/portfolio/${project.slug}`}
              className="group overflow-hidden rounded-xl border border-base-800 bg-base-900 transition-colors hover:border-brand-cyan-400"
            >
              {project.images?.[0] && (
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={project.images[0].url}
                    alt={project.images[0].altText}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-neutral-100">{project.title}</h2>
                  {project.featured && (
                    <span className="rounded-full bg-brand-violet-600/20 px-2 py-0.5 text-xs text-brand-cyan-300">
                      Featured
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-neutral-400">{project.summary}</p>
                {project.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.tags.map((t: string) => (
                      <span
                        key={t}
                        className="rounded-full border border-base-800 px-2 py-0.5 text-xs text-neutral-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
