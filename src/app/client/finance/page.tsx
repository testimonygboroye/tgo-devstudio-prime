import {redirect} from "next/navigation";
import {getServerSession} from "@/lib/auth/serverSession";
import ClientPortalNav from "@/components/client/ClientPortalNav";
import ClientFinanceCenter from "@/components/client/ClientFinanceCenter";

export const dynamic="force-dynamic";
export const metadata={title:"Invoices & Payments | TGO Client Workspace",robots:{index:false,follow:false,noarchive:true}};

export default async function ClientFinancePage(){
 const session=await getServerSession();
 if(!session||session.user.accountType!=="client")redirect("/client/login");
 if(!session.user.isEmailVerified)redirect("/client/login?verification=required");
 return <div className="min-h-screen bg-[#080d20] text-white"><ClientPortalNav name={session.user.name} email={session.user.email}/><main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6"><header className="rounded-3xl border border-violet-300/15 bg-gradient-to-br from-[#17153a] via-[#111a35] to-[#0e1b32] p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">Client account</p><h1 className="mt-2 text-3xl font-bold">Invoices & payments</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Review your invoices and payment history, pay an outstanding order through secure Paystack checkout, or submit an approved alternative payment.</p></header><ClientFinanceCenter/></main></div>;
}
