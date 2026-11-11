import {redirect} from "next/navigation";
import {ClipboardList,ShieldCheck,Workflow,FileCheck2} from "lucide-react";
import {getServerSession} from "@/lib/auth/serverSession";
import {getAdminBasePath} from "@/lib/adminPath";
import {connectToDatabase} from "@/lib/db";
import BusinessOperation from "@/models/BusinessOperation";
import BusinessOperationsManager from "@/components/admin/platform/BusinessOperationsManager";
export const dynamic="force-dynamic";
export default async function BusinessOperationsPage(){
 const session=await getServerSession(),basePath=getAdminBasePath();
 if(!session)redirect(basePath+"/login");
 if(!session.role.isFounderRole)redirect(basePath+"/dashboard");
 await connectToDatabase();
 const [total,approvals,active,overdue]=await Promise.all([
  BusinessOperation.countDocuments({status:{$ne:"archived"}}),
  BusinessOperation.countDocuments({status:"pending_approval"}),
  BusinessOperation.countDocuments({status:{$in:["active","in_progress","approved","connected"]}}),
  BusinessOperation.countDocuments({dueDate:{$lt:new Date()},status:{$nin:["completed","archived","rejected","expired"]}})
 ]);
 const metrics=[{label:"Operational records",value:total,icon:ClipboardList},{label:"Awaiting approval",value:approvals,icon:ShieldCheck},{label:"Active operations",value:active,icon:Workflow},{label:"Past due",value:overdue,icon:FileCheck2}];
 return <main className="mx-auto max-w-7xl space-y-7 pb-12">
  <section className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_85%_10%,rgba(46,197,240,.2),transparent_30%),linear-gradient(125deg,#10162f,#211647_55%,#101b35)] p-6 sm:p-8">
   <div className="relative max-w-3xl"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-cyan-200">Phase 12 · Business operations</span><h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Business Operations & Administration</h1><p className="mt-3 text-sm leading-6 text-slate-300">A governed operations workspace for hiring, contracts, training, procurement, suppliers, company assets, policies, compliance, records, calendars, approvals and internal workflows. Records connect to shared workforce identities and the platform audit trail.</p></div>
  </section>
  <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(x=><article key={x.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"><div className="flex items-center justify-between"><span className="text-xs text-[var(--text-secondary)]">{x.label}</span><x.icon size={18} className="text-cyan-400"/></div><p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{x.value.toLocaleString("en")}</p></article>)}</section>
  <BusinessOperationsManager/>
 </main>;
}
