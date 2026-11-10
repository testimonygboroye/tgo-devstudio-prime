import {NextRequest,NextResponse} from "next/server";
import {Types} from "mongoose";
import {getServerSession} from "@/lib/auth/serverSession";
import {connectToDatabase} from "@/lib/db";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import WorkspaceComment from "@/models/WorkspaceComment";
import WorkspaceDocument from "@/models/WorkspaceDocument";
import WorkspaceTask from "@/models/WorkspaceTask";
import WorkspaceMilestone from "@/models/WorkspaceMilestone";
import WorkspaceMessage from "@/models/WorkspaceMessage";
import WorkspaceActivity from "@/models/WorkspaceActivity";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
export const dynamic="force-dynamic";
type Ctx={params:Promise<{workspaceId:string}>};
type TargetType="document"|"task"|"milestone"|"message";
const TARGET_TYPES:readonly TargetType[]=["document","task","milestone","message"];
const fail=(error:string,status=400)=>NextResponse.json({error},{status});
function isTargetType(value:string):value is TargetType{return TARGET_TYPES.includes(value as TargetType);}
async function targetExists(type:TargetType,targetId:string,workspaceId:string){switch(type){case "document":return Boolean(await WorkspaceDocument.exists({_id:targetId,workspaceId}));case "task":return Boolean(await WorkspaceTask.exists({_id:targetId,workspaceId}));case "milestone":return Boolean(await WorkspaceMilestone.exists({_id:targetId,workspaceId}));case "message":return Boolean(await WorkspaceMessage.exists({_id:targetId,workspaceId}));}}
export async function GET(req:NextRequest,{params}:Ctx){const session=await getServerSession();if(!session)return fail("Authentication required.",401);const {workspaceId}=await params;const targetType=req.nextUrl.searchParams.get("targetType")||"",targetId=req.nextUrl.searchParams.get("targetId")||"";if(!Types.ObjectId.isValid(workspaceId)||!Types.ObjectId.isValid(targetId)||!isTargetType(targetType))return fail("Valid target type and id are required.");await connectToDatabase();if(!await WorkspaceMembership.exists({workspaceId,userId:session.user._id,status:"active"}))return fail("Workspace access denied.",403);if(!await targetExists(targetType,targetId,workspaceId))return fail("Target not found.",404);const comments=await WorkspaceComment.find({workspaceId,targetType,targetId}).populate("authorId","name email").sort({createdAt:1}).limit(200).lean();return NextResponse.json({comments},{headers:{"Cache-Control":"private, no-store"}});}
export async function POST(req:NextRequest,{params}:Ctx){const session=await getServerSession();if(!session)return fail("Authentication required.",401);const {workspaceId}=await params;let body:Record<string,unknown>;try{body=await req.json()}catch{return fail("Invalid request body.");}const targetType=String(body.targetType||""),targetId=String(body.targetId||""),text=typeof body.body==="string"?body.body.trim():"";if(!Types.ObjectId.isValid(workspaceId)||!Types.ObjectId.isValid(targetId)||!isTargetType(targetType)||!text||text.length>8000)return fail("Valid target and comment (maximum 8,000 characters) are required.");await connectToDatabase();if(!await WorkspaceMembership.exists({workspaceId,userId:session.user._id,status:"active"}))return fail("Workspace access denied.",403);if(!await targetExists(targetType,targetId,workspaceId))return fail("Target not found.",404);const comment=await WorkspaceComment.create({workspaceId,targetType,targetId,authorId:session.user._id,body:text});await WorkspaceActivity.create({workspaceId,actorId:session.user._id,actorType:"human",action:"workspace.comment_added",targetType,targetId,summary:"Added a comment."});await writePlatformAuditEvent({actorType:"human",actorId:String(session.user._id),action:"workspace.comment_added",module:"collaboration",targetType,targetId,outcome:"success",metadata:{workspaceId}});return NextResponse.json({id:String(comment._id)},{status:201});}
