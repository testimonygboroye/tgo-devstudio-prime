import {NextRequest,NextResponse} from "next/server";
import {getServerSession} from "@/lib/auth/serverSession";
import {verifyAndRecordPaystackPayment} from "@/lib/payments/paystack";
import PaymentTransaction from "@/models/PaymentTransaction";
import {connectToDatabase} from "@/lib/db";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const session=await getServerSession();if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)return NextResponse.json({ok:false,error:"Verified client sign-in required."},{status:401});
 const reference=request.nextUrl.searchParams.get("reference")||"";if(!/^TGO_[A-Z0-9]{24}$/.test(reference))return NextResponse.json({ok:false,error:"Invalid payment reference."},{status:400});
 await connectToDatabase();const record=await PaymentTransaction.findOne({reference,clientId:session.user._id});if(!record)return NextResponse.json({ok:false,error:"Payment record not found."},{status:404});
 try{const payment=await verifyAndRecordPaystackPayment(reference);if(!payment)throw new Error("Verified payment record was not found.");await writePlatformAuditEvent({actorType:"human",actorId:String(session.user._id),actorLabel:session.user.name,action:"commerce.payment_verified_by_client",module:"finance",targetType:"payment_transaction",targetId:String(payment._id),outcome:"success",metadata:{reference,amount:payment.amount,currency:payment.currency}});return NextResponse.json({ok:true,status:"paid",amount:payment.amount,currency:payment.currency,reference});}
 catch(error){return NextResponse.json({ok:false,status:record.status,error:error instanceof Error?error.message:"Payment is not yet verified."},{status:409});}
}
