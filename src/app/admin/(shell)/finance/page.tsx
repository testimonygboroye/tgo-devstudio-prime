import {redirect} from "next/navigation";
import {getServerSession} from "@/lib/auth/serverSession";
import {getAdminBasePath} from "@/lib/adminPath";
import FinanceOperationsManager from "@/components/admin/platform/FinanceOperationsManager";
export const dynamic="force-dynamic";
export const metadata={title:"Finance & Payments | TGO Admin"};
export default async function FinancePage(){
 const session=await getServerSession();
 if(!session)redirect(`${getAdminBasePath()}/login`);
 if(!session.role?.isFounderRole)redirect(`${getAdminBasePath()}/dashboard`);
 return <div className="space-y-6"><div><p className="font-mono text-xs uppercase tracking-[.18em] text-brand-cyan-400">Business operations · Phase 8</p><h1 className="mt-2 text-3xl font-bold brand-gradient-text sm:text-4xl">Finance & Payments</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">Configure payment methods, issue invoices, reconcile verified payments, manage client credits, review expenses and refunds, and inspect the immutable financial ledger.</p></div><FinanceOperationsManager/></div>;
}
