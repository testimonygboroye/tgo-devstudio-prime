import {notFound,redirect} from "next/navigation";
import {Types} from "mongoose";
import {getServerSession} from "@/lib/auth/serverSession";
import {connectToDatabase} from "@/lib/db";
import FinanceReceipt from "@/models/FinanceReceipt";
import CommercialOrder from "@/models/CommercialOrder";
import PrintReceiptButton from "@/components/client/PrintReceiptButton";
export const dynamic="force-dynamic";
export const metadata={title:"Payment Receipt | TGO DevStudio"};
export default async function ClientReceiptPage({params}:{params:Promise<{id:string}>}){
 const session=await getServerSession();if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)redirect("/client/login");
 const {id}=await params;if(!Types.ObjectId.isValid(id))notFound();
 await connectToDatabase();
 const receipt=await FinanceReceipt.findOne({_id:id,clientId:session.user._id}).lean();if(!receipt)notFound();
 const order=await CommercialOrder.findOne({_id:receipt.orderId,clientId:session.user._id}).select("title reference").lean();
 const amount=Number(receipt.amountMinor)/100;
 return <main className="min-h-screen bg-[#080d20] px-4 py-10 text-white sm:px-6"><div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#101a36] p-6 shadow-2xl sm:p-10 print:border-0 print:bg-white print:text-black print:shadow-none"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300 print:text-slate-500">TGO DevStudio</p><h1 className="mt-2 text-3xl font-bold">Payment receipt</h1><p className="mt-2 text-sm text-slate-400 print:text-slate-600">Official acknowledgement of a verified payment.</p></div><PrintReceiptButton/></div><div className="mt-8 rounded-2xl border border-emerald-300/20 bg-emerald-300/[.06] p-5 print:border-slate-200 print:bg-slate-50"><p className="text-xs uppercase tracking-wider text-emerald-300 print:text-emerald-700">Payment received</p><p className="mt-2 text-3xl font-bold">{receipt.currency} {amount.toLocaleString(undefined,{minimumFractionDigits:receipt.currency==="XOF"?0:2,maximumFractionDigits:receipt.currency==="XOF"?0:2})}</p></div><dl className="mt-8 grid gap-4 sm:grid-cols-2">{[["Receipt number",receipt.receiptNumber],["Date issued",new Date(receipt.issuedAt).toLocaleString()],["Client",session.user.name],["Client email",session.user.email],["Order",order?.title||"Commercial order"],["Order reference",order?.reference||"—"],["Payment method",receipt.paymentMethod.replaceAll("_"," ")],["Transaction reference",receipt.providerReference]].map(([label,value])=><div key={label} className="border-b border-white/10 pb-3 print:border-slate-200"><dt className="text-[10px] uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-1 break-all text-sm font-medium">{value}</dd></div>)}</dl><p className="mt-8 text-xs leading-5 text-slate-400 print:text-slate-600">This receipt confirms that TGO DevStudio recorded and verified the payment shown above. Keep this document for your records. Refunds, if any, are recorded separately.</p></div></main>;
}
