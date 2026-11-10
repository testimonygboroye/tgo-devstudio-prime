import {NextRequest,NextResponse} from "next/server";
import {Types} from "mongoose";
import {getServerSession} from "@/lib/auth/serverSession";
import {connectToDatabase} from "@/lib/db";
import ProjectDeliverable from "@/models/ProjectDeliverable";
import DeliveryProject from "@/models/DeliveryProject";
import cloudinary from "@/lib/cloudinary";
export const dynamic="force-dynamic";
type Ctx={params:Promise<{id:string}>};
export async function GET(_request:NextRequest,{params}:Ctx){
 const session=await getServerSession();if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)return NextResponse.json({error:"Verified client sign-in required."},{status:401});
 const {id}=await params;if(!Types.ObjectId.isValid(id))return NextResponse.json({error:"Invalid deliverable."},{status:400});
 await connectToDatabase();const item=await ProjectDeliverable.findById(id);if(!item||!item.storageKey||!item.fileFormat||!item.resourceType)return NextResponse.json({error:"Deliverable file not found."},{status:404});
 if(!["client_review","approved","released"].includes(item.status))return NextResponse.json({error:"This file is not available for client review yet."},{status:403});
 const project=await DeliveryProject.findOne({_id:item.projectId,clientId:session.user._id});if(!project)return NextResponse.json({error:"Deliverable not found in your client account."},{status:404});
 if(!process.env.CLOUDINARY_API_KEY||!process.env.CLOUDINARY_API_SECRET)return NextResponse.json({error:"Secure file storage is unavailable."},{status:503});
 const url=cloudinary.utils.private_download_url(item.storageKey,item.fileFormat,{resource_type:item.resourceType,type:"authenticated",expires_at:Math.floor(Date.now()/1000)+300,attachment:true});
 return NextResponse.redirect(url,{headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
}
