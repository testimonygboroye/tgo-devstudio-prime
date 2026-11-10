import { redirect } from "next/navigation";
import { LifeBuoy, ShieldAlert } from "lucide-react";
import { authorizePlatformPermission } from "@/lib/platform/authorize";
import { getAdminBasePath } from "@/lib/adminPath";
import SupportOperationsManager from "@/components/admin/platform/SupportOperationsManager";
import SupportSettingsPanel from "@/components/admin/platform/SupportSettingsPanel";
export const dynamic="force-dynamic";
export const metadata={title:"Customer Support Operations | TGO DevStudio"};
export default async function SupportOperationsPage(){
 const auth=await authorizePlatformPermission("support.view");
 if(!auth.session)redirect(getAdminBasePath()+"/login");
 if(!auth.allowed)return <main className="mx-auto max-w-3xl rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-8 text-center"><ShieldAlert className="mx-auto text-amber-300" size={30}/><h1 className="mt-4 text-2xl font-bold text-white">Support access restricted</h1><p className="mt-2 text-sm leading-6 text-slate-400">Your business role does not currently include permission to view support operations. Ask the founder to grant support.view.</p></main>;
 return <main className="space-y-6"><header><p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-cyan-300"><LifeBuoy size={14}/>Customer service desk</p><h1 className="mt-2 text-3xl font-bold brand-gradient-text">Support Operations</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">Manage client requests, monitor service-level deadlines, assign ownership, escalate issues and maintain a traceable conversation history.</p></header><SupportOperationsManager/><SupportSettingsPanel/></main>;
}
