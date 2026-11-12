import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "@/lib/auth/serverSession";
import DataDeletionRequest from "@/models/DataDeletionRequest";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function founder(){const session=await getServerSession();if(!session)return {response:NextResponse.json({message:"Authentication required."},{status:401})} as const;if(!session.role?.isFounderRole)return {response:NextResponse.json({message:"Founder access required."},{status:403})} as const;return {session} as const;}
export async function GET(){
 const auth=await founder();if("response" in auth)return auth.response;
 await connectToDatabase();
 const requests=await DataDeletionRequest.find({}).sort({createdAt:-1}).limit(250).lean();
 return NextResponse.json({requests},{headers:{"Cache-Control":"private, no-store"}});
}
export async function PATCH(request:NextRequest){
 const auth=await founder();if("response" in auth)return auth.response;
 const body=await request.json().catch(()=>null) as null|Record<string,unknown>;
 if(!body||typeof body.id!=="string")return NextResponse.json({message:"A valid request ID is required."},{status:400});
 const statuses=["received","verification_required","verified","in_progress","completed","partially_retained","rejected"];
 const status=String(body.status||"");
 const verificationNote=String(body.verificationNote||"").trim();
 const resolutionNote=String(body.resolutionNote||"").trim();
 if(!statuses.includes(status)||verificationNote.length>2000||resolutionNote.length>3000)return NextResponse.json({message:"Invalid status or notes."},{status:400});
 if(["completed","partially_retained","rejected"].includes(status)&&resolutionNote.length<10)return NextResponse.json({message:"A meaningful resolution note is required for a final status."},{status:400});
 await connectToDatabase();
 const item=await DataDeletionRequest.findById(body.id);
 if(!item)return NextResponse.json({message:"Privacy request not found."},{status:404});
 const previousStatus=item.status;
 item.status=status as typeof item.status;
 item.verificationNote=verificationNote;
 item.resolutionNote=resolutionNote;
 item.handledBy=auth.session.user._id;
 if(status==="verified"&&!item.verifiedAt)item.verifiedAt=new Date();
 if(["completed","partially_retained","rejected"].includes(status))item.resolvedAt=new Date();
 else item.resolvedAt=undefined;
 await item.save();
 await writePlatformAuditEvent({actorType:"human",actorId:String(auth.session.user._id),actorLabel:auth.session.user.name,action:"privacy.deletion_request.updated",module:"privacy",targetType:"DataDeletionRequest",targetId:String(item._id),outcome:"success",metadata:{reference:item.reference,previousStatus,currentStatus:status}});
 return NextResponse.json({message:"Privacy request updated.",request:{id:String(item._id),reference:item.reference,status:item.status}});
}
