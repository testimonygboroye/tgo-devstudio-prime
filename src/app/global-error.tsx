"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[TGO GlobalError]", { message: error.message, digest: error.digest });
  }, [error]);

  const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    padding: "0 24px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    cursor: "pointer",
  } as const;

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%, rgba(91,46,232,.22), transparent 55%), #0B0E14", color: "#F1F3F8", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <main style={{ boxSizing: "border-box", display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: "48px 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, border: "1px solid rgba(46,197,240,.25)", background: "rgba(46,197,240,.08)", borderRadius: 999, padding: "8px 14px", color: "#8DE8FA", fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2EC5F0" }} /> TGO DevStudio · Recovery
          </div>
          <div style={{ maxWidth: 680 }}>
            <p style={{ margin: "0 0 14px", color: "#8B93A7", fontSize: 13, letterSpacing: ".18em", textTransform: "uppercase" }}>Unexpected application error</p>
            <h1 style={{ margin: 0, fontSize: "clamp(38px, 7vw, 68px)", lineHeight: 1.05, letterSpacing: "-.045em", fontWeight: 800, background: "linear-gradient(135deg,#9B82FF 0%,#2EC5F0 85%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>We’re restoring this page.</h1>
            <p style={{ margin: "20px auto 0", maxWidth: 480, color: "#A8B0C3", fontSize: 16, lineHeight: 1.75 }}>The page encountered an unexpected error. Your account and saved information have not been changed by this screen. Try loading the page again.</p>
          </div>
          {error.digest && <p style={{ margin: 0, color: "#697386", fontFamily: "monospace", fontSize: 11 }}>Reference: {error.digest}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 8 }}>
            <button onClick={() => reset()} style={{ ...buttonStyle, border: 0, color: "#07111D", background: "linear-gradient(135deg,#8A6BFF,#2EC5F0)" }}>Try again</button>
            <a href="/" style={{ ...buttonStyle, border: "1px solid #343B50", color: "#E7EAF2", background: "rgba(255,255,255,.04)" }}>Return home</a>
          </div>
        </main>
      </body>
    </html>
  );
}
