"use client";

import { useState } from "react";
import { ImageOff, Sparkles } from "lucide-react";

export default function SmartImage({ src, alt, label, className = "", priority = false }: {
  src?: string | null; alt: string; label?: string; className?: string; priority?: boolean;
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
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" onError={() => setFailed(true)} className={className}/>;
}
