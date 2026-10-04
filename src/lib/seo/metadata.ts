import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export interface SEOPageInput {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  type?: "website" | "article";
  image?: string;
}

export function createSEOPageMetadata({
  title,
  description,
  path = "",
  keywords = [],
  type = "website",
  image = "/logo.png",
}: SEOPageInput): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path}`;

  return {
    title,
    description,
    keywords: keywords.slice(0, 30),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "TGO DevStudio",
      type,
      images: [
        {
          url: image,
          alt: "TGO DevStudio",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
