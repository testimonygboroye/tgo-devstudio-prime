import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import Link from "next/link";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const session = await getServerSession();
  if (!session) {
    redirect(`${getAdminBasePath()}/login`);
  }
  if (!session.role.isFounderRole) {
    redirect(`${getAdminBasePath()}/dashboard`);
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Admin</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Visitor Analytics</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Public site traffic — page views, devices, and referrers. Visible only to the Founder.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`${getAdminBasePath()}/analytics/conversions`} className="inline-flex items-center gap-2 rounded-xl border border-brand-cyan-400/30 bg-brand-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-brand-cyan-300 transition-colors hover:bg-brand-cyan-400/15">
          Open Conversion Insights <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="mt-8">
        <AnalyticsClient />
      </div>
    </div>
  );
}
