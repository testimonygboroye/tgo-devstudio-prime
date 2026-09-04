import { ImageResponse } from "next/og";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { getPubliclyVisibleFilter } from "@/lib/utils/blogVisibility";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

const siteUrl = process.env.SITE_URL || "https://tgo-devstudio-prime.onrender.com";

export default async function Image({ params }: { params: { slug: string } }) {
  if (process.env.OG_IMAGES_ENABLED === "false") {
    return new Response(null, { status: 404 });
  }

  await connectToDatabase();
  const post = await BlogPost.findOne({ slug: params.slug, ...getPubliclyVisibleFilter() })
    .select("title excerpt")
    .lean();

  const title = post?.title || "TGO DevStudio Prime";
  const excerpt = post?.excerpt || "Full-stack software engineering studio.";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", background: "#0A0A0F" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${siteUrl}/logo.png`} width={50} height={50} style={{ display: "flex" }} alt="" />

        <div style={{ fontSize: 20, letterSpacing: 4, textTransform: "uppercase", color: "#2EC5F0", display: "flex" }}>
          TGO DevStudio · Blog
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, color: "#F5F5F8", marginTop: 24, lineHeight: 1.1, display: "flex" }}>
          {title}
        </div>
        <div style={{ fontSize: 28, color: "#A1A1AA", marginTop: 24, display: "flex" }}>
          {excerpt.slice(0, 120)}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 8, background: "linear-gradient(90deg, #6C3CE9, #2EC5F0)", display: "flex" }} />
      </div>
    ),
    { ...size }
  );
}
