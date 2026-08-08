import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL || "https://tgo-devstudio-prime.onrender.com";

  await connectToDatabase();
  const projects = await Project.find({ publishStatus: "published" })
    .select("slug updatedAt")
    .lean();

  const projectEntries: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${siteUrl}/portfolio/${project.slug}`,
    lastModified: project.updatedAt,
  }));

  return [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/portfolio`, lastModified: new Date() },
    { url: `${siteUrl}/team`, lastModified: new Date() },
    { url: `${siteUrl}/blog`, lastModified: new Date() },
    ...projectEntries,
  ];
}
