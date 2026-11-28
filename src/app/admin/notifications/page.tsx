import {redirect} from "next/navigation";
import {getServerSession} from "@/lib/auth/serverSession";
import {getAdminBasePath} from "@/lib/adminPath";
import AdminShellLayout from "../(shell)/layout";
import NotificationCentre from "@/components/shared/NotificationCentre";
export const dynamic="force-dynamic";
export default async function AdminNotificationsPage(){const s=await getServerSession();if(!s||s.user.accountType==="client")redirect("/client/login");return <AdminShellLayout><NotificationCentre homeHref={getAdminBasePath()+"/dashboard"}/></AdminShellLayout>;}
