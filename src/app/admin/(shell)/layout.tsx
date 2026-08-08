import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import AdminSidebar from "@/components/admin/AdminSidebar";

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
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar
        userName={session.user.name}
        userEmail={session.user.email}
        roleName={session.role.name}
      />
      <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">{children}</div>
    </div>
  );
}
