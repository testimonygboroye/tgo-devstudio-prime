import {randomUUID} from "node:crypto";
import type {ClientSession} from "mongoose";
import FinanceReceipt from "@/models/FinanceReceipt";

export async function ensureFinanceReceipt(payment:{
 _id:unknown;clientId:unknown;orderId:unknown;invoiceId?:unknown;amountMinor:number;currency:string;paymentMethod?:string;provider:string;reference:string;
},session?:ClientSession){
 const query=FinanceReceipt.findOne({paymentTransactionId:payment._id});
 if(session)query.session(session);
 const existing=await query;
 if(existing)return existing;
 const payload={
  receiptNumber:`TGO-RCP-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${randomUUID().slice(0,8).toUpperCase()}`,
  paymentTransactionId:payment._id,clientId:payment.clientId,orderId:payment.orderId,invoiceId:payment.invoiceId,
  amountMinor:payment.amountMinor,currency:payment.currency,paymentMethod:payment.paymentMethod||payment.provider,
  providerReference:payment.reference,issuedAt:new Date(),
 };
 if(session){const created=await FinanceReceipt.create([payload],{session});return created[0];}
 return FinanceReceipt.create(payload);
}
