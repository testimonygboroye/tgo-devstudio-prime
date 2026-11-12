"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Keep newly opened public routes anchored at their own page introduction. */
export default function PublicRouteScrollReset() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.location.hash) return;
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);
  return null;
}
