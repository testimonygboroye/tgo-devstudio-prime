import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import BlogPost from "@/models/BlogPost";
import JobOpening from "@/models/JobOpening";
import TeamMember from "@/models/TeamMember";
import Review from "@/models/Review";
import HelpArticle from "@/models/HelpArticle";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://tgo-devstudio-prime.onrender.com");

  await connectToDatabase();

  const [projects, posts, jobs, teamMembers, reviews, helpArticles] = await Promise.all([
    Project.find({ publishStatus: "published" }).select("slug updatedAt").lean(),
    BlogPost.find({ publishStatus: "published" }).select("slug updatedAt").lean(),
    JobOpening.find({ publishStatus: "published" }).select("slug updatedAt").lean(),
    TeamMember.find({}).select("_id updatedAt").lean(),
    Review.find({ status: "approved" }).select("_id updatedAt").lean(),
    HelpArticle.find({ publishStatus: "published" }).select("_id updatedAt").lean(),
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

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));

  const projectEntries: MetadataRoute.Sitemap = projects.map((p: any) => ({
    url: `${siteUrl}/portfolio/${p.slug}`,
    lastModified: p.updatedAt || new Date(),
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((b: any) => ({
    url: `${siteUrl}/blog/${b.slug}`,
    lastModified: b.updatedAt || new Date(),
  }));

  const careerEntries: MetadataRoute.Sitemap = jobs.map((j: any) => ({
    url: `${siteUrl}/careers/${j.slug}`,
    lastModified: j.updatedAt || new Date(),
  }));

  const teamEntries: MetadataRoute.Sitemap = teamMembers.map((t: any) => ({
    url: `${siteUrl}/team/${t._id}`,
    lastModified: t.updatedAt || new Date(),
  }));

  const testimonialEntries: MetadataRoute.Sitemap = reviews.map((r: any) => ({
    url: `${siteUrl}/testimonials/${r._id}`,
    lastModified: r.updatedAt || new Date(),
  }));

  const helpEntries: MetadataRoute.Sitemap = helpArticles.map((h: any) => ({
    url: `${siteUrl}/help/${h._id}`,
    lastModified: h.updatedAt || new Date(),
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
