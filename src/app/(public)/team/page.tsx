import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import TeamMember from "@/models/TeamMember";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Team | TGO DevStudio Prime",
  description: "Meet the team behind TGO DevStudio.",
};

export default async function TeamPage() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);

  await connectToDatabase();

  const rawMembers = await TeamMember.find({
    publishStatus: "published",
  })
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();

  const teamMembers = rawMembers.map((member) =>
    getLocalizedContent(member, locale, TRANSLATABLE_FIELDS.TeamMember)
  );

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-5xl">
        <span className="eyebrow-label">{t("nav.team")}</span>

        <h1
          className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("team.title")}
        </h1>

        <p
          className="mt-4 max-w-2xl leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {t("team.subtitle")}
        </p>

        <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <Link
              key={member._id.toString()}
              href={`/team/${member.slug}`}
              className="surface-card group block"
            >
              <div className="surface-card-inner p-7">
                {member.photo ? (
                  <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full">
                    <Image
                      src={member.photo.url}
                      alt={member.photo.altText}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="mx-auto h-24 w-24 rounded-full bg-base-800" />
                )}

                <h2
                  className="mt-5 text-center text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {member.name}
                </h2>

                <p className="text-center text-sm text-brand-cyan-300">
                  {member.jobTitle}
                </p>

                <p
                  className="mt-3 line-clamp-3 text-center text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {member.bio}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
