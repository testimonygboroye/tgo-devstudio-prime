import { NextResponse } from "next/server";

export async function GET() {
  const adminPath = process.env.ADMIN_PATH || "command-deck";
  const basePath = `/${adminPath}`;

  return NextResponse.json({
    name: "TGO DevStudio Admin",
    short_name: "TGO Admin",
    start_url: `${basePath}/dashboard`,
    scope: basePath,
    display: "standalone",
    background_color: "#0A0A0F",
    theme_color: "#0A0A0F",
    icons: [
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  });
}
