import {redirect} from "next/navigation";
import {getServerSession} from "@/lib/auth/serverSession";
import ClientPortalNav from "@/components/client/ClientPortalNav";
import NotificationCentre from "@/components/shared/NotificationCentre";
export const dynamic="force-dynamic";
export default async function ClientNotificationsPage(){const session=await getServerSession();if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)redirect("/client/login");return <div className="min-h-screen bg-[#080d20] text-white"><ClientPortalNav name={session.user.name} email={session.user.email}/><NotificationCentre homeHref="/client/dashboard"/></div>;}
