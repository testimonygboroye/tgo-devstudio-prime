import {randomUUID} from "node:crypto";
import {Types, type ClientSession} from "mongoose";
import FinanceReceipt from "@/models/FinanceReceipt";

export async function ensureFinanceReceipt(payment:{
 _id:unknown;clientId:unknown;orderId:unknown;invoiceId?:unknown;amountMinor:number;currency:string;paymentMethod?:string;provider:string;reference:string;bankTransferReference?:string;
},session?:ClientSession){
 if(!Types.ObjectId.isValid(payment._id)||!Types.ObjectId.isValid(payment.clientId)||!Types.ObjectId.isValid(payment.orderId)||(payment.invoiceId!==undefined&&!Types.ObjectId.isValid(payment.invoiceId)))throw new Error("Payment receipt contains an invalid record identifier.");
 const paymentTransactionId=new Types.ObjectId(String(payment._id)),clientId=new Types.ObjectId(String(payment.clientId)),orderId=new Types.ObjectId(String(payment.orderId)),invoiceId=payment.invoiceId===undefined?undefined:new Types.ObjectId(String(payment.invoiceId));
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
