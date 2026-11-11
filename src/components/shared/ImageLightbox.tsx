"use client";

import { useState } from "react";
import { X, ImageOff } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  children: React.ReactNode;
}

export default function ImageLightbox({ src, alt, children }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="block cursor-zoom-in"
        aria-label={`View larger image: ${alt}`}
      >
        {children}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsOpen(false)}
        >
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          >
            <X size={24} />
          </button>
          {imageFailed ? (
            <div className="grid min-h-64 min-w-64 place-items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/90 p-10 text-center text-slate-300" onClick={(e) => e.stopPropagation()}>
              <ImageOff size={30} className="text-cyan-300" />
              <span className="max-w-xs text-sm">This image is temporarily unavailable.</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain" onError={() => setImageFailed(true)} onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </>
  );
}
