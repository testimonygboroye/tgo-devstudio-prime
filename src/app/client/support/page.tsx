import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import ClientPortalNav from "@/components/client/ClientPortalNav";
import SupportTicketPortal from "@/components/client/SupportTicketPortal";
export const dynamic="force-dynamic";
export const metadata={title:"Customer Support | TGO DevStudio",robots:{index:false,follow:false}};
export default async function ClientSupportPage(){
 const session=await getServerSession();
 if(!session||session.user.accountType!=="client")redirect("/client/login");
 if(!session.user.isEmailVerified)redirect("/client/login?verification=required");
 return <div className="min-h-screen bg-[#080d20]"><ClientPortalNav name={session.user.name} email={session.user.email}/><SupportTicketPortal/></div>;
}
