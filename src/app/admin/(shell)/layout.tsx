import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";
import BackToTopButton from "@/components/shared/BackToTopButton";

export default async function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const basePath = getAdminBasePath();

  if (!session) {
    redirect(`${basePath}/login`);
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <AdminSidebar
        userName={session.user.name}
        userEmail={session.user.email}
        roleName={session.role.name}
      />
      <div id="admin-scroll-area" className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
        <AdminTopBar />
        {children}
        <BackToTopButton scrollContainerId="admin-scroll-area" position="right" />
      </div>
    </div>
  );
}
