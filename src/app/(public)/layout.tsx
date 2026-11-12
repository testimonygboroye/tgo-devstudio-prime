import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import SocialFloatingButton from "@/components/public/SocialFloatingButton";
import BackToTopButton from "@/components/shared/BackToTopButton";
import CookieConsentBanner from "@/components/public/CookieConsentBanner";
import HelpDiscoveryPrompt from "@/components/shared/HelpDiscoveryPrompt";
import AnalyticsTracker from "@/components/public/AnalyticsTracker";
import ShareCurrentPage from "@/components/public/ShareCurrentPage";
import PublicRouteScrollReset from "@/components/public/PublicRouteScrollReset";
import AIChatWidget from "@/components/shared/AIChatWidget";
import { getPublicSiteSettings } from "@/lib/publicSite/getPublicSiteSettings";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const siteSettings = await getPublicSiteSettings();
  return <>
    <PublicRouteScrollReset />
    <SiteHeader settings={siteSettings} />
    {children}
    <ShareCurrentPage />
    <SiteFooter settings={siteSettings} />
    <SocialFloatingButton />
    <BackToTopButton position="left" />
    <CookieConsentBanner />
    <HelpDiscoveryPrompt />
    <AnalyticsTracker />
    <AIChatWidget scope="public" />
  </>;
}
