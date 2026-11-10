import { connectToDatabase } from "@/lib/db";
import PaymentTransaction from "@/models/PaymentTransaction";
import CommercialOrder from "@/models/CommercialOrder";
import DeliveryProject from "@/models/DeliveryProject";
import DeliveryMilestone from "@/models/DeliveryMilestone";
export async function verifyAndRecordPaystackPayment(reference:string){
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)throw new Error("Paystack payment verification is not configured.");
 await connectToDatabase();
 const payment=await PaymentTransaction.findOne({reference});if(!payment)throw new Error("Payment reference was not found.");
 if(payment.status==="paid")return payment;
 const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${secret}`,"Content-Type":"application/json"},cache:"no-store"});
 const payload=await response.json() as {status?:boolean;message?:string;data?:{status?:string;amount?:number;currency?:string;id?:number;reference?:string}};
 if(!response.ok||!payload.status||!payload.data)throw new Error(payload.message||"Paystack could not verify this payment.");
 const data=payload.data;
 if(data.status!=="success"||data.reference!==payment.reference||Number(data.amount)!==payment.amountMinor||String(data.currency).toUpperCase()!==payment.currency)throw new Error("Payment verification failed: provider status, amount, currency or reference did not match the order.");
 payment.status="paid";payment.providerTransactionId=String(data.id||"");payment.verifiedAt=new Date();await payment.save();
 if(payment.milestoneId){
  const milestone=await DeliveryMilestone.findOne({_id:payment.milestoneId,projectId:{$in:await DeliveryProject.find({orderId:payment.orderId}).distinct("_id")}});
  if(!milestone)throw new Error("The paid milestone is no longer linked to this order.");
  milestone.paymentStatus="paid";if(milestone.qaStatus==="passed")milestone.status="awaiting_payment";await milestone.save();
  const paid=await PaymentTransaction.aggregate([{$match:{orderId:payment.orderId,status:"paid"}},{$group:{_id:null,total:{$sum:"$amountMinor"}}}]);
  const order=await CommercialOrder.findById(payment.orderId);
  if(order){const totalPaid=Number(paid[0]?.total||0);order.paymentStatus=totalPaid>=Math.round(order.amount*100)?"paid":"partially_paid";order.paymentProviderReference=payment.reference;order.paymentVerifiedAt=new Date();if(order.paymentStatus==="paid")order.status="confirmed";await order.save();}
 }else{
  await CommercialOrder.updateOne({_id:payment.orderId,clientId:payment.clientId},{$set:{paymentStatus:"paid",status:"confirmed",paymentProviderReference:payment.reference,paymentVerifiedAt:new Date()}});
 }
 return payment;
}
