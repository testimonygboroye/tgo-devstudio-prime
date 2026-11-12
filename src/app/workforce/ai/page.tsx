import { redirect } from "next/navigation";
import Link from "next/link";
import { Bot, ArrowLeft, BriefcaseBusiness } from "lucide-react";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import EmployeeProfile from "@/models/EmployeeProfile";
import StaffAICounterpart from "@/components/workforce/StaffAICounterpart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your AI Counterpart | TGO Workforce", robots: { index: false, follow: false, noarchive: true } };

export default async function WorkforceAICounterpartPage() {
  const session = await getServerSession();
  if (!session) redirect("/admin/login?redirect=%2Fworkforce%2Fai");
  if (session.user.accountType === "client") redirect("/client/dashboard");
  await connectToDatabase();
  const employee = await EmployeeProfile.findOne({
    userId: session.user._id,
    employmentStatus: "active",
    accessSuspendedByWorkforce: { $ne: true },
  }).select("_id").lean();
  if (!employee) redirect("/workforce");

  return <div className="min-h-screen bg-[#080d20] text-white">
    <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 pt-5 sm:px-8">
      <Link href="/workforce" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold text-slate-300"><ArrowLeft size={14}/>My workforce home</Link>
      <Link href="/workspaces" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold text-slate-300"><BriefcaseBusiness size={14}/>Team collaboration</Link>
      <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-200"><Bot size={14}/>AI counterpart</span>
    </div>
    <StaffAICounterpart/>
  </div>;
}
