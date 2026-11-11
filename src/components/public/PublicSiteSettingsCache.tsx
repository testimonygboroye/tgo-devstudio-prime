"use client";

import { useEffect } from "react";
import type { PublicSiteChromeSettings } from "@/lib/publicSite/types";

export default function PublicSiteSettingsCache({ settings }: { settings: PublicSiteChromeSettings | null }) {
  useEffect(() => {
    if (!settings) return;
    try {
      localStorage.setItem("tgo-public-site-settings", JSON.stringify(settings));
    } catch {
      // Storage can be disabled; the public site still works normally.
    }
  }, [settings]);
  return null;
}
