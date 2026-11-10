import {NextRequest,NextResponse} from "next/server";
import {createHmac,timingSafeEqual} from "node:crypto";
import {verifyAndRecordPaystackPayment} from "@/lib/payments/paystack";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return NextResponse.json({error:"Webhook is not configured."},{status:503});
 const raw=await request.text();const signature=request.headers.get("x-paystack-signature")||"";
 const expected=createHmac("sha512",secret).update(raw).digest("hex");
 const supplied=Buffer.from(signature,"utf8"),known=Buffer.from(expected,"utf8");
 if(supplied.length!==known.length||!timingSafeEqual(supplied,known))return NextResponse.json({error:"Invalid webhook signature."},{status:401});
 let event:unknown;try{event=JSON.parse(raw);}catch{return NextResponse.json({error:"Invalid webhook payload."},{status:400});}
 if(!event||typeof event!=="object"||Array.isArray(event))return NextResponse.json({error:"Invalid webhook payload."},{status:400});
 const payload=event as Record<string,unknown>;if(payload.event!=="charge.success")return NextResponse.json({received:true,ignored:true});
 const data=payload.data&&typeof payload.data==="object"&&!Array.isArray(payload.data)?payload.data as Record<string,unknown>:{};
 const reference=String(data.reference||"");
 if(!/^TGO_[A-Z0-9]{24}$/.test(reference))return NextResponse.json({error:"Unknown payment reference."},{status:400});
 try{
  const payment=await verifyAndRecordPaystackPayment(reference);if(!payment)throw new Error("Verified payment record was not found.");
  try{await writePlatformAuditEvent({actorType:"system",actorId:"paystack-webhook",actorLabel:"Paystack payment webhook",action:"commerce.payment_webhook_verified",module:"finance",targetType:"payment_transaction",targetId:String(payment._id),outcome:"success",metadata:{reference,providerTransactionId:payment.providerTransactionId}});}catch(auditError){console.error("Paystack webhook audit write failed",auditError);}
  return NextResponse.json({received:true,processed:true});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Payment verification failed."},{status:409});}
}
