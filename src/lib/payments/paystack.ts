import mongoose from "mongoose";
import {connectToDatabase} from "@/lib/db";
import PaymentTransaction from "@/models/PaymentTransaction";
import FinancialLedgerEntry from "@/models/FinancialLedgerEntry";
import {buildPaymentLedgerEntries} from "@/lib/finance/ledger";
import CommercialOrder from "@/models/CommercialOrder";
import DeliveryProject from "@/models/DeliveryProject";
import DeliveryMilestone from "@/models/DeliveryMilestone";
export async function verifyAndRecordPaystackPayment(reference:string){
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)throw new Error("Paystack payment verification is not configured.");
 await connectToDatabase();
 const initial=await PaymentTransaction.findOne({reference});if(!initial)throw new Error("Payment reference was not found.");
 if(initial.status==="paid")return initial;
 const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${secret}`,"Content-Type":"application/json"},cache:"no-store"});
 const payload=await response.json() as {status?:boolean;message?:string;data?:{status?:string;amount?:number;currency?:string;id?:number;reference?:string}};
 if(!response.ok||!payload.status||!payload.data)throw new Error(payload.message||"Paystack could not verify this payment.");
 const data=payload.data;
 if(data.status!=="success"||data.reference!==initial.reference||Number(data.amount)!==initial.amountMinor||String(data.currency).toUpperCase()!==initial.currency)throw new Error("Payment verification failed: provider status, amount, currency or reference did not match the order.");
 const session=await mongoose.startSession();
 try{
  await session.withTransaction(async()=>{
   const payment=await PaymentTransaction.findOne({reference}).session(session);if(!payment)throw new Error("Payment reference was not found.");
   if(payment.status==="paid")return;
   payment.status="paid";payment.providerTransactionId=String(data.id||"");payment.verifiedAt=new Date();await payment.save({session});
   if(payment.milestoneId){
    const project=await DeliveryProject.findOne({orderId:payment.orderId,clientId:payment.clientId}).session(session);
    if(!project)throw new Error("The delivery project is no longer linked to this order.");
    const milestone=await DeliveryMilestone.findOne({_id:payment.milestoneId,projectId:project._id}).session(session);
    if(!milestone)throw new Error("The paid milestone is no longer linked to this order.");
    milestone.paymentStatus="paid";if(milestone.qaStatus==="passed")milestone.status="awaiting_payment";await milestone.save({session});
    const paid=await PaymentTransaction.aggregate([{$match:{orderId:payment.orderId,status:"paid"}},{$group:{_id:null,total:{$sum:"$amountMinor"}}}]).session(session);
    const order=await CommercialOrder.findById(payment.orderId).session(session);
    if(!order)throw new Error("The paid order could not be found.");
    const totalPaid=Number(paid[0]?.total||0);order.paymentStatus=totalPaid>=Math.round(order.amount*100)?"paid":"partially_paid";order.paymentProviderReference=payment.reference;order.paymentVerifiedAt=new Date();if(order.paymentStatus==="paid")order.status="confirmed";await order.save({session});
   }else{
    const order=await CommercialOrder.findOne({_id:payment.orderId,clientId:payment.clientId}).session(session);
    if(!order)throw new Error("The paid order could not be found.");
    order.paymentStatus="paid";order.status="confirmed";order.paymentProviderReference=payment.reference;order.paymentVerifiedAt=new Date();await order.save({session});
   }
   await FinancialLedgerEntry.create(buildPaymentLedgerEntries({reference:payment.reference,paymentTransactionId:payment._id,orderId:payment.orderId,clientId:payment.clientId,amountMinor:payment.amountMinor,currency:payment.currency,providerTransactionId:payment.providerTransactionId}),{session});
  });
 }finally{await session.endSession();}
 return PaymentTransaction.findOne({reference});
}
