import {redirect} from "next/navigation";
import {getServerSession} from "@/lib/auth/serverSession";
import ClientPortalNav from "@/components/client/ClientPortalNav";
import FinanceClient from "./FinanceClient";

export const dynamic="force-dynamic";
export const metadata={title:"Invoices & Payments | TGO Client Workspace",robots:{index:false,follow:false,noarchive:true}};

export default async function ClientFinancePage(){
 const session=await getServerSession();
 if(!session||session.user.accountType!=="client")redirect("/client/login");
 if(!session.user.isEmailVerified)redirect("/client/login?verification=required");
 return <><ClientPortalNav name={session.user.name} email={session.user.email}/><FinanceClient/></>;
}
