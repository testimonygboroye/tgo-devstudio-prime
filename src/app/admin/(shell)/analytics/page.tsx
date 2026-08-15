import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const session = await getServerSession();
  if (!session!.role.isFounderRole) {
    redirect(`${getAdminBasePath()}/dashboard`);
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Admin</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Visitor Analytics</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Public site traffic — page views, devices, and referrers. Visible only to the Founder.
      </p>
      <div className="mt-8">
        <AnalyticsClient />
      </div>
    </div>
  );
}
