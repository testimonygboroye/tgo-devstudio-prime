import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import ExecutiveIntelligence from "@/components/admin/platform/ExecutiveIntelligence";
export const dynamic = "force-dynamic";
export default async function ExecutiveIntelligencePage() {
  const session = await getServerSession();
  const basePath = getAdminBasePath();
  if (!session) redirect(basePath + "/login");
  if (!session.role.isFounderRole) redirect(basePath + "/dashboard");
  return <main className="mx-auto max-w-7xl pb-12"><ExecutiveIntelligence/></main>;
}
