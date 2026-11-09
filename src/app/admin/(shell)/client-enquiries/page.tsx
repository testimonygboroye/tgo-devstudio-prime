import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import { connectToDatabase } from "@/lib/db";
import ClientEnquiry from "@/models/ClientEnquiry";
import ClientEnquiryManager from "@/components/admin/platform/ClientEnquiryManager";

export const dynamic = "force-dynamic";
export default async function ClientEnquiriesAdminPage() {
 const session=await getServerSession();if(!session)redirect(`${getAdminBasePath()}/login`);if(!session.role.isFounderRole)redirect(`${getAdminBasePath()}/dashboard`);
 await connectToDatabase();const enquiries=await ClientEnquiry.find({}).populate("clientId","name email").sort({createdAt:-1}).limit(250).lean();
 const initial=enquiries.map(item=>{const client=item.clientId&&typeof item.clientId==="object"&&"email" in item.clientId?item.clientId as unknown as {_id:unknown;name:string;email:string}:null;return{id:String(item._id),clientId:client?String(client._id):String(item.clientId),clientName:client?.name||"Client",clientEmail:client?.email||"",subject:item.subject,message:item.message,category:item.category,status:item.status,priority:item.priority,assignedTo:item.assignedTo?String(item.assignedTo):"",assigneeName:"",createdAt:item.createdAt.toISOString(),updatedAt:item.updatedAt.toISOString()};});
 return <div className="mx-auto max-w-7xl space-y-6 pb-12"><section className="rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_85%_10%,rgba(46,197,240,.15),transparent_30%),linear-gradient(125deg,#111735,#17133a_52%,#101b35)] p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-200">Client relationships · Operations</p><h1 className="mt-3 text-3xl font-bold text-white">Client enquiries</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Review incoming client requests, manage their status and priority, and keep the client informed through in-portal notifications.</p></section><ClientEnquiryManager initialEnquiries={initial}/></div>;
}
