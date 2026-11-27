import type { Metadata } from "next";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import { NotificationBell } from "@/components/shared/NotificationCentre";
export const metadata: Metadata = { manifest: "/api/manifest-admin" };
export default async function AdminRootLayout({children}:{children:React.ReactNode}) {
 const session=await getServerSession();
 return <>{children}{session&&session.user.accountType!=="client"&&<NotificationBell href={getAdminBasePath()+"/notifications"}/>}</>;
}
