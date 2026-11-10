import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { randomUUID } from "node:crypto";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
import ClientActivity from "@/models/ClientActivity";
import SupportSettings from "@/models/SupportSettings";
import {sendSupportNotification} from "@/lib/support/notifications";

export const dynamic = "force-dynamic";
const CATEGORIES = ["General enquiry", "Project delivery", "Billing and payments", "Account access", "Technical issue", "Other"];
function fail(error:string,status=400){return NextResponse.json({ok:false,error},{status});}
export async function GET(){
  const session=await getServerSession();
  if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)return fail("Verified client sign-in required.",401);
  await connectToDatabase();
  const [tickets,settings]=await Promise.all([SupportTicket.find({clientId:session.user._id}).sort({updatedAt:-1}).limit(100).lean(),SupportSettings.findOne({key:"global"}).lean()]);
  return NextResponse.json({ok:true,tickets,categories:settings?.categories||CATEGORIES},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(request:NextRequest){
  const session=await getServerSession();
  if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)return fail("Verified client sign-in required.",401);
  let body:Record<string,unknown>;try{body=await request.json();}catch{return fail("Invalid request body.");}
  const subject=typeof body.subject==="string"?body.subject.trim():"";
  const description=typeof body.description==="string"?body.description.trim():"";
  const category=typeof body.category==="string"?body.category.trim():"";
  if(subject.length<4||subject.length>180)return fail("Enter a subject between 4 and 180 characters.");
  if(description.length<10||description.length>10000)return fail("Describe the issue in 10 to 10,000 characters.");
  await connectToDatabase();
  const settings=await SupportSettings.findOne({key:"global"}).lean();
  const categories=settings?.categories||CATEGORIES;
  if(!categories.includes(category))return fail("Choose a valid support category.");
  const now=new Date();
  const priority=body.priority==="urgent"?"urgent":"normal";
  const policy=(settings?.slaHours as Record<string,{firstResponse:number;resolution:number}>|undefined)?.[priority]||{firstResponse:priority==="urgent"?2:24,resolution:priority==="urgent"?8:72};
  const firstResponseHours=policy.firstResponse;
  const resolutionHours=policy.resolution;
  const ticket=await SupportTicket.create({
    reference:"TGO-SUP-"+now.toISOString().slice(0,10).replace(/-/g,"")+"-"+randomUUID().slice(0,8).toUpperCase(),
    clientId:session.user._id,subject,description,category,status:"open",priority,escalationLevel:0,
    firstResponseDueAt:new Date(now.getTime()+firstResponseHours*3600000),
    resolutionDueAt:new Date(now.getTime()+resolutionHours*3600000),
    messages:[{senderId:session.user._id,senderType:"client",body:description,attachments:[],createdAt:now}],
  });
  await Promise.all([
    writePlatformAuditEvent({actorType:"human",actorId:String(session.user._id),actorLabel:session.user.name,action:"support.ticket_created",module:"support",targetType:"support_ticket",targetId:String(ticket._id),outcome:"success",metadata:{reference:ticket.reference,category,priority}}),
    ClientActivity.create({clientId:session.user._id,actorId:session.user._id,actorType:"client",action:"client.support_ticket_created",summary:"Created support ticket "+ticket.reference,metadata:{ticketId:String(ticket._id)}}),
  ]);
  if(settings?.notifications?.emailEnabled!==false){
    const founderEmail=process.env.FOUNDER_NOTIFICATION_EMAIL;
    if(founderEmail)void sendSupportNotification({toEmail:founderEmail,toName:"TGO Support Team",subject:"New support request "+ticket.reference,message:ticket.subject+" — "+ticket.description}).catch(e=>console.error("Support notification failed",e));
  }
  if(settings?.notifications?.whatsappEnabled&&process.env.SUPPORT_WHATSAPP_TO)void sendSupportNotification({subject:"New support request "+ticket.reference,message:ticket.subject,whatsappTo:process.env.SUPPORT_WHATSAPP_TO}).catch(e=>console.error("Support WhatsApp notification failed",e));
  return NextResponse.json({ok:true,ticket:{id:String(ticket._id),reference:ticket.reference,status:ticket.status,subject:ticket.subject},message:"Your support request has been submitted."},{status:201});
}


