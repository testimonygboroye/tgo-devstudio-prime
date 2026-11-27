"use client";

import { useEffect, useState } from "react";
import { ImageOff, Sparkles } from "lucide-react";

function cloudinaryVariant(src: string, width: number) {
  if (!src.startsWith("https://res.cloudinary.com/")) return null;
  const marker = "/image/upload/";
  if (!src.includes(marker)) return null;
  return src.replace(marker, marker + `f_auto,q_auto:good,c_limit,w_${width}/`);
}

export default function SmartImage({ src, alt, label, className = "", priority = false }: {
  src?: string | null; alt: string; label?: string; className?: string; priority?: boolean; sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const isCloudinary = Boolean(src?.startsWith("https://res.cloudinary.com/") && src.includes("/image/upload/"));
  const optimizedSrc = src && isCloudinary ? cloudinaryVariant(src, 960) || src : src;
  useEffect(() => {
    let active = true;
    setFailed(false);
    setLoaded(false);
    if (!optimizedSrc) { setFailed(true); return; }
    const probe = new Image();
    probe.onload = () => { if (active) setLoaded(true); };
    probe.onerror = () => { if (active) setFailed(true); };
    probe.src = optimizedSrc;
    return () => { active = false; probe.onload = null; probe.onerror = null; };
  }, [optimizedSrc]);
  if (!src || failed || !loaded) return (
    <div className={"tgo-image-fallback " + className} role="img" aria-label={alt}>
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
  return <img src={optimizedSrc} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" onError={() => setFailed(true)} className={className}/>;
}
