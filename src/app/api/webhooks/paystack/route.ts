import {NextRequest,NextResponse} from "next/server";
import {createHmac,timingSafeEqual} from "node:crypto";
import {verifyAndRecordPaystackPayment} from "@/lib/payments/paystack";
import PaymentTransaction from "@/models/PaymentTransaction";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return NextResponse.json({error:"Webhook is not configured."},{status:503});
 const raw=await request.text();const signature=request.headers.get("x-paystack-signature")||"";
 const expected=createHmac("sha512",secret).update(raw).digest("hex");
 const supplied=Buffer.from(signature,"utf8"),known=Buffer.from(expected,"utf8");
 if(supplied.length!==known.length||!timingSafeEqual(supplied,known))return NextResponse.json({error:"Invalid webhook signature."},{status:401});
 let event:any;try{event=JSON.parse(raw);}catch{return NextResponse.json({error:"Invalid webhook payload."},{status:400});}
 if(event.event!=="charge.success")return NextResponse.json({received:true,ignored:true});
 const reference=String(event.data?.reference||"");
 if(!/^TGO_[A-Z0-9]{24}$/.test(reference))return NextResponse.json({error:"Unknown payment reference."},{status:400});
 try{
  const payment=await verifyAndRecordPaystackPayment(reference);
  await writePlatformAuditEvent({actorType:"system",actorId:"paystack-webhook",actorLabel:"Paystack payment webhook",action:"commerce.payment_webhook_verified",module:"finance",targetType:"payment_transaction",targetId:String(payment._id),outcome:"success",metadata:{reference,providerTransactionId:payment.providerTransactionId}});
  return NextResponse.json({received:true,processed:true});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Payment verification failed."},{status:409});}
}
