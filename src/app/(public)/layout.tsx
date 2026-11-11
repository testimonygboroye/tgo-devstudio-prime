import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import SocialFloatingButton from "@/components/public/SocialFloatingButton";
import BackToTopButton from "@/components/shared/BackToTopButton";
import CookieConsentBanner from "@/components/public/CookieConsentBanner";
import HelpDiscoveryPrompt from "@/components/shared/HelpDiscoveryPrompt";
import AnalyticsTracker from "@/components/public/AnalyticsTracker";
import ShareCurrentPage from "@/components/public/ShareCurrentPage";
import { connectToDatabase } from "@/lib/db";
import PublicSiteSettings from "@/models/PublicSiteSettings";
import type { PublicSiteChromeSettings } from "@/lib/publicSite/types";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let siteSettings: PublicSiteChromeSettings | null = null;
  try {
    await connectToDatabase();
    const saved = await PublicSiteSettings.findOne().lean();
    if (saved) siteSettings = saved as unknown as PublicSiteChromeSettings;
  } catch {
    // Keep the public site available with its built-in navigation and footer if settings are unavailable.
  }

  return (
    <>
      <SiteHeader settings={siteSettings} />

      {children}

      <ShareCurrentPage />

      <SiteFooter settings={siteSettings} />

      <SocialFloatingButton />

      <BackToTopButton position="left" />

      <CookieConsentBanner />

      <HelpDiscoveryPrompt />

      <AnalyticsTracker />
    </>
  );
}
