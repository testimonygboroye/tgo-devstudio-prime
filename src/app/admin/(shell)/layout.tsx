import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import Visitor from "@/models/Visitor";
import PageView from "@/models/PageView";
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
  const visitorId = (await cookies()).get("tgo_visitor_id")?.value;
  if (session?.role?.isFounderRole && visitorId && /^[a-zA-Z0-9-]{12,80}$/.test(visitorId)) {
    await connectToDatabase();
    const marked = await Visitor.updateOne(
      { visitorId, isInternal: { $ne: true } },
      { $set: { isInternal: true } },
    );
    if (marked.modifiedCount > 0) {
      await PageView.updateMany({ visitorId }, { $set: { isInternal: true } });
    }
  }

  if (!session) {
    const headersList = await headers();
    const currentPath = headersList.get("x-current-path") || "";
    const redirectParam = currentPath
      ? `?redirect=${encodeURIComponent(currentPath)}`
      : "";

    redirect(`${basePath}/login${redirectParam}`);
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--bg-page)]">
      <AdminSidebar
        userName={session.user.name}
        userEmail={session.user.email}
        roleName={session.role.name}
        basePath={basePath}
      />

      <div
        id="admin-scroll-area"
        className="ml-16 flex-1 overflow-y-auto px-6 py-8 sm:px-10 md:ml-0"
      >
        <AdminTopBar />


        {children}

        <BackToTopButton
          scrollContainerId="admin-scroll-area"
          position="right"
        />
      </div>
    </div>
  );
}
