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

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap =
    staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: now,
    }));

  const serviceEntries: MetadataRoute.Sitemap =
    services.map((service) => ({
      url: `${siteUrl}/services/${slugify(service.title)}`,
      lastModified: service.updatedAt || now,
    }));

  const projectEntries: MetadataRoute.Sitemap =
    projects.map((project) => ({
      url: `${siteUrl}/portfolio/${project.slug}`,
      lastModified: project.updatedAt || now,
    }));

  const blogEntries: MetadataRoute.Sitemap =
    posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || now,
    }));

  const careerEntries: MetadataRoute.Sitemap =
    jobs.map((job) => ({
      url: `${siteUrl}/careers/${job.slug}`,
      lastModified: job.updatedAt || now,
    }));

  const teamEntries: MetadataRoute.Sitemap =
    teamMembers.map((member) => ({
      url: `${siteUrl}/team/${member.slug}`,
      lastModified: member.updatedAt || now,
    }));

  const testimonialEntries: MetadataRoute.Sitemap =
    reviews.map((review) => ({
      url: `${siteUrl}/testimonials/${review._id}`,
      lastModified: review.updatedAt || now,
    }));

  const helpEntries: MetadataRoute.Sitemap =
    helpArticles.map((article) => ({
      url: `${siteUrl}/help/${article._id}`,
      lastModified: article.updatedAt || now,
    }));

  return [
    ...staticEntries,
    ...serviceEntries,
    ...projectEntries,
    ...blogEntries,
    ...careerEntries,
    ...teamEntries,
    ...testimonialEntries,
    ...helpEntries,
  ];
}
