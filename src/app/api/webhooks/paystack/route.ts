import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import {verifyPaystackWebhookSignature} from "@/lib/payments/paystack-webhook";
import {verifyAndRecordPaystackPayment} from "@/lib/payments/paystack";
import {buildRefundLedgerEntries} from "@/lib/finance/ledger";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
import FinanceRefund from "@/models/FinanceRefund";
import PaymentTransaction from "@/models/PaymentTransaction";
import FinancialLedgerEntry from "@/models/FinancialLedgerEntry";
import CommercialOrder from "@/models/CommercialOrder";
import FinanceInvoice from "@/models/FinanceInvoice";

import {connectToDatabase} from "@/lib/db";
import {getVerifiedIntegrationCredentials} from "@/lib/integrations/credentials";
import {awardEngagementPoints} from "@/lib/engagement/award";
import {EngagementRedemption} from "@/models/Engagement";
export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function POST(request:NextRequest){
 const rawBody=Buffer.from(await request.arrayBuffer());
 const integrationCredentials=process.env.PAYSTACK_SECRET_KEY?null:await getVerifiedIntegrationCredentials("paystack").catch(()=>null);
 const verified=verifyPaystackWebhookSignature({
  rawBody,signatureHeader:request.headers.get("paystack-signature"),
  legacySignatureHeader:request.headers.get("x-paystack-signature"),
  webhookSecret:process.env.PAYSTACK_WEBHOOK_SECRET,
  secretKey:process.env.PAYSTACK_SECRET_KEY||integrationCredentials?.secretKey,
 });
 if(!verified)return NextResponse.json({error:"Invalid or expired Paystack webhook signature."},{status:401});
 let event:unknown;try{event=JSON.parse(rawBody.toString("utf8"));}catch{return NextResponse.json({error:"Invalid webhook payload."},{status:400});}
 if(!event||typeof event!=="object"||Array.isArray(event))return NextResponse.json({error:"Invalid webhook payload."},{status:400});
 const payload=event as Record<string,unknown>;
 if(payload.event==="ping")return NextResponse.json({received:true,ping:true});
 const data=payload.data&&typeof payload.data==="object"&&!Array.isArray(payload.data)?payload.data as Record<string,unknown>:{};
 if(payload.event==="charge.failed"){
  await connectToDatabase();
  const failedReference=String(data.reference||"");
  if(!failedReference)return NextResponse.json({error:"Failed charge event is missing its reference."},{status:400});
  const payment=await PaymentTransaction.findOne({reference:failedReference,status:"pending"});
  if(payment){
   payment.status="failed";payment.failureReason=String(data.gateway_response||"Paystack reported a failed charge.").slice(0,1000);await payment.save();
   if(payment.couponCode)await EngagementRedemption.updateOne({couponCode:payment.couponCode,couponStatus:"reserved",couponPaymentReference:failedReference},{$set:{couponStatus:"issued"},$unset:{couponPaymentReference:1}});
   await writePlatformAuditEvent({actorType:"system",actorId:"paystack-webhook",actorLabel:"Paystack failed charge webhook",action:"commerce.payment_failed",module:"finance",targetType:"payment_transaction",targetId:String(payment._id),outcome:"failure",metadata:{reference:failedReference}});
  }
  return NextResponse.json({received:true,processed:Boolean(payment)});
 }
 if(["refund.processed","refund.failed","refund.pending","refund.processing"].includes(String(payload.event))){
  await connectToDatabase();
  const providerRefundId=String(data.id||"");if(!providerRefundId)return NextResponse.json({error:"Refund event is missing its provider refund id."},{status:400});
  const refund=await FinanceRefund.findOne({providerReference:providerRefundId});if(!refund)return NextResponse.json({received:true,ignored:true,reason:"Refund is not managed by this finance workspace."});
  if(payload.event==="refund.failed"){
   refund.status="failed";refund.failureReason=String(data.failure_reason||data.message||"Paystack reported that the refund failed.");await refund.save();
   await writePlatformAuditEvent({actorType:"system",actorId:"paystack-webhook",actorLabel:"Paystack refund webhook",action:"finance.refund_failed",module:"finance",targetType:"finance_refund",targetId:String(refund._id),outcome:"failure",metadata:{reference:refund.reference,providerRefundId}});
   return NextResponse.json({received:true,processed:true});
  }
  if(payload.event==="refund.pending"||payload.event==="refund.processing"){
   refund.status="processing";await refund.save();return NextResponse.json({received:true,processed:true});
  }
  const dbSession=await mongoose.startSession();
  try{
   await dbSession.withTransaction(async()=>{
    const current=await FinanceRefund.findById(refund._id).session(dbSession);if(!current)throw new Error("Refund record disappeared.");
    if(current.status==="processed")return;
    const payment=await PaymentTransaction.findById(current.paymentTransactionId).session(dbSession);if(!payment)throw new Error("Original payment record was not found.");
    current.status="processed";current.processedAt=new Date();await current.save({session:dbSession});
    payment.refundAmountMinor=Number(payment.refundAmountMinor||0)+current.amountMinor;
    payment.status=payment.refundAmountMinor>=payment.amountMinor?"refunded":"partially_refunded";await payment.save({session:dbSession});
    const entries=buildRefundLedgerEntries({reference:current.reference,refundId:String(current._id),paymentTransactionId:String(payment._id),orderId:String(payment.orderId),clientId:String(payment.clientId),amountMinor:current.amountMinor,currency:current.currency});
    await FinancialLedgerEntry.insertMany(entries as Parameters<typeof FinancialLedgerEntry.insertMany>[0],{session:dbSession});
    const order=await CommercialOrder.findById(payment.orderId).session(dbSession);
    if(order){
     const totals=await PaymentTransaction.aggregate([{$match:{orderId:order._id,status:{$in:["paid","partially_refunded","refunded"]}}},{$group:{_id:null,captured:{$sum:"$amountMinor"},refunded:{$sum:"$refundAmountMinor"}}}]).session(dbSession);
     const captured=Number(totals[0]?.captured||0);const refunded=Number(totals[0]?.refunded||0);
     order.paymentStatus=refunded>=captured&&captured>0?"refunded":refunded>0?"partially_paid":order.paymentStatus;await order.save({session:dbSession});
     const invoice=await FinanceInvoice.findOne({orderId:order._id,clientId:payment.clientId,status:{$nin:["draft","void"]}}).session(dbSession);
     if(invoice){invoice.amountPaidMinor=Math.max(0,Math.min(invoice.totalMinor,captured-refunded));invoice.balanceMinor=Math.max(0,invoice.totalMinor-invoice.amountPaidMinor);invoice.status=invoice.amountPaidMinor===0?"issued":invoice.balanceMinor===0?"paid":"partially_paid";await invoice.save({session:dbSession});}
    }
   });
  }finally{await dbSession.endSession();}
  await writePlatformAuditEvent({actorType:"system",actorId:"paystack-webhook",actorLabel:"Paystack refund webhook",action:"finance.refund_processed",module:"finance",targetType:"finance_refund",targetId:String(refund._id),outcome:"success",metadata:{reference:refund.reference,providerRefundId}});
  return NextResponse.json({received:true,processed:true});
 }
 if(payload.event!=="charge.success")return NextResponse.json({received:true,ignored:true});
 const reference=String(data.reference||"");
 if(!/^TGO_[A-Z0-9]{24}$/.test(reference))return NextResponse.json({error:"Unknown payment reference."},{status:400});
 try{
  const payment=await verifyAndRecordPaystackPayment(reference);if(!payment)throw new Error("Verified payment record was not found.");
  if(payment.clientId){await awardEngagementPoints({clientId:String(payment.clientId),eventKey:"payment-verified:"+String(payment._id),eventType:"payment_verified",metadata:{paymentTransactionId:String(payment._id),reference}});}
  if((payment as unknown as {couponCode?:string}).couponCode){await EngagementRedemption.findOneAndUpdate({couponCode:(payment as unknown as {couponCode:string}).couponCode,couponStatus:"reserved",couponPaymentReference:reference},{$set:{couponStatus:"used"}});}
  try{await writePlatformAuditEvent({actorType:"system",actorId:"paystack-webhook",actorLabel:"Paystack payment webhook",action:"commerce.payment_webhook_verified",module:"finance",targetType:"payment_transaction",targetId:String(payment._id),outcome:"success",metadata:{reference,providerTransactionId:payment.providerTransactionId}});}catch(auditError){console.error("Paystack webhook audit write failed",auditError);}
  return NextResponse.json({received:true,processed:true});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Payment verification failed."},{status:409});}
}
