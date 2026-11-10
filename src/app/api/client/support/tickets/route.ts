import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
import ClientActivity from "@/models/ClientActivity";

export const dynamic = "force-dynamic";
const CATEGORIES = ["General enquiry", "Project delivery", "Billing and payments", "Account access", "Technical issue", "Other"];
function fail(error:string,status=400){return NextResponse.json({ok:false,error},{status});}
export async function GET(){
  const session=await getServerSession();
  if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)return fail("Verified client sign-in required.",401);
  await connectToDatabase();
  const tickets=await SupportTicket.find({clientId:session.user._id}).sort({updatedAt:-1}).limit(100).lean();
  return NextResponse.json({ok:true,tickets},{headers:{"Cache-Control":"private, no-store"}});
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
  if(!CATEGORIES.includes(category))return fail("Choose a valid support category.");
  await connectToDatabase();
  const now=new Date();
  const priority=body.priority==="urgent"?"urgent":"normal";
  const firstResponseHours=priority==="urgent"?2:24;
  const resolutionHours=priority==="urgent"?8:72;
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
  return NextResponse.json({ok:true,ticket:{id:String(ticket._id),reference:ticket.reference,status:ticket.status,subject:ticket.subject},message:"Your support request has been submitted."},{status:201});
}
