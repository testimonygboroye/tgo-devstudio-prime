"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer: document.referrer || undefined }),
    }).catch(() => {
      // Silently ignore — analytics should never disrupt the visitor's experience.
    });
  }, [pathname]);

  return null;
}
