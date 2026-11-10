import {NextRequest,NextResponse} from "next/server";
import {connectToDatabase} from "@/lib/db";
import {createClientIdentity} from "@/lib/clients/identity";
import {createEmailVerification,sendClientVerificationEmail} from "@/lib/clients/email";
import {validateClientRegistration} from "@/lib/clients/validation";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid request body."},{status:400});}
 const validation=validateClientRegistration(body);if(!validation.ok)return NextResponse.json({error:validation.error},{status:400});
 const {name,firstName,middleName,lastName,email,password}=validation.value;
 if(!process.env.BREVO_API_KEY||!process.env.BREVO_SENDER_EMAIL)return NextResponse.json({error:"Client registration is temporarily unavailable because email delivery has not been configured. No account was created. Please contact TGO DevStudio support.",code:"client_email_not_configured"},{status:503});
 await connectToDatabase();let userId="";
 try{const user=await createClientIdentity({name,firstName,middleName,lastName,email,password,source:"self_registration"});userId=String(user._id);const token=await createEmailVerification(userId);await sendClientVerificationEmail(email,name,token,request.nextUrl.origin);try{await writePlatformAuditEvent({actorType:"human",actorId:userId,actorLabel:name,action:"client.account_registered",module:"clients",targetType:"client",targetId:userId,outcome:"success",metadata:{source:"self_registration"}});}catch(auditError){console.error("Client registration audit write failed",auditError);}return NextResponse.json({ok:true,message:"Account created. Check your email for the verification link."},{status:201});}
 catch(error){const message=error instanceof Error?error.message:"Registration could not be completed.";if(userId){const User=(await import("@/models/User")).default;const ClientProfile=(await import("@/models/ClientProfile")).default;const Verification=(await import("@/models/ClientEmailVerification")).default;const ClientActivity=(await import("@/models/ClientActivity")).default;await Promise.all([User.deleteOne({_id:userId,accountType:"client",isEmailVerified:false}),ClientProfile.deleteOne({userId}),Verification.deleteMany({userId}),ClientActivity.deleteMany({clientId:userId,action:"client.account_created"})]);}const status=message.includes("already exists")?409:message.includes("not configured")?503:500;return NextResponse.json({error:message,code:status===409?"account_exists":"registration_failed"},{status});}
}