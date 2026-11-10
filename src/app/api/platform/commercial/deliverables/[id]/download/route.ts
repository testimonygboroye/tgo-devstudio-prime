import {NextRequest,NextResponse} from "next/server";
import {Types} from "mongoose";
import {getServerSession} from "@/lib/auth/serverSession";
import {connectToDatabase} from "@/lib/db";
import ProjectDeliverable from "@/models/ProjectDeliverable";
import cloudinary from "@/lib/cloudinary";
export const dynamic="force-dynamic";
type Ctx={params:Promise<{id:string}>};
export async function GET(_request:NextRequest,{params}:Ctx){
 const session=await getServerSession();if(!session)return NextResponse.json({error:"Authentication required."},{status:401});if(!session.role?.isFounderRole)return NextResponse.json({error:"Founder permissions required."},{status:403});
 const {id}=await params;if(!Types.ObjectId.isValid(id))return NextResponse.json({error:"Invalid deliverable."},{status:400});
 await connectToDatabase();const item=await ProjectDeliverable.findById(id);if(!item||!item.storageKey||!item.fileFormat||!item.resourceType)return NextResponse.json({error:"Deliverable file not found."},{status:404});
 if(!process.env.CLOUDINARY_API_KEY||!process.env.CLOUDINARY_API_SECRET)return NextResponse.json({error:"Secure file storage is unavailable."},{status:503});
 const url=cloudinary.utils.private_download_url(item.storageKey,item.fileFormat,{resource_type:item.resourceType,type:"authenticated",expires_at:Math.floor(Date.now()/1000)+300,attachment:true});
 return NextResponse.redirect(url,{headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
}
