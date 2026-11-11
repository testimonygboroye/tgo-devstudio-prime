import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import PublicSiteSettings from "@/models/PublicSiteSettings";
import type { PublicSiteChromeSettings } from "@/lib/publicSite/types";
import { PUBLIC_SITE_SETTINGS_DEFAULTS } from "@/lib/constants/publicSiteDefaults";

const loadPublicSiteSettings = unstable_cache(
  async (): Promise<PublicSiteChromeSettings | null> => {
    await connectToDatabase();
    const saved = await PublicSiteSettings.findOne().lean();
    if (!saved) return null;
    const record = saved as unknown as Record<string, unknown>;
    const settings: Record<string, unknown> = { ...PUBLIC_SITE_SETTINGS_DEFAULTS };
    for (const key of Object.keys(PUBLIC_SITE_SETTINGS_DEFAULTS)) {
      if (record[key] !== undefined) settings[key] = record[key];
    }
    return JSON.parse(JSON.stringify(settings)) as PublicSiteChromeSettings;
  },
  ["public-site-settings-v1"],
  { revalidate: 300, tags: ["public-site-settings"] }
);

export async function getPublicSiteSettings(): Promise<PublicSiteChromeSettings | null> {
  try {
    return await loadPublicSiteSettings();
  } catch {
    return null;
  }
}
