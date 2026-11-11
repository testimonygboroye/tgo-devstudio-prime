import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import ClientPortalNav from "@/components/client/ClientPortalNav";
import RewardsDashboard from "@/components/client/RewardsDashboard";
export const dynamic = "force-dynamic";
export const metadata = { title: "Rewards & Referrals | TGO DevStudio" };
export default async function ClientRewardsPage() {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client") redirect("/client/login");
  if (!session.user.isEmailVerified) redirect("/client/login?verification=required");
  return <div className="min-h-screen bg-[#080d20] text-white"><ClientPortalNav name={session.user.name} email={session.user.email}/><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><div className="mb-7"><p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">TGO loyalty programme</p><h1 className="mt-2 text-3xl font-bold">Rewards & referrals</h1><p className="mt-2 max-w-2xl text-sm text-slate-400">Earn points through meaningful engagement, move through loyalty tiers and redeem available rewards.</p></div><RewardsDashboard/></main></div>;
}
