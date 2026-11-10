import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import ClientProfile from "@/models/ClientProfile";
import User from "@/models/User";
import ClientPortalNav from "@/components/client/ClientPortalNav";
import ClientProfileSettings from "@/components/client/ClientProfileSettings";
import ClientSecuritySettings from "@/components/client/ClientSecuritySettings";

export const dynamic = "force-dynamic";
export default async function ClientSettingsPage() {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client" || !session.user.isEmailVerified) redirect("/client/login");
  await connectToDatabase();
  const [profile,account] = await Promise.all([
    ClientProfile.findOne({ userId: session.user._id }).populate("organizationId", "name").lean(),
    User.findById(session.user._id).select("firstName middleName lastName authProviders").lean(),
  ]);
  if (!profile) redirect("/client/dashboard");
  const parts=session.user.name.trim().split(/\s+/);
  const firstName=account?.firstName||parts[0]||"";
  const lastName=account?.lastName||(parts.length>1?parts[parts.length-1]:"");
  const middleName=account?.middleName||(parts.length>2?parts.slice(1,-1).join(" "):"");
  const organizationName = profile.organizationId && typeof profile.organizationId === "object" && "name" in profile.organizationId ? String(profile.organizationId.name) : "Personal client account";
  return <div className="min-h-screen bg-[#080d20] text-white"><ClientPortalNav name={session.user.name} email={session.user.email}/><main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">Your account</p><h1 className="mt-2 text-3xl font-bold">Account settings</h1><p className="mt-2 text-sm text-slate-400">Manage your personal details and contact information.</p></div><ClientProfileSettings initialProfile={{firstName,middleName,lastName,phone:profile.phone||"",jobTitle:profile.jobTitle||"",website:profile.website||"",country:profile.country||"",timezone:profile.timezone||""}} name={session.user.name} email={session.user.email} verified={session.user.isEmailVerified??false} organizationName={organizationName} phoneVerified={Boolean(profile.phoneVerifiedAt)}/><ClientSecuritySettings passwordEnabled={account?.authProviders?.includes("password")||false}/></main></div>;
}
