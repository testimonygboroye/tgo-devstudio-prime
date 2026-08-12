"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const STORAGE_KEY = "tgo-last-visit";
const RETURN_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export default function HelpDiscoveryPrompt() {
  const router = useRouter();
  const pathname = usePathname();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (pathname === "/help" || pathname.startsWith("/help/")) return;

    try {
      const lastVisit = window.localStorage.getItem(STORAGE_KEY);
      const now = Date.now();

      if (!lastVisit) {
        setShowPrompt(true);
      } else {
        const elapsed = now - parseInt(lastVisit, 10);
        if (elapsed > RETURN_THRESHOLD_MS) {
          setShowPrompt(true);
        }
      }

      window.localStorage.setItem(STORAGE_KEY, now.toString());
    } catch {
      // ignore storage errors
    }
  }, [pathname]);

  function handleDismiss() {
    setShowPrompt(false);
  }

  function handleAccept() {
    setShowPrompt(false);
    router.push("/help");
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-[90] w-[calc(100%-3rem)] max-w-sm -translate-x-1/2 rounded-lg border border-base-800 bg-base-900 p-4 shadow-2xl sm:left-6 sm:translate-x-0">
      <p className="text-sm font-semibold text-neutral-100">New here?</p>
      <p className="mt-1 text-sm text-neutral-400">
        Check out our Help &amp; Guide for answers to common questions.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleAccept}
          className="rounded-md brand-gradient-bg px-3 py-1.5 text-xs font-semibold text-base-950"
        >
          Open Help
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-md border border-base-800 px-3 py-1.5 text-xs text-neutral-300 hover:bg-base-800"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
