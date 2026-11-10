import { redirect } from "next/navigation";
import { Users, UserRoundCheck, UserRoundPlus, ShieldCheck } from "lucide-react";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import ClientProfile from "@/models/ClientProfile";
import ClientManagement from "@/components/admin/platform/ClientManagement";

export const dynamic = "force-dynamic";

export default async function ClientManagementPage() {
  const session = await getServerSession();
  if (!session) redirect(`${getAdminBasePath()}/login`);
  if (!session.role.isFounderRole) redirect(`${getAdminBasePath()}/dashboard`);
  await connectToDatabase();
  const [total, verified, active, completed, profiles, users] = await Promise.all([
    User.countDocuments({ accountType: "client" }),
    User.countDocuments({ accountType: "client", isEmailVerified: true }),
    ClientProfile.countDocuments({ lifecycle: "active" }),
    ClientProfile.countDocuments({ onboardingStatus: "completed" }),
    ClientProfile.find({}).sort({ createdAt: -1 }).limit(200).populate("organizationId", "name").lean(),
    User.find({ accountType: "client" }).select("_id name email isEmailVerified isBanned createdAt").sort({ createdAt: -1 }).limit(200).lean(),
  ]);
  const map = new Map(profiles.map(profile => [String(profile.userId), profile]));
  const initialClients = users.map(user => {
    const profile = map.get(String(user._id));
    const organization = profile?.organizationId && typeof profile.organizationId === "object" && "name" in profile.organizationId ? profile.organizationId as unknown as {_id:unknown;name:string} : null;
    return {
      id: String(user._id), name: user.name, email: user.email, emailVerified: user.isEmailVerified ?? false,
      suspended: user.isBanned, createdAt: user.createdAt.toISOString(), lifecycle: profile?.lifecycle || "onboarding",
      segments: profile?.segments || [], onboardingStatus: profile?.onboardingStatus || "not_started",
      organization: organization ? { id: String(organization._id), name: organization.name } : null,
      phone: profile?.phone || "", country: profile?.country || "",
    };
  });
  const initialOrganizations = await (await import("@/models/BusinessOrganization")).default.find({type:"client",status:"active"}).select("name").sort({name:1}).lean();
  const metrics = [{label:"Client accounts",value:total,icon:Users},{label:"Verified identities",value:verified,icon:ShieldCheck},{label:"Active relationships",value:active,icon:UserRoundCheck},{label:"Completed onboarding",value:completed,icon:UserRoundPlus}];
  return <div className="mx-auto max-w-7xl space-y-7 pb-12"><section className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_85%_10%,rgba(46,197,240,.16),transparent_30%),linear-gradient(125deg,#111735,#17133a_52%,#101b35)] p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-200">Phase 04 · Client relationships</p><h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Client management</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Manage client identities, lifecycle, onboarding, organization relationships and segmentation from one administrative directory. Changes are recorded in the platform audit trail.</p></section><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({label,value,icon:Icon})=><article key={label} className="surface-card rounded-2xl border border-[var(--border-subtle)] p-5"><div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">{label}<Icon size={18} className="text-cyan-400"/></div><p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">{value}</p></article>)}</section><ClientManagement initialClients={initialClients} initialOrganizations={initialOrganizations.map(item=>({id:String(item._id),name:item.name}))}/></div>;
}
