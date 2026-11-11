import {NextRequest,NextResponse} from "next/server";
import {connectToDatabase} from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import {sendSupportNotification} from "@/lib/support/notifications";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const secret=process.env.PLATFORM_AUTOMATION_CRON_SECRET||process.env.CRON_SECRET;
 if(!secret)return NextResponse.json({error:"Scheduled support escalation is not configured."},{status:503});
 if(request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorized."},{status:401});
 await connectToDatabase();
 const now=new Date(),cooldown=new Date(now.getTime()-6*60*60*1000);
 const due=await SupportTicket.find({status:{$nin:["resolved","closed"]},$or:[{firstResponseDueAt:{$lt:now},firstRespondedAt:{$exists:false}},{resolutionDueAt:{$lt:now}}],$and:[{$or:[{lastEscalatedAt:{$exists:false}},{lastEscalatedAt:{$lt:cooldown}}]}]}).limit(100);
 let escalated=0;
 for(const ticket of due){
  if(ticket.escalationLevel>=5)continue;
  ticket.escalationLevel=Math.min(5,ticket.escalationLevel+1);
  ticket.priority=ticket.escalationLevel>=3?"urgent":ticket.escalationLevel>=2?"high":ticket.priority;
  ticket.lastEscalatedAt=now;
  ticket.messages.push({senderId:ticket.clientId,senderType:"system",body:"This request has been automatically escalated because its support service-level deadline was missed. Our team has been notified.",attachments:[],createdAt:now});
  await ticket.save();escalated++;
  try{await writePlatformAuditEvent({actorType:"system",actorId:"support-sla-cron",actorLabel:"Support SLA automation",action:"support.ticket_auto_escalated",module:"support",targetType:"support_ticket",targetId:String(ticket._id),outcome:"success",metadata:{reference:ticket.reference,escalationLevel:ticket.escalationLevel,priority:ticket.priority}});}catch(e){console.error("Support escalation audit failed",e);}
  const email=process.env.FOUNDER_NOTIFICATION_EMAIL;
  if(email)void sendSupportNotification({toEmail:email,toName:"TGO Support Team",subject:"SLA escalation: "+ticket.reference,message:ticket.subject+" has missed its service deadline. Current escalation level: "+ticket.escalationLevel+"/5."}).catch(e=>console.error("SLA escalation email failed",e));
  if(process.env.SUPPORT_WHATSAPP_TO)void sendSupportNotification({subject:"SLA escalation: "+ticket.reference,message:ticket.subject+" has missed its support deadline.",whatsappTo:process.env.SUPPORT_WHATSAPP_TO}).catch(e=>console.error("SLA escalation WhatsApp failed",e));
 }
 return NextResponse.json({ok:true,checked:due.length,escalated});
}
