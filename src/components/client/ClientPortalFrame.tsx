"use client";
import {usePathname} from "next/navigation";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import SocialFloatingButton from "@/components/public/SocialFloatingButton";
import AIChatWidget from "@/components/shared/AIChatWidget";
import {NotificationBell} from "@/components/shared/NotificationCentre";
export default function ClientPortalFrame({children}:{children:React.ReactNode}){
 const pathname=usePathname();
 const authPage=pathname==="/client"||pathname.startsWith("/client/login")||pathname.startsWith("/client/register")||pathname.startsWith("/client/verify-email");
 return <>{authPage&&<SiteHeader/>}{children}{!authPage&&<NotificationBell href="/client/notifications"/>}<SiteFooter/><SocialFloatingButton/><AIChatWidget scope="client" showLauncher={false}/></>;
}
