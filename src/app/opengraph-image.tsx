import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image() {
  if (process.env.OG_IMAGES_ENABLED === "false") {
    return new Response(null, { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px",
          background: "#0A0A0F",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 20, letterSpacing: 4, textTransform: "uppercase", color: "#2EC5F0", display: "flex" }}>
          TGO DevStudio
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, color: "#F5F5F8", marginTop: 24, display: "flex" }}>
          Software Built Like It Matters
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 8,
            background: "linear-gradient(90deg, #6C3CE9, #2EC5F0)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
