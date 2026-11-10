import mongoose from "mongoose";
import {connectToDatabase} from "@/lib/db";
import PaymentTransaction from "@/models/PaymentTransaction";
import FinancialLedgerEntry from "@/models/FinancialLedgerEntry";
import {buildPaymentLedgerEntries} from "@/lib/finance/ledger";
import CommercialOrder from "@/models/CommercialOrder";
import DeliveryProject from "@/models/DeliveryProject";
import DeliveryMilestone from "@/models/DeliveryMilestone";
import {toMinorUnits} from "@/lib/payments/money";
import {getPaymentProvider} from "@/lib/payments/provider";
export async function verifyAndRecordPaystackPayment(reference:string){
 await connectToDatabase();
 const initial=await PaymentTransaction.findOne({reference});if(!initial)throw new Error("Payment reference was not found.");
 if(initial.status==="paid")return initial;
 const provider=getPaymentProvider("paystack");
 const data=await provider.verify(reference);
 if(data.status!=="success"||data.reference!==initial.reference||data.amountMinor!==initial.amountMinor||data.currency!==initial.currency)throw new Error("Payment verification failed: provider status, amount, currency or reference did not match the order.");
 const session=await mongoose.startSession();
 try{
  await session.withTransaction(async()=>{
   const payment=await PaymentTransaction.findOne({reference}).session(session);if(!payment)throw new Error("Payment reference was not found.");
   if(payment.status==="paid")return;
   payment.status="paid";payment.providerTransactionId=data.transactionId||"";payment.verifiedAt=new Date();await payment.save({session});
   if(payment.milestoneId){
    const project=await DeliveryProject.findOne({orderId:payment.orderId,clientId:payment.clientId}).session(session);
    if(!project)throw new Error("The delivery project is no longer linked to this order.");
    const milestone=await DeliveryMilestone.findOne({_id:payment.milestoneId,projectId:project._id}).session(session);
    if(!milestone)throw new Error("The paid milestone is no longer linked to this order.");
    milestone.paymentStatus="paid";if(milestone.qaStatus==="passed")milestone.status="awaiting_payment";await milestone.save({session});
    const paid=await PaymentTransaction.aggregate([{$match:{orderId:payment.orderId,status:"paid"}},{$group:{_id:null,total:{$sum:"$amountMinor"}}}]).session(session);
    const order=await CommercialOrder.findById(payment.orderId).session(session);
    if(!order)throw new Error("The paid order could not be found.");
    const totalPaid=Number(paid[0]?.total||0);order.paymentStatus=totalPaid>=toMinorUnits(order.amount,order.currency)?"paid":"partially_paid";order.paymentProviderReference=payment.reference;order.paymentVerifiedAt=new Date();if(order.paymentStatus==="paid")order.status="confirmed";await order.save({session});
   }else{
    const order=await CommercialOrder.findOne({_id:payment.orderId,clientId:payment.clientId}).session(session);
    if(!order)throw new Error("The paid order could not be found.");
    const paid=await PaymentTransaction.aggregate([{$match:{orderId:payment.orderId,status:"paid",milestoneId:{$exists:false}}},{$group:{_id:null,total:{$sum:"$amountMinor"}}}]).session(session);
    const totalPaid=Number(paid[0]?.total||0);
    order.paymentStatus=totalPaid>=toMinorUnits(order.amount,order.currency)?"paid":"partially_paid";
    if(order.paymentStatus==="paid")order.status="confirmed";
    order.paymentProviderReference=payment.reference;
    order.paymentVerifiedAt=new Date();
    await order.save({session});
   }
   const ledgerEntries=buildPaymentLedgerEntries({reference:payment.reference,paymentTransactionId:String(payment._id),orderId:String(payment.orderId),clientId:String(payment.clientId),amountMinor:payment.amountMinor,currency:payment.currency,providerTransactionId:payment.providerTransactionId});
   await FinancialLedgerEntry.insertMany(ledgerEntries as unknown as Parameters<typeof FinancialLedgerEntry.insertMany>[0],{session});
  });
 }finally{await session.endSession();}
 const verified=await PaymentTransaction.findOne({reference});if(!verified)throw new Error("Verified payment record was not found.");return verified;
}
