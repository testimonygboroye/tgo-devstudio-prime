import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import SocialFloatingButton from "@/components/public/SocialFloatingButton";
import BackToTopButton from "@/components/shared/BackToTopButton";
import CookieConsentBanner from "@/components/public/CookieConsentBanner";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <SocialFloatingButton />
      <BackToTopButton position="left" />
      <CookieConsentBanner />
    </>
  );
}
