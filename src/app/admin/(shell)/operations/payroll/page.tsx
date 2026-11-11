import {redirect} from "next/navigation";
import {getServerSession} from "@/lib/auth/serverSession";
import {getAdminBasePath} from "@/lib/adminPath";
import PayrollManager from "@/components/admin/platform/PayrollManager";
export const dynamic="force-dynamic";
export const metadata={title:"Payroll & Compensation | TGO Admin"};
export default async function PayrollPage(){const session=await getServerSession();if(!session)redirect(getAdminBasePath()+"/login");if(!session.role.isFounderRole)redirect(getAdminBasePath()+"/dashboard");return <main className="mx-auto max-w-7xl space-y-6 pb-12"><header><p className="font-mono text-xs uppercase tracking-[.18em] text-brand-cyan-400">Phase 12 · People & finance</p><h1 className="mt-2 text-3xl font-bold brand-gradient-text sm:text-4xl">Payroll & Compensation</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">Configure payroll, compensation, allowances, deductions, approvals, payout exports and settlement records. All payroll controls are founder-only and audited.</p></header><PayrollManager/></main>;}
