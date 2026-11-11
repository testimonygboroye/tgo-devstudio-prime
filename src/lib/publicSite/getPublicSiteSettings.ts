import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import PublicSiteSettings from "@/models/PublicSiteSettings";
import type { PublicSiteChromeSettings } from "@/lib/publicSite/types";

const loadPublicSiteSettings = unstable_cache(
  async (): Promise<PublicSiteChromeSettings | null> => {
    await connectToDatabase();
    const settings = await PublicSiteSettings.findOne().lean();
    if (!settings) return null;
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
