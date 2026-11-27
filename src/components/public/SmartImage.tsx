"use client";


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
  const imageSrc = src || "/images/illustrations/brand-fallback.svg";
  const isCloudinary = imageSrc.startsWith("https://res.cloudinary.com/") && imageSrc.includes("/image/upload/");
  const srcSet = isCloudinary
    ? CLOUDINARY_WIDTHS.map(width => `${cloudinaryVariant(imageSrc, width)} ${width}w`).join(", ")
    : undefined;
  const optimizedSrc = isCloudinary ? cloudinaryVariant(imageSrc, 960) || imageSrc : imageSrc;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={optimizedSrc} srcSet={srcSet} sizes={srcSet ? sizes : undefined} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" onError={(event) => { const image = event.currentTarget; if (image.dataset.tgoFallbackApplied === "true") return; image.dataset.tgoFallbackApplied = "true"; image.removeAttribute("srcSet"); image.src = "/images/illustrations/brand-fallback.svg"; }} className={className}/>;
}
