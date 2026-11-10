import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authorizePlatformPermission } from "@/lib/platform/authorize";
import { connectToDatabase } from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
import User from "@/models/User";

export const dynamic = "force-dynamic";
function fail(error:string,status=400){return NextResponse.json({ok:false,error},{status});}
export async function GET(request:NextRequest){
  const auth=await authorizePlatformPermission("support.view");
  if(!auth.allowed)return fail("You do not have permission to view support operations.",auth.reason==="unauthenticated"?401:403);
  await connectToDatabase();
  const status=request.nextUrl.searchParams.get("status");
  const priority=request.nextUrl.searchParams.get("priority");
  const query:Record<string,unknown>={};
  if(status)query.status=status;
  if(priority)query.priority=priority;
  const tickets=await SupportTicket.find(query).populate("clientId","name email").populate("assignedTo","name email").sort({priority:-1,firstResponseDueAt:1,updatedAt:-1}).limit(200).lean();
  const now=new Date();
  const [open,overdue,unassigned,staff]=await Promise.all([
    SupportTicket.countDocuments({status:{$in:["open","in_progress","waiting_on_team"]}}),
    SupportTicket.countDocuments({status:{$nin:["resolved","closed"]},$or:[{firstResponseDueAt:{$lt:now},firstRespondedAt:{$exists:false}},{resolutionDueAt:{$lt:now}}]}),
    SupportTicket.countDocuments({status:{$in:["open","in_progress"]},assignedTo:{$exists:false}}),
    User.find({accountType:"staff",isBanned:{$ne:true}}).select("_id name email").sort({name:1}).limit(300).lean(),
  ]);
  return NextResponse.json({ok:true,tickets,summary:{open,overdue,unassigned},staff},{headers:{"Cache-Control":"private, no-store"}});
}
export async function PATCH(request:NextRequest){
  const auth=await authorizePlatformPermission("support.tickets.manage");
  if(!auth.allowed)return fail("You do not have permission to manage support tickets.",auth.reason==="unauthenticated"?401:403);
  const actor=auth.session!;
  let body:Record<string,unknown>;try{body=await request.json();}catch{return fail("Invalid request body.");}
  if(typeof body.ticketId!=="string"||!Types.ObjectId.isValid(body.ticketId))return fail("A valid ticket id is required.");
  await connectToDatabase();
  const ticket=await SupportTicket.findById(body.ticketId);
  if(!ticket)return fail("Support ticket not found.",404);
  const action=body.action;
  if(action==="reply"){
    const message=typeof body.message==="string"?body.message.trim():"";
    if(message.length<1||message.length>10000)return fail("Enter a reply between 1 and 10,000 characters.");
    ticket.messages.push({senderId:actor.user._id,senderType:"staff",body:message,attachments:[],createdAt:new Date()});
    if(!ticket.firstRespondedAt)ticket.firstRespondedAt=new Date();
    if(ticket.status==="open"||ticket.status==="waiting_on_team")ticket.status="waiting_on_client";
  }else if(action==="assign"){
    if(typeof body.assignedTo!=="string"||!Types.ObjectId.isValid(body.assignedTo))return fail("Choose a valid staff member.");
    const assignee=await User.findOne({_id:body.assignedTo,accountType:"staff",isBanned:{$ne:true}}).select("_id");
    if(!assignee)return fail("The selected staff account is unavailable.");
    ticket.assignedTo=assignee._id;
  }else if(action==="update"){
    if(typeof body.status==="string"){
      const statuses=["open","in_progress","waiting_on_client","waiting_on_team","resolved","closed"];
      if(!statuses.includes(body.status))return fail("Invalid ticket status.");
      ticket.status=body.status as typeof ticket.status;
      if(body.status==="resolved")ticket.resolvedAt=new Date();
      if(body.status==="closed")ticket.closedAt=new Date();
      if(body.status==="in_progress"&&!ticket.firstRespondedAt)ticket.firstRespondedAt=new Date();
    }
    if(typeof body.priority==="string"){
      const priorities=["low","normal","high","urgent"];
      if(!priorities.includes(body.priority))return fail("Invalid ticket priority.");
      ticket.priority=body.priority as typeof ticket.priority;
    }
  }else if(action==="escalate"){
    ticket.escalationLevel=Math.min(5,ticket.escalationLevel+1);
    if(ticket.escalationLevel===0)return fail("Ticket cannot be escalated further.");
    if(ticket.priority==="low"||ticket.priority==="normal")ticket.priority="high";
  }else return fail("Unsupported support action.");
  await ticket.save();
  await writePlatformAuditEvent({actorType:"human",actorId:String(actor.user._id),actorLabel:actor.user.name,action:"support.ticket_"+String(action),module:"support",targetType:"support_ticket",targetId:String(ticket._id),outcome:"success",metadata:{reference:ticket.reference,status:ticket.status,priority:ticket.priority,escalationLevel:ticket.escalationLevel}});
  return NextResponse.json({ok:true,ticket:{id:String(ticket._id),reference:ticket.reference,status:ticket.status,priority:ticket.priority,assignedTo:ticket.assignedTo,escalationLevel:ticket.escalationLevel}});
}
