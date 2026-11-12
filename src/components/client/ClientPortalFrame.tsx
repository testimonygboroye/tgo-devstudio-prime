"use client";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import AIChatWidget from "@/components/shared/AIChatWidget";
export default function ClientPortalFrame({children}:{children:React.ReactNode}){
 const pathname=usePathname();
 const authPage=pathname==="/client"||pathname==="/client/login"||pathname==="/client/register"||pathname==="/client/verify-email";
 return <>{authPage&&<SiteHeader/>}{children}<SiteFooter/>{!authPage&&<AIChatWidget scope="client"/>}</>;
}
