import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import BlogPost from "@/models/BlogPost";
import JobOpening from "@/models/JobOpening";
import TeamMember from "@/models/TeamMember";
import Review from "@/models/Review";
import HelpArticle from "@/models/HelpArticle";
import Service from "@/models/Service";
import { getSiteUrl } from "@/lib/siteUrl";
import { slugify } from "@/lib/utils/slugify";

const STATIC_ROUTES = [
  "",
  "/services",
  "/portfolio",
  "/blog",
  "/careers",
  "/contact",
  "/book-a-call",
  "/about",
  "/process",
  "/team",
  "/testimonials",
  "/faq",
  "/stack",
  "/help",
  "/accessibility",
  "/privacy-policy",
  "/terms-of-service",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
  }));

  /*
   * The sitemap itself must never fail just because MongoDB is
   * temporarily unavailable. Google must still be able to read
   * the sitemap and discover the core public pages.
   *
   * Dynamic CMS URLs are included whenever MongoDB is available.
   */
  try {
    await connectToDatabase();

    const [
      projects,
      posts,
      jobs,
      teamMembers,
      reviews,
      helpArticles,
      services,
    ] = await Promise.all([
      Project.find({
        publishStatus: "published",
      })
        .select("slug updatedAt")
        .lean(),

      BlogPost.find({
        publishStatus: "published",
      })
        .select("slug updatedAt")
        .lean(),

      JobOpening.find({
        publishStatus: "published",
      })
        .select("slug updatedAt")
        .lean(),

      TeamMember.find({
        publishStatus: "published",
      })
        .select("slug updatedAt")
        .lean(),

      Review.find({
        status: "approved",
      })
        .select("_id updatedAt")
        .lean(),

      HelpArticle.find({
        visibility: "public",
      })
        .select("_id updatedAt")
        .lean(),

      Service.find({
        publishStatus: "published",
      })
        .select("title updatedAt")
        .lean(),
    ]);

    return [
      ...staticEntries,

      ...services.map((service) => ({
        url: `${siteUrl}/services/${slugify(service.title)}`,
        lastModified: service.updatedAt || now,
      })),

      ...projects.map((project) => ({
        url: `${siteUrl}/portfolio/${project.slug}`,
        lastModified: project.updatedAt || now,
      })),

      ...posts.map((post) => ({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt || now,
      })),

      ...jobs.map((job) => ({
        url: `${siteUrl}/careers/${job.slug}`,
        lastModified: job.updatedAt || now,
      })),

      ...teamMembers.map((member) => ({
        url: `${siteUrl}/team/${member.slug}`,
        lastModified: member.updatedAt || now,
      })),

      ...reviews.map((review) => ({
        url: `${siteUrl}/testimonials/${review._id}`,
        lastModified: review.updatedAt || now,
      })),

      ...helpArticles.map((article) => ({
        url: `${siteUrl}/help/${article._id}`,
        lastModified: article.updatedAt || now,
      })),
    ];
  } catch (error) {
    console.error(
      "[TGO Sitemap] Dynamic sitemap data unavailable:",
      error
    );

    return staticEntries;
  }
}
