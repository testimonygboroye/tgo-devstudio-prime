import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import TeamMember from "@/models/TeamMember";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Team | TGO DevStudio Prime",
  description: "Meet the team behind TGO DevStudio.",
  openGraph: {
    title: "Team | TGO DevStudio Prime",
    description: "Meet the team behind TGO DevStudio.",
    type: "website",
  },
};

export default async function TeamPage() {
  await connectToDatabase();
  const teamMembers = await TeamMember.find({ publishStatus: "published" })
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Team</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">
          The People Behind TGO DevStudio
        </h1>

        {teamMembers.length === 0 && (
          <p className="mt-12 text-neutral-400">Team profiles are on the way.</p>
        )}

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <div key={member._id.toString()} className="rounded-xl border border-base-800 bg-base-900 p-6 transition-colors hover:border-brand-cyan-400/50">
              <Link href={`/team/${member.slug}`} className="block">
                {member.photo && (
                  <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full">
                    <Image
                      src={member.photo.url}
                      alt={member.photo.altText}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                )}
                <h2 className="mt-4 text-center text-lg font-semibold text-neutral-100">{member.name}</h2>
                <p className="text-center text-sm text-brand-cyan-300">{member.jobTitle}</p>
                <p className="mt-3 text-center text-sm text-neutral-400 line-clamp-3">{member.bio}</p>
              </Link>

              {(member.linkedinUrl || member.githubUrl || member.twitterUrl) && (
                <div className="mt-4 flex justify-center gap-4 text-xs text-neutral-400">
                  {member.linkedinUrl && (
                    <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-cyan-300">
                      LinkedIn
                    </a>
                  )}
                  {member.githubUrl && (
                    <a href={member.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-cyan-300">
                      GitHub
                    </a>
                  )}
                  {member.twitterUrl && (
                    <a href={member.twitterUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-cyan-300">
                      X
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
