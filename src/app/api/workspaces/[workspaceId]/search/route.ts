import {NextRequest,NextResponse} from "next/server";
import {Types} from "mongoose";
import {getServerSession} from "@/lib/auth/serverSession";
import {connectToDatabase} from "@/lib/db";
import Workspace from "@/models/Workspace";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import WorkspaceMessage from "@/models/WorkspaceMessage";
import WorkspaceTask from "@/models/WorkspaceTask";
import WorkspaceDocument from "@/models/WorkspaceDocument";
import WorkspaceChannel from "@/models/WorkspaceChannel";
import DeliveryTask from "@/models/DeliveryTask";
export const dynamic="force-dynamic";
type Ctx={params:Promise<{workspaceId:string}>};
export async function GET(req:NextRequest,{params}:Ctx){
 const session=await getServerSession();if(!session)return NextResponse.json({error:"Authentication required."},{status:401});
 const {workspaceId}=await params,q=(req.nextUrl.searchParams.get("q")||"").trim().slice(0,100);
 if(!Types.ObjectId.isValid(workspaceId))return NextResponse.json({error:"Workspace not found."},{status:404});
 if(q.length<2)return NextResponse.json({error:"Enter at least two characters."},{status:400});
 await connectToDatabase();
 const membership=await WorkspaceMembership.findOne({workspaceId,userId:session.user._id,status:"active"}).lean();
 if(!membership)return NextResponse.json({error:"Workspace access denied."},{status:403});
 const workspace=await Workspace.findOne({_id:workspaceId,status:"active"}).lean();if(!workspace)return NextResponse.json({error:"Workspace not found."},{status:404});
 const rx=new RegExp(q.replace(/[.*+?^${}()|[\\]\\]/g,"\\$&"),"i");
 const [messages,workspaceTasks,documents,channels,deliveryTasks]=await Promise.all([
  WorkspaceMessage.find({workspaceId,deletedAt:null,body:rx}).sort({createdAt:-1}).limit(20).lean(),
  WorkspaceTask.find({workspaceId,title:rx}).sort({updatedAt:-1}).limit(20).lean(),
  WorkspaceDocument.find({workspaceId,title:rx}).sort({updatedAt:-1}).limit(20).lean(),
  WorkspaceChannel.find({workspaceId,name:rx,archivedAt:null,kind:"public"}).limit(10).lean(),
  workspace.deliveryProjectId?DeliveryTask.find({projectId:workspace.deliveryProjectId,title:rx}).sort({updatedAt:-1}).limit(20).lean():Promise.resolve([])
 ]);
 const tasks=[...workspaceTasks,...deliveryTasks.map(t=>({_id:t._id,title:t.title,status:t.status,source:"delivery"}))];
 return NextResponse.json({messages,tasks,documents,channels},{headers:{"Cache-Control":"private, no-store"}});
}
