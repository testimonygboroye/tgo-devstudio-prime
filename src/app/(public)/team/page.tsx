import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import TeamMember from "@/models/TeamMember";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Team | TGO DevStudio Prime",
  description: "Meet the team behind TGO DevStudio.",
};

export default async function TeamPage() {
  await connectToDatabase();
  const teamMembers = await TeamMember.find({ publishStatus: "published" })
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-5xl">
        <span className="eyebrow-label">Team</span>
        <h1 className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
          The People Behind TGO DevStudio
        </h1>

        {teamMembers.length === 0 && (
          <p className="mt-14" style={{ color: "var(--text-muted)" }}>Team profiles are on the way.</p>
        )}

        <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <div key={member._id.toString()} className="surface-card">
              <div className="surface-card-inner p-7">
                <Link href={`/team/${member.slug}`} className="block">
                  {member.photo ? (
                    <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full">
                      <Image src={member.photo.url} alt={member.photo.altText} fill sizes="96px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="mx-auto h-24 w-24 rounded-full" style={{ backgroundColor: "var(--bg-surface-2)" }} />
                  )}
                  <h2 className="mt-5 text-center text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{member.name}</h2>
                  <p className="text-center text-sm text-brand-cyan-300">{member.jobTitle}</p>
                  <p className="mt-3 line-clamp-3 text-center text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{member.bio}</p>
                </Link>

                {(member.linkedinUrl || member.githubUrl || member.twitterUrl) && (
                  <div className="mt-5 flex justify-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                    {member.linkedinUrl && <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-cyan-300">LinkedIn</a>}
                    {member.githubUrl && <a href={member.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-cyan-300">GitHub</a>}
                    {member.twitterUrl && <a href={member.twitterUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-cyan-300">X</a>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
