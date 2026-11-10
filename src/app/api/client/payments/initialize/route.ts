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
import {writePlatformAuditEvent} from "@/lib/platform/audit";
import {getPublicSiteUrl} from "@/lib/site-url";
import {fromMinorUnits,toMinorUnits} from "@/lib/payments/money";
import {getPaymentProvider} from "@/lib/payments/provider";
export const dynamic="force-dynamic";
const supported=new Set(["NGN","GHS","ZAR","USD","KES","XOF","EGP"]);
function fail(error:string,status=400){return NextResponse.json({ok:false,error},{status});}

export async function POST(request:NextRequest){
 const session=await getServerSession();
 if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)return fail("Verified client sign-in required.",401);
 let body:Record<string,unknown>;
 try{body=await request.json();}catch{return fail("Invalid payment request.");}
 const secret=process.env.PAYSTACK_SECRET_KEY;
 if(!secret)return fail("Online payments are not configured yet. Contact TGO DevStudio to arrange a payment method.",503);
 let siteUrl:string;
 try{siteUrl=getPublicSiteUrl(request);}catch{return fail("The public payment return URL is not configured. Please contact TGO DevStudio.",503);}
 if(typeof body.orderId!=="string"||!Types.ObjectId.isValid(body.orderId))return fail("A valid order id is required.");
 await connectToDatabase();
 const [user,order]=await Promise.all([
  User.findOne({_id:session.user._id,accountType:"client",isEmailVerified:true}),
  CommercialOrder.findOne({_id:body.orderId,clientId:session.user._id}),
 ]);
 if(!user||!order)return fail("Order not found in your client account.",404);
 if(["cancelled","refunded","completed"].includes(order.status))return fail("This order is not eligible for payment.");
 const currency=String(order.currency||"NGN").toUpperCase();
 if(!supported.has(currency))return fail(`Paystack checkout does not support the ${currency} currency for this order. Contact TGO DevStudio for an alternative payment method.`,422);

 let amountMinor=0;
 let milestoneId:string|undefined;
 let existingQuery:Record<string,unknown>;
 if(typeof body.milestoneId==="string"){
  if(!Types.ObjectId.isValid(body.milestoneId))return fail("Invalid milestone id.");
  if(body.amount!==undefined)return fail("Milestone payments must be paid at the configured milestone amount.");
  const project=await DeliveryProject.findOne({orderId:order._id,clientId:user._id});
  if(!project)return fail("Delivery project not found.",404);
  const milestone=await DeliveryMilestone.findOne({_id:body.milestoneId,projectId:project._id});
  if(!milestone)return fail("Milestone not found in this project.",404);
  if(milestone.paymentStatus==="paid")return fail("This milestone has already been paid.");
  amountMinor=toMinorUnits(milestone.amount,currency);
  milestoneId=String(milestone._id);
  if(amountMinor===0){milestone.paymentStatus="not_required";await milestone.save();return NextResponse.json({ok:true,notRequired:true,message:"No payment is required for this milestone."});}
  existingQuery={orderId:order._id,milestoneId:milestone._id,status:"pending",amountMinor,authorizationUrl:{$exists:true}};
 }else{
  if(order.paymentStatus==="paid")return fail("This order has already been paid.");
  const deliveryProject=await DeliveryProject.findOne({orderId:order._id,clientId:user._id});
  if(deliveryProject&&await DeliveryMilestone.countDocuments({projectId:deliveryProject._id,amount:{$gt:0}})>0)return fail("This order uses milestone billing. Pay each outstanding milestone separately.");
  const orderTotalMinor=toMinorUnits(order.amount,currency);
  const paid=await PaymentTransaction.aggregate([{$match:{orderId:order._id,status:"paid",milestoneId:{$exists:false}}},{$group:{_id:null,total:{$sum:"$amountMinor"}}}]);
  const paidMinor=Number(paid[0]?.total||0);
  const remainingMinor=orderTotalMinor-paidMinor;
  if(remainingMinor<=0)return fail("This order has already been paid.");
  if(body.amount===undefined)amountMinor=remainingMinor;
  else{
   if(typeof body.amount!=="number"||!Number.isFinite(body.amount)||body.amount<=0)return fail("Enter a valid partial payment amount.");
   amountMinor=toMinorUnits(body.amount,currency);
   if(amountMinor<1||amountMinor>remainingMinor)return fail("The payment amount must be positive and cannot exceed the outstanding balance.");
  }
  existingQuery={orderId:order._id,milestoneId:{$exists:false},status:"pending",amountMinor,authorizationUrl:{$exists:true}};
 }
 const existing=await PaymentTransaction.findOne(existingQuery).sort({createdAt:-1});
 if(existing?.authorizationUrl)return NextResponse.json({ok:true,authorizationUrl:existing.authorizationUrl,reference:existing.reference});
 const amount=fromMinorUnits(amountMinor,currency);
 if(!Number.isSafeInteger(amountMinor)||amountMinor<1)return fail("The payment amount is invalid.");
 const reference=`TGO_${randomUUID().replace(/-/g,"").slice(0,24).toUpperCase()}`;
 const payment=await PaymentTransaction.create({reference,provider:"paystack",clientId:user._id,orderId:order._id,milestoneId,amount,amountMinor,currency,status:"pending"});
 try{
  const callbackUrl=new URL("/client/payments/callback",siteUrl);
  callbackUrl.searchParams.set("reference",reference);
  const provider=getPaymentProvider("paystack");
  const checkout=await provider.initialize({
   email:user.email,
   amountMinor,
   currency,
   reference,
   callbackUrl:callbackUrl.toString(),
   metadata:{clientId:String(user._id),orderId:String(order._id),milestoneId:milestoneId||null},
  });
  if(checkout.reference!==reference)throw new Error("Payment provider returned a different transaction reference.");
  payment.authorizationUrl=checkout.authorizationUrl;
  payment.accessCode=checkout.accessCode;
  await payment.save();
  if(order.paymentStatus!=="partially_paid"){order.paymentStatus="pending";await order.save();}
  await writePlatformAuditEvent({actorType:"human",actorId:String(user._id),actorLabel:user.name,action:"commerce.payment_checkout_initialized",module:"finance",targetType:"payment_transaction",targetId:String(payment._id),outcome:"success",metadata:{orderId:String(order._id),milestoneId:milestoneId||null,amount,currency,provider:"paystack"}});
  return NextResponse.json({ok:true,authorizationUrl:payment.authorizationUrl,reference,amount,currency});
 }catch(error){
  payment.status="failed";
  payment.failureReason=error instanceof Error?error.message:"Checkout initialization failed.";
  await payment.save();
  return fail("The payment provider could not start checkout. Please retry or contact TGO DevStudio.",502);
 }
}
