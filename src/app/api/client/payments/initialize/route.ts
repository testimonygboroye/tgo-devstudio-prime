import {NextRequest,NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {Types} from "mongoose";
import {getServerSession} from "@/lib/auth/serverSession";
import {connectToDatabase} from "@/lib/db";
import User from "@/models/User";
import CommercialOrder from "@/models/CommercialOrder";
import DeliveryProject from "@/models/DeliveryProject";
import DeliveryMilestone from "@/models/DeliveryMilestone";
import PaymentTransaction from "@/models/PaymentTransaction";
import FinanceSettings from "@/models/FinanceSettings";
import FinanceInvoice from "@/models/FinanceInvoice";
import FinanceInstallmentPlan from "@/models/FinanceInstallmentPlan";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
import {getPublicSiteUrl} from "@/lib/site-url";
import {fromMinorUnits,toMinorUnits} from "@/lib/payments/money";
import {getPaymentProvider} from "@/lib/payments/provider";
import {EngagementRedemption} from "@/models/Engagement";
export const dynamic="force-dynamic";
const PAYSTACK_CURRENCIES_BY_COUNTRY:Record<string,string[]>={NG:["NGN","USD"],GH:["GHS"],KE:["KES","USD"],ZA:["ZAR"],CI:["XOF"]};
function fail(error:string,status=400){return NextResponse.json({ok:false,error},{status});}

export async function POST(request:NextRequest){
 const session=await getServerSession();
 if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)return fail("Verified client sign-in required.",401);
 let body:Record<string,unknown>;try{body=await request.json();}catch{return fail("Invalid payment request.");}
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return fail("Online payments are not configured yet. Contact TGO DevStudio to arrange a payment method.",503);
 let siteUrl:string;try{siteUrl=getPublicSiteUrl(request);}catch{return fail("The public payment return URL is not configured. Please contact TGO DevStudio.",503);}
 if(typeof body.orderId!=="string"||!Types.ObjectId.isValid(body.orderId))return fail("A valid order id is required.");
 await connectToDatabase();
 const [user,order,settings]=await Promise.all([
  User.findOne({_id:session.user._id,accountType:"client",isEmailVerified:true}),
  CommercialOrder.findOne({_id:body.orderId,clientId:session.user._id}),
  FinanceSettings.findOne({key:"global"}),
 ]);
 if(!user||!order)return fail("Order not found in your client account.",404);
 if(["cancelled","refunded","completed"].includes(order.status))return fail("This order is not eligible for payment.");
 if(!settings?.paystackEnabled)return fail("Paystack checkout is currently disabled by TGO DevStudio.",503);
 const currency=String(order.currency||"NGN").toUpperCase();
 const eligibleCurrencies=PAYSTACK_CURRENCIES_BY_COUNTRY[settings.paystackMerchantCountry||"NG"]||[];if(!eligibleCurrencies.includes(currency)||!settings.enabledCurrencies.includes(currency))return fail(`Paystack checkout is not enabled for the ${currency} currency on this merchant account.`);

 let amountMinor=0;let milestoneId:string|undefined;let invoiceId:string|undefined;let installmentId:string|undefined;
 let existingQuery:Record<string,unknown>;
 if(typeof body.installmentId==="string"){
  if(!Types.ObjectId.isValid(body.installmentId))return fail("Invalid installment id.");
  if(body.amount!==undefined||body.invoiceId||body.milestoneId)return fail("Pay an installment separately using its configured amount.");
  const plan=await FinanceInstallmentPlan.findOne({orderId:order._id,clientId:user._id,status:"active"});
  const installment=plan?.installments.find(item=>String(item._id)===body.installmentId);
  if(!plan||!installment)return fail("Installment not found in your payment schedule.",404);
  if(installment.status==="paid")return fail("This installment has already been paid.");
  amountMinor=installment.amountMinor-installment.paidMinor;
  if(amountMinor<1)return fail("This installment has no outstanding balance.");
  installmentId=String(installment._id);
  existingQuery={orderId:order._id,installmentId:installment._id,status:"pending",amountMinor,authorizationUrl:{$exists:true}};
 }else if(typeof body.invoiceId==="string"){
  if(!Types.ObjectId.isValid(body.invoiceId))return fail("Invalid invoice id.");
  if(body.milestoneId)return fail("Invoice payments and milestone payments must be initiated separately.");
  if(await FinanceInstallmentPlan.findOne({orderId:order._id,clientId:user._id,status:"active"}))return fail("This order has an installment plan. Pay the scheduled installments instead of using the invoice balance.");
  const invoice=await FinanceInvoice.findOne({_id:body.invoiceId,orderId:order._id,clientId:user._id,status:{$nin:["draft","void"]}});
  if(!invoice)return fail("Issued invoice not found in your account.",404);
  invoiceId=String(invoice._id);
  const remainingMinor=invoice.balanceMinor;
  if(remainingMinor<1)return fail("This invoice has already been paid.");
  if(body.amount===undefined)amountMinor=remainingMinor;
  else{if(typeof body.amount!=="number"||!Number.isFinite(body.amount)||body.amount<=0)return fail("Enter a valid partial payment amount.");amountMinor=toMinorUnits(body.amount,currency);if(amountMinor<1||amountMinor>remainingMinor)return fail("Payment amount cannot exceed the invoice balance.");}
  existingQuery={orderId:order._id,invoiceId:invoice._id,status:"pending",amountMinor,authorizationUrl:{$exists:true}};
 }else if(typeof body.milestoneId==="string"){
  if(!Types.ObjectId.isValid(body.milestoneId))return fail("Invalid milestone id.");
  if(body.amount!==undefined)return fail("Milestone payments must be paid at the configured milestone amount.");
  const project=await DeliveryProject.findOne({orderId:order._id,clientId:user._id});if(!project)return fail("Delivery project not found.",404);
  const milestone=await DeliveryMilestone.findOne({_id:body.milestoneId,projectId:project._id});if(!milestone)return fail("Milestone not found in this project.",404);
  if(milestone.paymentStatus==="paid")return fail("This milestone has already been paid.");
  amountMinor=toMinorUnits(milestone.amount,currency);milestoneId=String(milestone._id);
  if(amountMinor===0){milestone.paymentStatus="not_required";await milestone.save();return NextResponse.json({ok:true,notRequired:true,message:"No payment is required for this milestone."});}
  existingQuery={orderId:order._id,milestoneId:milestone._id,status:"pending",amountMinor,authorizationUrl:{$exists:true}};
 }else{
  if(await FinanceInstallmentPlan.findOne({orderId:order._id,clientId:user._id,status:"active"}))return fail("This order has an installment plan. Pay the scheduled installments instead of paying the full order balance.");
  if(order.paymentStatus==="paid")return fail("This order has already been paid.");
  const deliveryProject=await DeliveryProject.findOne({orderId:order._id,clientId:user._id});
  if(deliveryProject&&await DeliveryMilestone.countDocuments({projectId:deliveryProject._id,amount:{$gt:0}})>0)return fail("This order uses milestone billing. Pay each outstanding milestone separately.");
  const invoice=await FinanceInvoice.findOne({orderId:order._id,clientId:user._id,status:{$nin:["draft","void"]}});
  const orderTotalMinor=invoice?invoice.totalMinor:toMinorUnits(order.amount,currency);
  const paid=await PaymentTransaction.aggregate([{$match:{orderId:order._id,status:"paid",milestoneId:{$exists:false}}},{$group:{_id:null,total:{$sum:"$amountMinor"}}}]);
  const paidMinor=Number(paid[0]?.total||0);const remainingMinor=orderTotalMinor-paidMinor;
  if(remainingMinor<=0)return fail("This order has already been paid.");
  if(body.amount===undefined)amountMinor=remainingMinor;
  else{if(typeof body.amount!=="number"||!Number.isFinite(body.amount)||body.amount<=0)return fail("Enter a valid partial payment amount.");amountMinor=toMinorUnits(body.amount,currency);if(amountMinor<1||amountMinor>remainingMinor)return fail("The payment amount must be positive and cannot exceed the outstanding balance.");}
  if(invoice)invoiceId=String(invoice._id);
  existingQuery={orderId:order._id,milestoneId:{$exists:false},status:"pending",amountMinor,authorizationUrl:{$exists:true}};
 }
 let couponId: string | null = null; let couponCode: string | null = null; let discountMinor = 0;
 if(body.couponCode !== undefined){
  if(typeof body.couponCode!=="string"||body.installmentId||body.milestoneId||body.invoiceId||body.amount!==undefined)return fail("Discount coupons can only be applied to a full order-balance payment.");
  coupon=await EngagementRedemption.findOne({clientId:user._id,couponCode:String(body.couponCode).trim().toUpperCase(),couponStatus:"issued",couponExpiresAt:{$gt:new Date()}}).populate("rewardId");
  const reward=coupon?.rewardId as unknown as {kind?:string;discountPercent?:number}|undefined;
  if(!coupon||reward?.kind!=="discount"||!Number.isFinite(reward.discountPercent)||Number(reward.discountPercent)<=0)return fail("This discount coupon is invalid, expired, already used, or not available for this account.",409);
  discountMinor=Math.floor(amountMinor*Number(reward.discountPercent)/100);
  if(discountMinor<1||discountMinor>=amountMinor)return fail("The coupon discount cannot be applied to this payment amount.");
  amountMinor-=discountMinor;
 }
 const existing=couponId?null:await PaymentTransaction.findOne(existingQuery).sort({createdAt:-1});
 if(existing?.authorizationUrl)return NextResponse.json({ok:true,authorizationUrl:existing.authorizationUrl,reference:existing.reference});
 const amount=fromMinorUnits(amountMinor,currency);if(!Number.isSafeInteger(amountMinor)||amountMinor<1)return fail("The payment amount is invalid.");
 const reference=`TGO_${randomUUID().replace(/-/g,"").slice(0,24).toUpperCase()}`;
 const payment=await PaymentTransaction.create({reference,provider:"paystack",paymentMethod:"card",clientId:user._id,orderId:order._id,milestoneId,invoiceId,installmentId,amount,amountMinor,currency,status:"pending",...(couponCode?{couponCode,discountMinor}:{})});
 if(coupon){
  const reserved=await EngagementRedemption.findOneAndUpdate({_id:coupon._id,couponStatus:"issued"},{$set:{couponStatus:"reserved",couponPaymentReference:reference}},{new:true});
  if(!reserved){await PaymentTransaction.deleteOne({_id:payment._id});return fail("This coupon was just redeemed in another checkout. Refresh and try again.",409);}
 }
 try{
  const callbackUrl=new URL("/client/payments/callback",siteUrl);callbackUrl.searchParams.set("reference",reference);
  const checkout=await getPaymentProvider("paystack").initialize({email:user.email,amountMinor,currency,reference,callbackUrl:callbackUrl.toString(),metadata:{clientId:String(user._id),orderId:String(order._id),milestoneId:milestoneId||null,invoiceId:invoiceId||null,installmentId:installmentId||null}});
  if(checkout.reference!==reference)throw new Error("Payment provider returned a different transaction reference.");
  payment.authorizationUrl=checkout.authorizationUrl;payment.accessCode=checkout.accessCode;await payment.save();
  if(order.paymentStatus!=="partially_paid"){order.paymentStatus="pending";await order.save();}
  await writePlatformAuditEvent({actorType:"human",actorId:String(user._id),actorLabel:user.name,action:"commerce.payment_checkout_initialized",module:"finance",targetType:"payment_transaction",targetId:String(payment._id),outcome:"success",metadata:{orderId:String(order._id),milestoneId:milestoneId||null,invoiceId:invoiceId||null,installmentId:installmentId||null,amount,currency,provider:"paystack"}});
  return NextResponse.json({ok:true,authorizationUrl:payment.authorizationUrl,reference,amount,currency});
 }catch(error){payment.status="failed";payment.failureReason=error instanceof Error?error.message:"Checkout initialization failed.";await payment.save();if(couponId)await EngagementRedemption.updateOne({_id:couponId,couponStatus:"reserved",couponPaymentReference:reference},{$set:{couponStatus:"issued"},$unset:{couponPaymentReference:1}});return fail("The payment provider could not start checkout. Please retry or contact TGO DevStudio.",502);}
}
