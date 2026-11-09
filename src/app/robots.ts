import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl();
  const adminPath = process.env.ADMIN_PATH?.trim();
  const protectedAdminPath = adminPath
    ? (adminPath.startsWith("/") ? adminPath : `/${adminPath}`)
    : "/command-deck";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/settings",
          "/auth/",
          protectedAdminPath,
        ],
      },
      {
        userAgent: "facebookexternalhit",
        allow: "/",
      },
      {
        userAgent: "WhatsApp",
        allow: "/",
      },
      {
        userAgent: "Twitterbot",
        allow: "/",
      },
      {
        userAgent: "LinkedInBot",
        allow: "/",
      },
    ],

    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
