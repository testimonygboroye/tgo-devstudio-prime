import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import MediaLibraryClient from "./MediaLibraryClient";

export default async function MediaLibraryPage() {
  const session = await getServerSession();
  if (!session!.role.isFounderRole && !session!.role.canManageUsers) {
    redirect(`${getAdminBasePath()}/dashboard`);
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Media Library</h1>
      <div className="mt-8">
        <MediaLibraryClient />
      </div>
    </div>
  );
}
