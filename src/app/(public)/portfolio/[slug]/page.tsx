import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import ImageLightbox from "@/components/shared/ImageLightbox";

export const revalidate = 300;

const siteUrl = process.env.SITE_URL || "https://tgo-devstudio-prime.onrender.com";

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
  if (!project) return { title: "Case Study Not Found | TGO DevStudio Prime" };
  const title = project.metaTitle || `${project.title} | TGO DevStudio Prime`;
  const description = project.metaDescription || project.summary;
  return {
    title,
    description,
    openGraph: { title, description, type: "article", images: project.images?.[0] ? [{ url: project.images[0].url }] : undefined },
  };
}

export default async function CaseStudyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    url: `${siteUrl}/portfolio/${project.slug}`,
    image: project.images?.[0]?.url,
    creator: { "@type": "Organization", name: "TGO DevStudio" },
    keywords: project.tags?.join(", "),
  };

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <article className="mx-auto max-w-3xl">
        <span className="eyebrow-label">Case Study</span>
        <h1 className="heading-premium mt-3 text-4xl font-bold brand-gradient-text sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
          {project.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>{project.summary}</p>

        {project.metrics && project.metrics.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {project.metrics.map((metric: { label: string; value: string }, index: number) => (
              <div key={index} className="surface-card">
                <div className="surface-card-inner p-4 text-center">
                  <p className="text-2xl font-bold brand-gradient-text">{metric.value}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{metric.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {project.techStack && project.techStack.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {project.techStack.map((tech: string) => (
              <span key={tech} className="rounded-full border border-brand-cyan-400/40 bg-brand-cyan-400/10 px-3 py-1 text-xs text-brand-cyan-300">
                {tech}
              </span>
            ))}
          </div>
        )}

        {project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.tags.map((tag: string) => (
              <span key={tag} className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {project.images?.[0] && (
          <div className="mt-8">
            <ImageLightbox src={project.images[0].url} alt={project.images[0].altText}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={project.images[0].url} alt={project.images[0].altText} className="w-full rounded-xl" />
            </ImageLightbox>
          </div>
        )}

        <div className="mt-10 space-y-8">
          {project.problemStatement && (
            <section>
              <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>The Problem</h2>
              <p className="mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{project.problemStatement}</p>
            </section>
          )}
          {project.approach && (
            <section>
              <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Our Approach</h2>
              <p className="mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{project.approach}</p>
            </section>
          )}
          {project.outcome && (
            <section>
              <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>The Outcome</h2>
              <p className="mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{project.outcome}</p>
            </section>
          )}
        </div>

        {project.images.length > 1 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {project.images.slice(1).map((image: { url: string; altText: string; publicId: string }) => (
              <ImageLightbox key={image.publicId} src={image.url} alt={image.altText}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.altText} className="w-full rounded-lg" />
              </ImageLightbox>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          {project.projectUrl && (
            <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="btn-premium-primary rounded-full px-6 py-3 font-semibold text-base-950">
              View Live Project
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="btn-premium-secondary rounded-full px-6 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>
              View Repository
            </a>
          )}
        </div>
      </article>
    </main>
  );
}
