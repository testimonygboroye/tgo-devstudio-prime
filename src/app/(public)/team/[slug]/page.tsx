import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import TeamMember from "@/models/TeamMember";
import { Github, Linkedin, Twitter, ArrowLeft } from "lucide-react";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getMember(slug: string) {
  await connectToDatabase();
  return TeamMember.findOne({ slug, publishStatus: "published" }).lean();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = await getMember(slug);

  if (!member) {
    return { title: "Team Member Not Found | TGO DevStudio Prime" };
  }

  return {
    title: `${member.name} | TGO DevStudio Prime`,
    description: member.bio,
    openGraph: {
      title: `${member.name} | TGO DevStudio Prime`,
      description: member.bio,
      images: member.photo?.url ? [{ url: member.photo.url }] : undefined,
    },
  };
}

export default async function TeamMemberDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const member = await getMember(slug);

  if (!member) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/team"
          className="flex items-center gap-1 text-sm text-neutral-400 hover:text-brand-cyan-300"
        >
          <ArrowLeft size={16} /> Back to Team
        </Link>

        <div className="mt-8 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
          {member.photo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photo.url}
              alt={member.photo.altText || member.name}
              className="h-32 w-32 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="h-32 w-32 flex-shrink-0 rounded-full bg-base-800" />
          )}
          <div className="mt-4 sm:mt-0">
            <h1 className="text-3xl font-bold text-neutral-100 sm:text-4xl">{member.name}</h1>
            <p className="mt-1 text-brand-cyan-300">{member.jobTitle}</p>

            <div className="mt-3 flex justify-center gap-3 sm:justify-start">
              {member.githubUrl && (
                <a href={member.githubUrl} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-brand-cyan-300">
                  <Github size={20} />
                </a>
              )}
              {member.linkedinUrl && (
                <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-brand-cyan-300">
                  <Linkedin size={20} />
                </a>
              )}
              {member.twitterUrl && (
                <a href={member.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-brand-cyan-300">
                  <Twitter size={20} />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-base-800 pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">About</h2>
          <p className="mt-3 whitespace-pre-wrap text-neutral-100/80">{member.bio}</p>
        </div>
      </div>
    </main>
  );
}
