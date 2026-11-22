"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import SocialFloatingButton from "@/components/public/SocialFloatingButton";
import AIChatWidget from "@/components/shared/AIChatWidget";
import PublicMediaPlacement from "@/components/public/PublicMediaPlacement";

export default function ClientPortalFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const authPage = pathname === "/client" || pathname.startsWith("/client/login") || pathname.startsWith("/client/register") || pathname.startsWith("/client/verify-email");
  return <>
    {authPage && <SiteHeader />}
    {children}
    {pathname === "/client/dashboard" && <PublicMediaPlacement placement="client-partners" />}
    <SiteFooter />
    <SocialFloatingButton />
    <AIChatWidget scope="client" showLauncher={false} />
  </>;
}
