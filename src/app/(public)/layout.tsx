import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import SocialFloatingButton from "@/components/public/SocialFloatingButton";
import BackToTopButton from "@/components/shared/BackToTopButton";
import CookieConsentBanner from "@/components/public/CookieConsentBanner";
import HelpDiscoveryPrompt from "@/components/shared/HelpDiscoveryPrompt";
import AnalyticsTracker from "@/components/public/AnalyticsTracker";
import ShareCurrentPage from "@/components/public/ShareCurrentPage";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />

      {children}

      <ShareCurrentPage />

      <SiteFooter />

      <SocialFloatingButton />

      <BackToTopButton position="left" />

      <CookieConsentBanner />

      <HelpDiscoveryPrompt />

      <AnalyticsTracker />
    </>
  );
}
