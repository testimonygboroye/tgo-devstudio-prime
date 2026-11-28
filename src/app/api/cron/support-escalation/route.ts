import {NextRequest,NextResponse} from "next/server";
import { authorizePlatformCron } from "@/lib/platform/cronAuth";
import {connectToDatabase} from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import {sendSupportNotification} from "@/lib/support/notifications";
import {writePlatformAuditEvent} from "@/lib/platform/audit";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:NextRequest){
  if (!(await authorizePlatformCron(request))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  await connectToDatabase();

  const now=new Date();
  const cooldown=new Date(now.getTime()-6*60*60*1000);
  // Waiting-on-client tickets are deliberately excluded. Their resolution clock
  // is paused until the client replies; first-response SLA only applies before
  // the first staff/AI response and only while the team owns the next action.
  const due=await SupportTicket.find({
    status:{$in:["open","in_progress","waiting_on_team"]},
    $or:[
      {firstResponseDueAt:{$lt:now},firstRespondedAt:{$exists:false}},
      {resolutionDueAt:{$lt:now}},
    ],
    $and:[{$or:[{lastEscalatedAt:{$exists:false}},{lastEscalatedAt:{$lt:cooldown}}]}],
  }).limit(100);

  let escalated=0;
  for(const ticket of due){
    if(ticket.escalationLevel>=5)continue;
    const previousLevel=ticket.escalationLevel;
    // Re-check eligibility and cooldown at write time to avoid duplicate
    // escalation if two cron invocations overlap.
    const claimed=await SupportTicket.findOneAndUpdate({
      _id:ticket._id,
      status:{$in:["open","in_progress","waiting_on_team"]},
      escalationLevel:previousLevel,
      $or:[{lastEscalatedAt:{$exists:false}},{lastEscalatedAt:{$lt:cooldown}}],
    },{
      $set:{lastEscalatedAt:now},
      $inc:{escalationLevel:1},
    },{new:true});
    if(!claimed)continue;

    claimed.escalationLevel=Math.min(5,claimed.escalationLevel);
    claimed.priority=claimed.escalationLevel>=3?"urgent":claimed.escalationLevel>=2?"high":claimed.priority;
    claimed.messages.push({
      senderId:claimed.clientId,
      senderType:"system",
      body:"This request has been automatically escalated because a support-owned service-level deadline was missed. Our team has been notified.",
      attachments:[],
      createdAt:now,
    });
    await claimed.save();
    escalated++;

    try{
      await writePlatformAuditEvent({
        actorType:"system",actorId:"support-sla-cron",actorLabel:"Support SLA automation",
        action:"support.ticket_auto_escalated",module:"support",targetType:"support_ticket",
        targetId:String(claimed._id),outcome:"success",
        metadata:{reference:claimed.reference,escalationLevel:claimed.escalationLevel,priority:claimed.priority},
      });
    }catch(e){console.error("Support escalation audit failed",e);}

    const message=claimed.subject+" has missed a support-owned service deadline. Current escalation level: "+claimed.escalationLevel+"/5.";
    const email=process.env.FOUNDER_NOTIFICATION_EMAIL;
    if(email)void sendSupportNotification({toEmail:email,toName:"TGO Support Team",subject:"SLA escalation: "+claimed.reference,message}).catch(e=>console.error("SLA escalation email failed",e));
    if(process.env.SUPPORT_WHATSAPP_TO)void sendSupportNotification({subject:"SLA escalation: "+claimed.reference,message,whatsappTo:process.env.SUPPORT_WHATSAPP_TO}).catch(e=>console.error("SLA escalation WhatsApp failed",e));
  }
  return NextResponse.json({ok:true,checked:due.length,escalated,excludedWaitingOnClient:true});
}