export async function PATCH(request:NextRequest){
  const session=await getServerSession();
  if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)return fail("Verified client sign-in required.",401);
  let body:Record<string,unknown>;try{body=await request.json();}catch{return fail("Invalid request body.");}
  if(typeof body.ticketId!=="string"||!Types.ObjectId.isValid(body.ticketId))return fail("A valid ticket id is required.");
  await connectToDatabase();
  const ticket=await SupportTicket.findOne({_id:body.ticketId,clientId:session.user._id});
  if(!ticket)return fail("Support request not found.",404);
  if(body.action==="reply"){
    const message=typeof body.message==="string"?body.message.trim():"";
    if(!message||message.length>10000)return fail("Enter a reply between 1 and 10,000 characters.");
    if(["resolved","closed"].includes(ticket.status))return fail("This request is closed. Create a new request if you still need help.",409);
    const now=new Date();
    ticket.messages.push({senderId:session.user._id,senderType:"client",body:message,attachments:[],createdAt:now});
    ticket.status="waiting_on_team";
    await ticket.save();
    await Promise.all([
      writePlatformAuditEvent({actorType:"human",actorId:String(session.user._id),actorLabel:session.user.name,action:"support.client_replied",module:"support",targetType:"support_ticket",targetId:String(ticket._id),outcome:"success",metadata:{reference:ticket.reference}}),
      ClientActivity.create({clientId:session.user._id,actorId:session.user._id,actorType:"client",action:"client.support_ticket_replied",summary:"Replied to support ticket "+ticket.reference,metadata:{ticketId:String(ticket._id)}}),
    ]);
    const settings=await SupportSettings.findOne({key:"global"}).lean();
    const notifyText="Client "+session.user.name+" replied to support request "+ticket.reference+": "+message;
    if(settings?.notifications?.emailEnabled!==false&&process.env.FOUNDER_NOTIFICATION_EMAIL)void sendSupportNotification({toEmail:process.env.FOUNDER_NOTIFICATION_EMAIL,toName:"TGO Support Team",subject:"Client reply: "+ticket.reference,message:notifyText}).catch(e=>console.error("Support team email failed",e));
    if(settings?.notifications?.whatsappEnabled&&process.env.SUPPORT_WHATSAPP_TO)void sendSupportNotification({subject:"Client reply: "+ticket.reference,message:ticket.subject,whatsappTo:process.env.SUPPORT_WHATSAPP_TO}).catch(e=>console.error("Support team WhatsApp failed",e));
    return NextResponse.json({ok:true,ticket});
  }
  if(body.action==="satisfaction"){
    const rating=Number(body.rating),feedback=typeof body.feedback==="string"?body.feedback.trim():"";
    if(!Number.isInteger(rating)||rating<1||rating>5)return fail("Choose a satisfaction rating from 1 to 5.");
    if(!["resolved","closed"].includes(ticket.status))return fail("You can rate a request after it has been resolved.",409);
    if(ticket.satisfaction?.submittedAt)return fail("Feedback has already been submitted for this request.",409);
    ticket.satisfaction={rating,feedback:feedback.slice(0,2000),submittedAt:new Date()};
    await ticket.save();
    await writePlatformAuditEvent({actorType:"human",actorId:String(session.user._id),actorLabel:session.user.name,action:"support.satisfaction_submitted",module:"support",targetType:"support_ticket",targetId:String(ticket._id),outcome:"success",metadata:{reference:ticket.reference,rating}});
    return NextResponse.json({ok:true,message:"Thank you. Your feedback has been recorded."});
  }
  return fail("Unsupported support action.");
}
