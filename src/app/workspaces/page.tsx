import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import ClientPortalNav from "@/components/client/ClientPortalNav";
import SiteFooter from "@/components/public/SiteFooter";
import WorkspacesClient from "@/components/workspaces/WorkspacesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Universal Workspaces | TGO DevStudio", robots: { index: false, follow: false, noarchive: true } };

export default async function UniversalWorkspacesPage() {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client") {
    redirect("/client/login?redirect=%2Fworkspaces");
  }
  if (!session.user.isEmailVerified) {
    redirect("/client/login?verification=required&redirect=%2Fworkspaces");
  }

  return (
    <div className="min-h-screen bg-[#080d20] text-white">
      <ClientPortalNav name={session.user.name} email={session.user.email} />
      <WorkspacesClient />
      <SiteFooter />
    </div>
  );
}
