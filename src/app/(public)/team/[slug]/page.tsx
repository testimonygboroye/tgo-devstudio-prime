import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import TeamMember from "@/models/TeamMember";
import { ArrowLeft } from "lucide-react";
import SmartImage from "@/components/public/SmartImage";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import {
  createTranslator,
  getLocalizedContent,
} from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import { getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getMember(slug: string) {
  await connectToDatabase();

  return TeamMember.findOne({
    slug,
    publishStatus: "published",
  }).lean();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await getServerLocale();
  const { slug } = await params;
  const siteUrl = getSiteUrl();
  const rawMember = await getMember(slug);

  if (!rawMember) {
    return {
      title: "Team Member Not Found | TGO DevStudio Prime",
      robots: { index: false, follow: true },
    };
  }

  const member = getLocalizedContent(
    rawMember,
    locale,
    TRANSLATABLE_FIELDS.TeamMember
  );

  const title = `${member.name} | TGO DevStudio Prime`;
  const description = String(member.bio || member.jobTitle || "")
    .replace(/\s+/g, " ")
    .slice(0, 160);

  const profileImage =
    typeof member.photo?.url === "string" && member.photo.url.trim()
      ? member.photo.url
      : `${siteUrl}/opengraph-image`;

  const canonical = `${siteUrl}/team/${member.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      url: canonical,
      title,
      description,
      type: "profile",
      siteName: "TGO DevStudio",
      images: [
        {
          url: profileImage,
          alt: member.photo?.altText || `${member.name} — TGO DevStudio`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [profileImage],
    },
  };
}

export default async function TeamMemberDetailPage({
  params,
}: PageProps) {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const { slug } = await params;
  const rawMember = await getMember(slug);

  if (!rawMember) notFound();

  const member = getLocalizedContent(
    rawMember,
    locale,
    TRANSLATABLE_FIELDS.TeamMember
  );

  return (
    <main className="team-detail-page">
      <div className="home-container team-detail-container">
        <Link
          href="/team"
          className="flex items-center gap-1 text-sm text-neutral-400 hover:text-brand-cyan-300"
        >
          <ArrowLeft size={16} />
          {t("team.backToTeam")}
        </Link>

        <div className="team-detail-profile">
          <SmartImage src={member.photo?.url} alt={member.photo?.altText || member.name} label={member.name} className="team-detail-avatar" />

          <div className="mt-4 sm:mt-0">
            <h1 className="text-3xl font-bold text-neutral-100 sm:text-4xl">
              {member.name}
            </h1>

            <p className="mt-1 text-brand-cyan-300">
              {member.jobTitle}
            </p>

            {(member.linkedinUrl ||
              member.githubUrl ||
              member.twitterUrl) && (
              <div className="mt-3 flex justify-center gap-4 text-sm text-neutral-400 sm:justify-start">
                {member.linkedinUrl && (
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-cyan-300"
                  >
                    LinkedIn
                  </a>
                )}

                {member.githubUrl && (
                  <a
                    href={member.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-cyan-300"
                  >
                    GitHub
                  </a>
                )}

                {member.twitterUrl && (
                  <a
                    href={member.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-cyan-300"
                  >
                    X
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="team-detail-bio">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            {t("team.about")}
          </h2>

          <p className="mt-3 whitespace-pre-wrap text-neutral-100/80">
            {member.bio}
          </p>
        </div>
      </div>
    </main>
  );
}
