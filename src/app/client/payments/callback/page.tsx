import {redirect} from "next/navigation";
import {getServerSession} from "@/lib/auth/serverSession";
import ClientPortalNav from "@/components/client/ClientPortalNav";
import ClientPaymentCallback from "@/components/client/ClientPaymentCallback";
export const dynamic="force-dynamic";
export const metadata={title:"Payment Confirmation | TGO DevStudio"};
export default async function ClientPaymentCallbackPage({searchParams}:{searchParams:Promise<{reference?:string}>}){
 const session=await getServerSession();if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)redirect("/client/login");
 const params=await searchParams;
 return <div className="min-h-screen bg-[#080d20] text-white"><ClientPortalNav name={session.user.name} email={session.user.email}/><ClientPaymentCallback reference={params.reference||""}/></div>;
}
