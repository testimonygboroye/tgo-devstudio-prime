import { connectToDatabase } from "@/lib/db";
import PublicPageContent, { type PublicPageKey } from "@/models/PublicPageContent";
import { PUBLIC_PAGE_DEFAULTS } from "@/lib/constants/publicSiteDefaults";

export async function getPublicPageContent(pageKey: PublicPageKey) {
  await connectToDatabase();
  const saved = await PublicPageContent.findOne({ pageKey }).lean();
  return { ...PUBLIC_PAGE_DEFAULTS[pageKey], ...(saved || {}), pageKey };
}
