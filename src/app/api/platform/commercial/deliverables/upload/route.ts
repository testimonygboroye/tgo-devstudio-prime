import {NextRequest,NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {Types} from "mongoose";
import {getServerSession} from "@/lib/auth/serverSession";
import {connectToDatabase} from "@/lib/db";
import cloudinary from "@/lib/cloudinary";
import DeliveryProject from "@/models/DeliveryProject";
import DeliveryMilestone from "@/models/DeliveryMilestone";
import ProjectDeliverable from "@/models/ProjectDeliverable";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
export const runtime="nodejs";export const dynamic="force-dynamic";
const allowed=new Map<string,"image"|"raw">([
 ["image/jpeg","image"],["image/png","image"],["image/webp","image"],["image/gif","image"],
 ["application/pdf","raw"],["text/plain","raw"],["application/zip","raw"],
 ["application/vnd.openxmlformats-officedocument.wordprocessingml.document","raw"],
 ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","raw"],
 ["application/vnd.openxmlformats-officedocument.presentationml.presentation","raw"],
]);
export async function POST(request:NextRequest){
 const session=await getServerSession();if(!session)return NextResponse.json({error:"Authentication required."},{status:401});if(!session.role?.isFounderRole)return NextResponse.json({error:"Founder permissions required."},{status:403});
 const form=await request.formData();const projectId=String(form.get("projectId")||"");const milestoneId=String(form.get("milestoneId")||"");const title=String(form.get("title")||"").trim();const description=String(form.get("description")||"").trim();const file=form.get("file");
 if(!Types.ObjectId.isValid(projectId)||title.length<2||title.length>180||!(file instanceof File))return NextResponse.json({error:"Project, deliverable title and file are required."},{status:400});
 const resourceType=allowed.get(file.type);if(!resourceType||file.size<1||file.size>20*1024*1024)return NextResponse.json({error:"Choose a supported file (PDF, office document, image or text) up to 20 MB."},{status:400});
 if(!process.env.CLOUDINARY_CLOUD_NAME||!process.env.CLOUDINARY_API_KEY||!process.env.CLOUDINARY_API_SECRET)return NextResponse.json({error:"Secure deliverable storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."},{status:503});
 await connectToDatabase();const project=await DeliveryProject.findById(projectId);if(!project)return NextResponse.json({error:"Project not found."},{status:404});
 if(["completed","cancelled"].includes(project.status))return NextResponse.json({error:"Files cannot be added to a completed or cancelled project."},{status:409});
 if(milestoneId&&(!Types.ObjectId.isValid(milestoneId)||!await DeliveryMilestone.exists({_id:milestoneId,projectId:project._id})))return NextResponse.json({error:"Milestone does not belong to this project."},{status:400});
 const latest=await ProjectDeliverable.findOne({projectId:project._id,title}).sort({version:-1});
 const publicId=`deliverable-${randomUUID().replace(/-/g,"")}`;
 let uploadedAsset:{public_id:string;resource_type:string}|null=null;
 try{
  const buffer=Buffer.from(await file.arrayBuffer());
  const uploaded=await new Promise<{public_id:string;format?:string;bytes:number;resource_type:string}>((resolve,reject)=>{
   const stream=cloudinary.uploader.upload_stream({folder:`tgo/deliverables/${project._id}`,public_id:publicId,resource_type:resourceType,type:"authenticated",use_filename:false,unique_filename:false,overwrite:false,filename_override:file.name.slice(0,180),invalidate:true},(error,result)=>{if(error||!result)return reject(error||new Error("Cloudinary did not return an uploaded asset."));resolve(result);});
   stream.end(buffer);
  });
  uploadedAsset={public_id:uploaded.public_id,resource_type:uploaded.resource_type};
  const deliverable=await ProjectDeliverable.create({projectId:project._id,milestoneId:milestoneId||undefined,title,description,version:(latest?.version||0)+1,storageKey:uploaded.public_id,fileName:file.name.replace(/[\r\n\0]/g,"").slice(0,180),mimeType:file.type,fileSize:uploaded.bytes,resourceType:resourceType,fileFormat:uploaded.format||file.name.split(".").pop()||"bin",status:"draft",createdBy:session.user._id});
  await writePlatformAuditEvent({actorType:"human",actorId:String(session.user._id),actorLabel:session.user.name,action:"delivery.deliverable_file_uploaded",module:"commercial_delivery",targetType:"project_deliverable",targetId:String(deliverable._id),outcome:"success",metadata:{projectId:String(project._id),milestoneId:milestoneId||null,fileSize:uploaded.bytes,mimeType:file.type,deliveryType:"authenticated"}});
  return NextResponse.json({ok:true,item:{id:String(deliverable._id),title:deliverable.title,version:deliverable.version,fileName:deliverable.fileName,status:deliverable.status}},{status:201});
 }catch(error){if(uploadedAsset){try{await cloudinary.uploader.destroy(uploadedAsset.public_id,{resource_type:uploadedAsset.resource_type,type:"authenticated",invalidate:true});}catch{}}return NextResponse.json({error:error instanceof Error?error.message:"Secure file upload failed."},{status:502});}
}
