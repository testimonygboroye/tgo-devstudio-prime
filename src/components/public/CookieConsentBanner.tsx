"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "tgo-cookie-consent";

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = window.localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  function handleAccept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // ignore storage errors
    }
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-base-800 bg-base-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-4 sm:flex-row sm:justify-between sm:px-12">
        <p className="text-sm text-neutral-100/80">
          We use cookies to improve your experience on this site. By continuing, you agree to
          our{" "}
          <Link href="/privacy-policy" className="text-brand-cyan-300 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <button
          onClick={handleAccept}
          className="flex-shrink-0 rounded-md brand-gradient-bg px-5 py-2 text-sm font-semibold text-base-950"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
