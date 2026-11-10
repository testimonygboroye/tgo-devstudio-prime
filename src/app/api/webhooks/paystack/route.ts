import {NextRequest,NextResponse} from "next/server";
import {verifyPaystackWebhookSignature} from "@/lib/payments/paystack-webhook";
import {verifyAndRecordPaystackPayment} from "@/lib/payments/paystack";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function POST(request:NextRequest){
 const rawBody=Buffer.from(await request.arrayBuffer());
 const verified=verifyPaystackWebhookSignature({
  rawBody,
  signatureHeader:request.headers.get("paystack-signature"),
  legacySignatureHeader:request.headers.get("x-paystack-signature"),
  webhookSecret:process.env.PAYSTACK_WEBHOOK_SECRET,
  secretKey:process.env.PAYSTACK_SECRET_KEY,
 });
 if(!verified)return NextResponse.json({error:"Invalid or expired Paystack webhook signature."},{status:401});
 let event:unknown;
 try{event=JSON.parse(rawBody.toString("utf8"));}catch{return NextResponse.json({error:"Invalid webhook payload."},{status:400});}
 if(!event||typeof event!=="object"||Array.isArray(event))return NextResponse.json({error:"Invalid webhook payload."},{status:400});
 const payload=event as Record<string,unknown>;
 if(payload.event==="ping")return NextResponse.json({received:true,ping:true});
 if(payload.event!=="charge.success")return NextResponse.json({received:true,ignored:true});
 const data=payload.data&&typeof payload.data==="object"&&!Array.isArray(payload.data)?payload.data as Record<string,unknown>:{};
 const reference=String(data.reference||"");
 if(!/^TGO_[A-Z0-9]{24}$/.test(reference))return NextResponse.json({error:"Unknown payment reference."},{status:400});
 try{
  const payment=await verifyAndRecordPaystackPayment(reference);
  if(!payment)throw new Error("Verified payment record was not found.");
  try{
   await writePlatformAuditEvent({actorType:"system",actorId:"paystack-webhook",actorLabel:"Paystack payment webhook",action:"commerce.payment_webhook_verified",module:"finance",targetType:"payment_transaction",targetId:String(payment._id),outcome:"success",metadata:{reference,providerTransactionId:payment.providerTransactionId}});
  }catch(auditError){console.error("Paystack webhook audit write failed",auditError);}
  return NextResponse.json({received:true,processed:true});
 }catch(error){
  return NextResponse.json({error:error instanceof Error?error.message:"Payment verification failed."},{status:409});
 }
}
