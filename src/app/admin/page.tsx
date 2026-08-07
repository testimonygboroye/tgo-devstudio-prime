import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";

export default async function AdminRootPage() {
  const session = await getServerSession();
  const basePath = getAdminBasePath();

  if (session) {
    redirect(`${basePath}/dashboard`);
  }

  redirect(`${basePath}/login`);
}
