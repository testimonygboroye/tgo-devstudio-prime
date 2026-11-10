import {NextRequest,NextResponse} from "next/server";
import {Types} from "mongoose";
import {authorizePlatformPermission} from "@/lib/platform/authorize";
import {connectToDatabase} from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import SupportSettings from "@/models/SupportSettings";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
export const runtime="nodejs";
export const dynamic="force-dynamic";
function fail(error:string,status=400){return NextResponse.json({ok:false,error},{status});}
export async function POST(request:NextRequest){
 const auth=await authorizePlatformPermission("support.tickets.manage");
 if(!auth.allowed)return fail("You do not have permission to use AI support assistance.",auth.reason==="unauthenticated"?401:403);
 const apiKey=process.env.GEMINI_API_KEY;
 if(!apiKey)return fail("AI support assistance is not configured. Add GEMINI_API_KEY to the Vercel Production environment.",503);
 let body:Record<string,unknown>;try{body=await request.json();}catch{return fail("Invalid request body.");}
 if(typeof body.ticketId!=="string"||!Types.ObjectId.isValid(body.ticketId))return fail("A valid support ticket id is required.");
 await connectToDatabase();
 const [ticket,settings]=await Promise.all([SupportTicket.findById(body.ticketId).populate("clientId","name email").lean(),SupportSettings.findOne({key:"global"}).lean()]);
 if(!ticket)return fail("Support ticket not found.",404);
 if(settings?.aiEnabled===false)return fail("AI assistance is disabled in support settings.",403);
 const history=(ticket.messages||[]).slice(-18).map(m=>({sender:m.senderType,body:String(m.body).slice(0,2500)}));
 const prompt={systemInstruction:{parts:[{text:"You are TGO DevStudio's internal customer-support drafting assistant. Draft a concise, empathetic, accurate reply for a human support agent to review. Never claim an action was completed unless the ticket history proves it. Never ask for passwords, one-time codes, secret keys, payment card details, or unnecessary personal data. Do not invent policies, delivery dates, refunds, or technical facts. If information is missing, ask one clear question. Do not send messages, change ticket status, issue refunds, or make commitments. Output only the suggested customer-facing reply."}]},contents:[{role:"user",parts:[{text:JSON.stringify({customerName:(ticket.clientId as {name?:string})?.name||"Client",ticketReference:ticket.reference,subject:ticket.subject,category:ticket.category,priority:ticket.priority,description:ticket.description,conversation:history})}]}],generationConfig:{temperature:0.35,maxOutputTokens:700}};
 const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="+encodeURIComponent(apiKey),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(prompt),cache:"no-store"});
 const payload=await response.json() as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}}>;error?:{message?:string}};
 if(!response.ok)return fail(payload.error?.message||"The AI provider could not generate a draft.",502);
 const draft=payload.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim();
 if(!draft)return fail("The AI provider returned an empty draft.",502);
 await writePlatformAuditEvent({actorType:"human",actorId:String(auth.session!.user._id),actorLabel:auth.session!.user.name,action:"support.ai_draft_generated",module:"support",targetType:"support_ticket",targetId:String(ticket._id),outcome:"success",metadata:{reference:ticket.reference,provider:"google-gemini",model:"gemini-2.5-flash"}});
 return NextResponse.json({ok:true,draft,requiresHumanReview:true,provider:"Google Gemini"});
}
