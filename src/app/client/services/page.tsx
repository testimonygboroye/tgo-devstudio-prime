import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import ClientPortalNav from "@/components/client/ClientPortalNav";
import ClientCommercialHub from "@/components/client/ClientCommercialHub";
export const dynamic="force-dynamic";
export const metadata={title:"Services & Project Delivery | TGO DevStudio Client Portal"};
export default async function ClientServicesPage(){
 const session=await getServerSession();
 if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)redirect("/client/login");
 return <div className="min-h-screen bg-[#080d20] text-white"><ClientPortalNav name={session.user.name} email={session.user.email}/><main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">Commercial & delivery</p><h1 className="mt-2 text-3xl font-bold">Services & project delivery</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Explore our service catalogue, request a custom project, book a consultation and follow your orders, milestones and deliverables in one place.</p></div><ClientCommercialHub/></main></div>;
}
