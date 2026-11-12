import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import ClientPortalNav from "@/components/client/ClientPortalNav";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import WorkspacesClient from "@/components/workspaces/WorkspacesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Universal Workspaces | TGO DevStudio", robots: { index: false, follow: false, noarchive: true } };

export default async function UniversalWorkspacesPage() {
  const session = await getServerSession();
  if (!session) redirect("/client/login?redirect=%2Fworkspaces");

  const isClient = session.user.accountType === "client";
  if (isClient && !session.user.isEmailVerified) {
    redirect("/client/login?verification=required&redirect=%2Fworkspaces");
  }

  return (
    <div className="min-h-screen bg-[#080d20] text-white">
      {isClient
        ? <ClientPortalNav name={session.user.name} email={session.user.email} />
        : <SiteHeader />}
      <WorkspacesClient />
      <SiteFooter />
    </div>
  );
}
