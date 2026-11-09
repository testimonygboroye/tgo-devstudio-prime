import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import ClientPortalNav from "@/components/client/ClientPortalNav";
import ClientNotifications from "@/components/client/ClientNotifications";

export default async function ClientNotificationsPage() {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client" || !session.user.isEmailVerified) redirect("/client/login");
  return <div className="min-h-screen bg-[#080d20] text-white"><ClientPortalNav name={session.user.name} email={session.user.email}/><main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">Updates</p><h1 className="mt-2 text-3xl font-bold">Notifications</h1><p className="mt-2 text-sm text-slate-400">Account and service updates, delivered in one place.</p></div><ClientNotifications/></main></div>;
}
