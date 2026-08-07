import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProject(slug: string) {
  await connectToDatabase();
  return Project.findOne({ slug, publishStatus: "published" }).lean();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    return { title: "Case Study Not Found | TGO DevStudio Prime" };
  }

  const title = project.metaTitle || `${project.title} | TGO DevStudio Prime`;
  const description = project.metaDescription || project.summary;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: project.images?.[0] ? [{ url: project.images[0].url }] : undefined,
    },
  };
}

export default async function CaseStudyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <article className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Case Study</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">{project.title}</h1>
        <p className="mt-4 text-lg text-neutral-100/80">{project.summary}</p>

        {project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border border-base-800 px-2 py-0.5 text-xs text-neutral-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {project.images?.[0] && (
          <div className="relative mt-8 h-72 w-full overflow-hidden rounded-xl sm:h-96">
            <Image
              src={project.images[0].url}
              alt={project.images[0].altText}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="mt-10 space-y-8">
          {project.problemStatement && (
            <section>
              <h2 className="text-xl font-semibold text-neutral-100">The Problem</h2>
              <p className="mt-2 text-neutral-100/70">{project.problemStatement}</p>
            </section>
          )}
          {project.approach && (
            <section>
              <h2 className="text-xl font-semibold text-neutral-100">Our Approach</h2>
              <p className="mt-2 text-neutral-100/70">{project.approach}</p>
            </section>
          )}
          {project.outcome && (
            <section>
              <h2 className="text-xl font-semibold text-neutral-100">The Outcome</h2>
              <p className="mt-2 text-neutral-100/70">{project.outcome}</p>
            </section>
          )}
        </div>

        {project.images.length > 1 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {project.images.slice(1).map((image: { url: string; altText: string; publicId: string }) => (
              <div key={image.publicId} className="relative h-56 w-full overflow-hidden rounded-lg">
                <Image
                  src={image.url}
                  alt={image.altText}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          {project.projectUrl && (
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md brand-gradient-bg px-5 py-2 font-semibold text-base-950"
            >
              View Live Project
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-base-800 px-5 py-2 text-neutral-100 hover:bg-base-900"
            >
              View Repository
            </a>
          )}
        </div>
      </article>
    </main>
  );
}
