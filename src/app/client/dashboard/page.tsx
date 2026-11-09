import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, CircleHelp, FileText, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import ClientProfile from "@/models/ClientProfile";
import ClientEnquiry from "@/models/ClientEnquiry";
import ClientActivity from "@/models/ClientActivity";
import ClientPortalNav from "@/components/client/ClientPortalNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client Workspace | TGO DevStudio" };

export default async function ClientDashboardPage() {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client") redirect("/client/login");
  if (!session.user.isEmailVerified) redirect("/client/login?verification=required");
  await connectToDatabase();
  const [profile, enquiryCount, openEnquiries, recentActivity] = await Promise.all([
    ClientProfile.findOne({ userId: session.user._id }).lean(),
    ClientEnquiry.countDocuments({ clientId: session.user._id }),
    ClientEnquiry.countDocuments({ clientId: session.user._id, status: { $in: ["new", "in_review"] } }),
    ClientActivity.find({ clientId: session.user._id }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  const onboardingComplete = profile?.onboardingStatus === "completed";
  const stats = [
    { label: "Enquiries submitted", value: enquiryCount, icon: MessageSquareText, hint: "Your requests to our team" },
    { label: "Awaiting response", value: openEnquiries, icon: CircleHelp, hint: "Requests being handled" },
    { label: "Profile completion", value: profile?.phone && profile?.country && profile?.timezone ? "Ready" : "In progress", icon: CheckCircle2, hint: "Keep your contact details current" },
  ];
  return <div className="min-h-screen bg-[#080d20] text-white"><ClientPortalNav name={session.user.name} email={session.user.email}/><main className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 sm:py-10">
    <section className="relative overflow-hidden rounded-3xl border border-violet-300/15 bg-[radial-gradient(circle_at_85%_15%,rgba(34,211,238,.18),transparent_30%),linear-gradient(120deg,#17153a,#111a35_65%,#0e1b32)] p-6 sm:p-9"><div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl"/><div className="relative max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-200"><Sparkles size={13}/>Client workspace</span><h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Good to see you, {session.user.name.split(" ")[0]}.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Your TGO DevStudio relationship, requests and account details are brought together here. Use the workspace to keep your information current and reach our team.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/client/enquiries" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500">Contact your team<ArrowRight size={16}/></Link><Link href="/client/settings" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">Complete your profile</Link></div></div></section>
    <section className="grid gap-4 sm:grid-cols-3">{stats.map(({label,value,icon:Icon,hint})=><article key={label} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><div className="flex items-center justify-between"><p className="text-xs text-slate-400">{label}</p><span className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-200"><Icon size={18}/></span></div><p className="mt-4 text-3xl font-bold text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{hint}</p></article>)}</section>
    <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><article className="rounded-2xl border border-white/10 bg-white/[.04] p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[.16em] text-cyan-300">Account activity</p><h2 className="mt-1 text-lg font-bold">Recent updates</h2></div><Link href="/client/activity" className="text-xs text-cyan-300 hover:underline">View full history</Link></div><div className="mt-5 space-y-4">{recentActivity.length?recentActivity.map(item=><div key={String(item._id)} className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300"/><div className="min-w-0"><p className="text-sm text-slate-200">{item.summary}</p><p className="mt-1 text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</p></div></div>):<div className="rounded-xl border border-dashed border-white/15 p-6 text-center"><FileText className="mx-auto text-slate-500"/><p className="mt-2 text-sm font-semibold">Your activity will appear here</p><p className="mt-1 text-xs text-slate-500">Account updates and enquiries are recorded automatically.</p></div>}</div></article>
      <article className="rounded-2xl border border-white/10 bg-white/[.04] p-5 sm:p-6"><p className="text-xs uppercase tracking-[.16em] text-violet-300">Getting started</p><h2 className="mt-1 text-lg font-bold">Your client onboarding</h2><p className="mt-2 text-xs leading-5 text-slate-400">Complete your profile so our team can coordinate with you effectively.</p><div className="mt-5 space-y-3"><div className="flex items-center gap-3 rounded-xl bg-black/15 p-3"><span className="rounded-lg bg-emerald-400/10 p-2 text-emerald-300"><ShieldCheck size={16}/></span><span className="text-xs text-slate-200">Email verified</span><CheckCircle2 size={15} className="ml-auto text-emerald-300"/></div><div className="flex items-center gap-3 rounded-xl bg-black/15 p-3"><span className="rounded-lg bg-violet-400/10 p-2 text-violet-200"><BriefcaseBusiness size={16}/></span><span className="text-xs text-slate-200">Profile details</span><span className="ml-auto text-[10px] text-slate-400">{onboardingComplete?"Complete":"In progress"}</span></div></div><Link href="/client/settings" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 hover:underline">Continue onboarding<ArrowRight size={14}/></Link><p className="mt-5 border-t border-white/10 pt-4 text-[10px] leading-5 text-slate-500">Project workspaces, deliverables, invoices, payments and rewards will appear here when their respective platform modules are operational. They are not represented as active features yet.</p></article></section>
  </main></div>;
}
