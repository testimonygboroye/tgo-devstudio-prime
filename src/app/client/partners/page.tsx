import {redirect} from "next/navigation";
import {getServerSession} from "@/lib/auth/serverSession";
import ClientPortalNav from "@/components/client/ClientPortalNav";
import PublicMediaPlacement from "@/components/public/PublicMediaPlacement";
export const dynamic="force-dynamic";
export const metadata={title:"Recommended Tools & Partner Benefits | TGO DevStudio"};
export default async function ClientPartnerBenefitsPage(){
 const session=await getServerSession();
 if(!session||session.user.accountType!=="client")redirect("/client/login");
 if(!session.user.isEmailVerified)redirect("/client/login?verification=required");
 return <div className="min-h-screen bg-[#080d20] text-white"><ClientPortalNav name={session.user.name} email={session.user.email}/><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10"><div className="mb-8 rounded-3xl border border-cyan-300/15 bg-[radial-gradient(circle_at_85%_10%,rgba(34,211,238,.16),transparent_32%),linear-gradient(120deg,#151936,#0d1830)] p-6 sm:p-9"><p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">Curated for your work</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Recommended Tools & Partner Benefits</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Explore selected tools, trusted partner services and special benefits that may help you plan, build and grow. Recommendations are optional and never interrupt your workspace.</p></div><PublicMediaPlacement placement="client-partners" heading="Current partner offers" description="Optional recommendations curated by TGO DevStudio. You can dismiss this section at any time."/></main></div>;
}
