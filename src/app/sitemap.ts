import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import BlogPost from "@/models/BlogPost";
import JobOpening from "@/models/JobOpening";
import TeamMember from "@/models/TeamMember";
import Review from "@/models/Review";
import HelpArticle from "@/models/HelpArticle";
import { getSiteUrl } from "@/lib/siteUrl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteUrl();

  await connectToDatabase();

  const [
    projects,
    posts,
    jobs,
    teamMembers,
    reviews,
    helpArticles,
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

    TeamMember.find({})
      .select("_id updatedAt")
      .lean(),

    Review.find({
      status: "approved",
    })
      .select("_id updatedAt")
      .lean(),

    HelpArticle.find({
      publishStatus: "published",
    })
      .select("_id updatedAt")
      .lean(),
  ]);

  const staticRoutes = [
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
  ];

  const staticEntries: MetadataRoute.Sitemap =
    staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: new Date(),
    }));

  const projectEntries: MetadataRoute.Sitemap =
    projects.map((project) => ({
      url: `${siteUrl}/portfolio/${project.slug}`,
      lastModified:
        project.updatedAt || new Date(),
    }));

  const blogEntries: MetadataRoute.Sitemap =
    posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified:
        post.updatedAt || new Date(),
    }));

  const careerEntries: MetadataRoute.Sitemap =
    jobs.map((job) => ({
      url: `${siteUrl}/careers/${job.slug}`,
      lastModified:
        job.updatedAt || new Date(),
    }));

  const teamEntries: MetadataRoute.Sitemap =
    teamMembers.map((member) => ({
      url: `${siteUrl}/team/${member._id}`,
      lastModified:
        member.updatedAt || new Date(),
    }));

  const testimonialEntries: MetadataRoute.Sitemap =
    reviews.map((review) => ({
      url: `${siteUrl}/testimonials/${review._id}`,
      lastModified:
        review.updatedAt || new Date(),
    }));

  const helpEntries: MetadataRoute.Sitemap =
    helpArticles.map((article) => ({
      url: `${siteUrl}/help/${article._id}`,
      lastModified:
        article.updatedAt || new Date(),
    }));

  return [
    ...staticEntries,
    ...projectEntries,
    ...blogEntries,
    ...careerEntries,
    ...teamEntries,
    ...testimonialEntries,
    ...helpEntries,
  ];
}
