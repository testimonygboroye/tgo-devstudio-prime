import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import CommercialOperationsManager from "@/components/admin/platform/CommercialOperationsManager";
export const metadata={title:"Sales & Delivery Operations | TGO Admin"};
export const dynamic="force-dynamic";
export default async function CommercialOperationsPage(){
 const session=await getServerSession();
 if(!session)redirect(`${getAdminBasePath()}/login`);
 if(!session.role?.isFounderRole)redirect(`${getAdminBasePath()}/dashboard`);
 return <div className="space-y-6"><div><p className="font-mono text-xs uppercase tracking-[.18em] text-brand-cyan-400">Business operations · Phase 7</p><h1 className="mt-2 text-3xl font-bold brand-gradient-text sm:text-4xl">Sales & Delivery Operations</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">Manage the commercial lifecycle from service catalogue and sales pipeline through proposals, quotations, contracts, orders, project delivery, quality assurance and maintenance.</p></div><CommercialOperationsManager/></div>;
}
