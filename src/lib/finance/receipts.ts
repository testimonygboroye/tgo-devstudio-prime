import {randomUUID} from "node:crypto";
import {Types, type ClientSession} from "mongoose";
import FinanceReceipt from "@/models/FinanceReceipt";

export async function ensureFinanceReceipt(payment:{
 _id:unknown;clientId:unknown;orderId:unknown;invoiceId?:unknown;amountMinor:number;currency:string;paymentMethod?:string;provider:string;reference:string;bankTransferReference?:string;
},session?:ClientSession){
 const paymentIdText=String(payment._id),clientIdText=String(payment.clientId),orderIdText=String(payment.orderId),invoiceIdText=payment.invoiceId==null?undefined:String(payment.invoiceId);
 if(!Types.ObjectId.isValid(paymentIdText)||!Types.ObjectId.isValid(clientIdText)||!Types.ObjectId.isValid(orderIdText)||(invoiceIdText!==undefined&&!Types.ObjectId.isValid(invoiceIdText)))throw new Error("Payment receipt contains an invalid record identifier.");
 const paymentTransactionId=new Types.ObjectId(paymentIdText),clientId=new Types.ObjectId(clientIdText),orderId=new Types.ObjectId(orderIdText),invoiceId=invoiceIdText?new Types.ObjectId(invoiceIdText):undefined;
 const query=FinanceReceipt.findOne({paymentTransactionId});
 if(session)query.session(session);
 const existing=await query;
 if(existing)return existing;
 const payload={
  receiptNumber:`TGO-RCP-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${randomUUID().slice(0,8).toUpperCase()}`,
  paymentTransactionId,clientId,orderId,invoiceId,
  amountMinor:payment.amountMinor,currency:payment.currency,paymentMethod:payment.paymentMethod||payment.provider,
  providerReference:payment.bankTransferReference||payment.reference,issuedAt:new Date(),
 };
 if(session){const created=await FinanceReceipt.create([payload],{session});return created[0];}
 return FinanceReceipt.create(payload);
}
