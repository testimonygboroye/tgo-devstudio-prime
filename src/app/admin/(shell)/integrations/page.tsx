import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import IntegrationCentre from "@/components/admin/platform/IntegrationCentre";
import WebhookManager from "@/components/admin/platform/WebhookManager";
import DevelopmentIntegrationPanel from "@/components/admin/platform/DevelopmentIntegrationPanel";
export const dynamic = "force-dynamic";
export default async function IntegrationsPage() {
  const session = await getServerSession();
  if (!session) redirect(`${getAdminBasePath()}/login`);
  if (!session.role.isFounderRole) redirect(`${getAdminBasePath()}/dashboard`);
  return <main className="mx-auto max-w-7xl space-y-6 pb-12"><IntegrationCentre /><DevelopmentIntegrationPanel /><WebhookManager /></main>;
}
