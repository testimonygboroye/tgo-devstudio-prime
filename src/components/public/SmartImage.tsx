"use client";

import { useState } from "react";
import { ImageOff, Sparkles } from "lucide-react";

export default function SmartImage({ src, alt, label, className = "" }: {
  src?: string | null; alt: string; label?: string; className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return (
    <div className={"tgo-image-fallback "+className} role="img" aria-label={alt}>
      <img src="/images/illustrations/brand-fallback.svg" alt="" aria-hidden="true" className="tgo-image-fallback-art" />
      <div className="tgo-image-fallback-grid" />
      <span className="tgo-image-fallback-mark"><Sparkles size={20}/></span>
      <strong>{label || "TGO DevStudio"}</strong>
      <small>DESIGNED FOR WHAT&apos;S NEXT</small>
      <ImageOff className="tgo-image-fallback-icon" size={15}/>
    </div>
  );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={className}/>;
}
