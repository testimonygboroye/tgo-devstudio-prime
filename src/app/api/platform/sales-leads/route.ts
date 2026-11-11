import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import SalesLead, { type SalesStage } from "@/models/SalesLead";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
export const dynamic = "force-dynamic";
const stages: SalesStage[] = ["new","qualified","discovery","proposal","negotiation","won","lost"];
const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
async function founder() { const session = await getServerSession(); if (!session) return { response: fail("Authentication required.",401) } as const; if (!session.role.isFounderRole) return { response: fail("Founder access required.",403) } as const; return { session } as const; }
export async function GET() {
 const auth=await founder(); if("response" in auth)return auth.response; await connectToDatabase();
 const [leads,counts,totals]=await Promise.all([
  SalesLead.find({}).populate("assignedTo","name email").sort({updatedAt:-1}).limit(500).lean(),
  SalesLead.aggregate([{$group:{_id:"$stage",count:{$sum:1}}}]),
  SalesLead.aggregate([{$group:{_id:"$currency",value:{$sum:{$cond:[{$in:["$stage",["won","lost"]]},0,{$ifNull:["$estimatedValue",0]}]}},won:{$sum:{$cond:[{$eq:["$stage","won"]},{$ifNull:["$estimatedValue",0]},0]}},count:{$sum:1}}}])
 ]);
 return NextResponse.json({leads:leads.map(x=>({...x,id:String(x._id),_id:undefined,assignedTo:x.assignedTo&&typeof x.assignedTo==="object"&&"name"in x.assignedTo?{id:String(x.assignedTo._id),name:x.assignedTo.name}:null})),counts:counts.map(x=>({stage:x._id,count:x.count})),totals},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(request:NextRequest) {
 const auth=await founder(); if("response" in auth)return auth.response; let body:Record<string,unknown>;try{body=await request.json();}catch{return fail("Invalid request body.");}
 const firstName=typeof body.firstName==="string"?body.firstName.trim().slice(0,60):"",lastName=typeof body.lastName==="string"?body.lastName.trim().slice(0,60):"",email=typeof body.email==="string"?body.email.trim().toLowerCase().slice(0,254):"";
 if(!firstName||!lastName||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return fail("A valid first name, last name and email address are required.");
 const source=["website","referral","consultation","manual","client_portal"].includes(String(body.source))?body.source:"manual";
 const amount=body.estimatedValue===undefined||body.estimatedValue===""?undefined:Number(body.estimatedValue);if(amount!==undefined&&(!Number.isFinite(amount)||amount<0))return fail("Estimated value must be a non-negative number.");
 await connectToDatabase();
 const row=await SalesLead.create({firstName,lastName,email,phone:typeof body.phone==="string"?body.phone.trim().slice(0,40):"",organization:typeof body.organization==="string"?body.organization.trim().slice(0,160):"",source,stage:"new",estimatedValue:amount,currency:typeof body.currency==="string"&&/^[A-Za-z]{3}$/.test(body.currency)?body.currency.toUpperCase():"NGN",notes:typeof body.notes==="string"?body.notes.slice(0,12000):"",assignedTo:Types.ObjectId.isValid(String(body.assignedTo||""))?body.assignedTo:undefined});
 await writePlatformAuditEvent({actorType:"human",actorId:String(auth.session.user._id),actorLabel:auth.session.user.name,action:"sales_lead.created",module:"sales",targetType:"SalesLead",targetId:String(row._id),outcome:"success",metadata:{source:row.source,stage:row.stage}});
 return NextResponse.json({id:String(row._id),message:"Lead created and added to the sales pipeline."},{status:201});
}
export async function PATCH(request:NextRequest) {
 const auth=await founder();if("response"in auth)return auth.response;let body:Record<string,unknown>;try{body=await request.json();}catch{return fail("Invalid request body.");}
 const id=String(body.id||"");if(!Types.ObjectId.isValid(id))return fail("A valid lead ID is required.");
 await connectToDatabase();const row=await SalesLead.findById(id);if(!row)return fail("Lead not found.",404);
 const changes:Record<string,unknown>={};
 if(body.stage!==undefined){if(!stages.includes(body.stage as SalesStage))return fail("Invalid sales stage.");changes.stage=body.stage;}
 if(body.notes!==undefined){if(typeof body.notes!=="string"||body.notes.length>12000)return fail("Notes must be text under 12,000 characters.");changes.notes=body.notes;}
 if(body.nextFollowUpAt!==undefined){if(body.nextFollowUpAt===null||body.nextFollowUpAt==="")changes.nextFollowUpAt=null;else{const d=new Date(String(body.nextFollowUpAt));if(!Number.isFinite(d.getTime()))return fail("Invalid follow-up date.");changes.nextFollowUpAt=d;}}
 if(body.lostReason!==undefined){if(typeof body.lostReason!=="string"||body.lostReason.length>1000)return fail("Lost reason is too long.");changes.lostReason=body.lostReason;}
 if(!Object.keys(changes).length)return fail("No supported changes supplied.");
 const before={stage:row.stage,nextFollowUpAt:row.nextFollowUpAt?.toISOString()||null};
 Object.assign(row,changes);await row.save();
 await writePlatformAuditEvent({actorType:"human",actorId:String(auth.session.user._id),actorLabel:auth.session.user.name,action:"sales_lead.updated",module:"sales",targetType:"SalesLead",targetId:String(row._id),outcome:"success",metadata:{before,after:{stage:row.stage,nextFollowUpAt:row.nextFollowUpAt?.toISOString()||null},changedFields:Object.keys(changes)}});
 return NextResponse.json({message:"Lead updated.",lead:{id:String(row._id),stage:row.stage,notes:row.notes,nextFollowUpAt:row.nextFollowUpAt||null}});
}
