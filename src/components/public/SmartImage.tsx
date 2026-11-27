"use client";

import { useState } from "react";
import { ImageOff, Sparkles } from "lucide-react";

const CLOUDINARY_WIDTHS = [320, 480, 640, 960, 1280, 1600] as const;

function cloudinaryVariant(src: string, width: number) {
  if (!src.startsWith("https://res.cloudinary.com/")) return null;
  const marker = "/image/upload/";
  if (!src.includes(marker)) return null;
  return src.replace(marker, marker + `f_auto,q_auto:good,c_limit,w_${width}/`);
}

export default function SmartImage({ src, alt, label, className = "", priority = false, sizes = "100vw" }: {
  src?: string | null; alt: string; label?: string; className?: string; priority?: boolean; sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return (
    <div className={"tgo-image-fallback " + className} role="img" aria-label={alt}>
      <svg viewBox="0 0 1200 800" role="presentation" aria-hidden="true" className="tgo-image-fallback-art"><rect width="1200" height="800" fill="#080D1B"/><circle cx="600" cy="400" r="255" fill="none" stroke="#5B2EE8" strokeWidth="7" opacity=".38"/><circle cx="600" cy="400" r="205" fill="none" stroke="#2EC5F0" strokeWidth="5" opacity=".32"/><circle cx="600" cy="400" r="155" fill="none" stroke="#5B2EE8" strokeWidth="4" opacity=".3"/><path d="m600 230 150 86v172l-150 86-150-86V316l150-86Z" fill="none" stroke="#5B2EE8" strokeWidth="7"/><path d="m600 315 76 44v88l-76 44-76-44v-88l76-44Z" fill="#2EC5F0" fillOpacity=".16" stroke="#2EC5F0" strokeWidth="4"/><path d="m524 359 76 44 76-44M600 403v88" stroke="#B9F1FF" strokeWidth="4"/><circle cx="600" cy="400" r="5" fill="#fff"/></svg>
      <div className="tgo-image-fallback-grid" aria-hidden="true" />
      <span className="tgo-image-fallback-mark" aria-hidden="true"><Sparkles size={20}/></span>
      <span className="tgo-image-fallback-caption">
        <strong>{label || "TGO DevStudio"}</strong>
        <small>DESIGNED FOR WHAT&apos;S NEXT</small>
      </span>
      <ImageOff className="tgo-image-fallback-icon" size={15} aria-hidden="true"/>
    </div>
  );
  const isCloudinary = src.startsWith("https://res.cloudinary.com/") && src.includes("/image/upload/");
  const srcSet = isCloudinary
    ? CLOUDINARY_WIDTHS.map(width => `${cloudinaryVariant(src, width)} ${width}w`).join(", ")
    : undefined;
  const optimizedSrc = isCloudinary ? cloudinaryVariant(src, 960) || src : src;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={optimizedSrc} srcSet={srcSet} sizes={srcSet ? sizes : undefined} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" onError={() => setFailed(true)} className={className}/>;
}
