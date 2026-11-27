"use client";

import { useEffect, useState } from "react";
import { ImageOff, Sparkles } from "lucide-react";

const CLOUDINARY_WIDTHS = [320, 480, 640, 960, 1280, 1600] as const;

function cloudinaryVariant(src: string, width: number) {
  if (!src.startsWith("https://res.cloudinary.com/")) return null;
  const marker = "/image/upload/";
  if (!src.includes(marker)) return null;
  return src.replace(marker, marker + `f_auto,q_auto:good,c_limit,w_${width}/`);
}

function BrandedFallback({ alt, label, className }: { alt: string; label?: string; className: string }) {
  return (
    <div className={"tgo-image-fallback " + className} role="img" aria-label={alt}>
      <svg className="tgo-image-fallback-art" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="tgo-fallback-gradient" x1="120" y1="90" x2="1030" y2="720" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5B2EE8" />
            <stop offset="1" stopColor="#2EC5F0" />
          </linearGradient>
          <radialGradient id="tgo-fallback-glow">
            <stop stopColor="#263C70" stopOpacity=".85" />
            <stop offset="1" stopColor="#080D1B" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path fill="#080D1B" d="M0 0h1200v800H0z" />
        <path fill="url(#tgo-fallback-glow)" d="M0 0h1200v800H0z" />
        <g stroke="url(#tgo-fallback-gradient)" strokeOpacity=".38">
          <circle cx="600" cy="400" r="255" /><circle cx="600" cy="400" r="205" /><circle cx="600" cy="400" r="155" />
        </g>
        <path d="m600 230 150 86v172l-150 86-150-86V316l150-86Z" stroke="url(#tgo-fallback-gradient)" strokeWidth="7" />
        <path d="m600 315 76 44v88l-76 44-76-44v-88l76-44Z" fill="url(#tgo-fallback-gradient)" fillOpacity=".2" stroke="url(#tgo-fallback-gradient)" strokeWidth="4" />
        <path d="m524 359 76 44 76-44M600 403v88" stroke="#B9F1FF" strokeWidth="4" />
        <circle cx="600" cy="400" r="5" fill="#fff" />
      </svg>
      <div className="tgo-image-fallback-grid" aria-hidden="true" />
      <span className="tgo-image-fallback-mark" aria-hidden="true"><Sparkles size={20}/></span>
      <span className="tgo-image-fallback-caption">
        <strong>{label || "TGO DevStudio"}</strong>
        <small>DESIGNED FOR WHAT&apos;S NEXT</small>
      </span>
      <ImageOff className="tgo-image-fallback-icon" size={15} aria-hidden="true"/>
    </div>
  );
}

export default function SmartImage({ src, alt, label, className = "", priority = false, sizes = "100vw" }: {
  src?: string | null; alt: string; label?: string; className?: string; priority?: boolean; sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  // A component may be reused for a different record after its previous image
  // failed. Reset the failure state when the source changes so the new source
  // gets a chance to load on both Render and Vercel deployments.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return <BrandedFallback alt={alt} label={label} className={className}/>;
  const isCloudinary = src.startsWith("https://res.cloudinary.com/") && src.includes("/image/upload/");
  const srcSet = isCloudinary
    ? CLOUDINARY_WIDTHS.map(width => `${cloudinaryVariant(src, width)} ${width}w`).join(", ")
    : undefined;
  const optimizedSrc = isCloudinary ? cloudinaryVariant(src, 960) || src : src;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={optimizedSrc} srcSet={srcSet} sizes={srcSet ? sizes : undefined} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" onError={() => setFailed(true)} className={className}/>;
}
