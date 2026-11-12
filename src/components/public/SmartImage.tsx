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
      <img src="/images/illustrations/brand-fallback.svg" alt="" aria-hidden="true" className="tgo-image-fallback-art" />
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
