import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import ClientProfile from "@/models/ClientProfile";
import ClientPortalNav from "@/components/client/ClientPortalNav";
import ClientProfileSettings from "@/components/client/ClientProfileSettings";
import ClientSecuritySettings from "@/components/client/ClientSecuritySettings";

export const dynamic = "force-dynamic";
export default async function ClientSettingsPage() {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client" || !session.user.isEmailVerified) redirect("/client/login");
  await connectToDatabase();
  const profile = await ClientProfile.findOne({ userId: session.user._id }).populate("organizationId", "name").lean();
  if (!profile) redirect("/client/dashboard");
  const organizationName = profile.organizationId && typeof profile.organizationId === "object" && "name" in profile.organizationId ? String(profile.organizationId.name) : "Personal client account";
  return <div className="min-h-screen bg-[#080d20] text-white"><ClientPortalNav name={session.user.name} email={session.user.email}/><main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">Your account</p><h1 className="mt-2 text-3xl font-bold">Account settings</h1><p className="mt-2 text-sm text-slate-400">Manage your personal details and contact information.</p></div><ClientProfileSettings initialProfile={{name:session.user.name,phone:profile.phone||"",jobTitle:profile.jobTitle||"",website:profile.website||"",country:profile.country||"",timezone:profile.timezone||""}} name={session.user.name} email={session.user.email} verified={session.user.isEmailVerified} organizationName={organizationName}/></main></div>;
}
