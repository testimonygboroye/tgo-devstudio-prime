import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireAnyContentPermission } from "@/lib/auth/authorize";
import cloudinary from "@/lib/cloudinary";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg","image/png","image/webp","image/avif","video/mp4","video/webm","video/quicktime"];
const ALLOWED_FOLDERS = ["case-studies","team","about","blog","services","job-applications","launch","homepage-media","advertisements","partners"] as const;
export async function POST(request: NextRequest) {
 const formData=await request.formData();const file=formData.get("file");const requestedFolder=formData.get("folder");
 const folder=typeof requestedFolder==="string"&&ALLOWED_FOLDERS.includes(requestedFolder as (typeof ALLOWED_FOLDERS)[number])?requestedFolder:"case-studies";
 if(folder!=="job-applications"){const session=await getAuthenticatedSession(request);if(!session)return unauthorizedResponse();const permissionType=folder==="services"?"services":folder==="team"?"team":folder==="blog"?"blog":folder==="about"?"about":(["launch","homepage-media","advertisements","partners"].includes(folder)?"homeSettings":"caseStudies");if(!requireAnyContentPermission(session,permissionType))return forbiddenResponse("You do not have permission to upload media.");}
 if(!(file instanceof File))return NextResponse.json({status:"error",message:"No file provided."},{status:400});
 if(!ALLOWED_MIME_TYPES.includes(file.type))return NextResponse.json({status:"error",message:"Only JPEG, PNG, WebP, AVIF, MP4, WebM and MOV are accepted. Audio is not supported."},{status:400});
 if(file.size>MAX_FILE_SIZE_BYTES)return NextResponse.json({status:"error",message:"File is too large. Maximum size is 50MB."},{status:400});
 const buffer=Buffer.from(await file.arrayBuffer());
 const uploaded=await new Promise<{secure_url:string;public_id:string}>((resolve,reject)=>{const stream=cloudinary.uploader.upload_stream({folder:`tgo-devstudio-prime/${folder}`,resource_type:file.type.startsWith("video/")?"video":"image"},(error,result)=>{if(error||!result)return reject(error||new Error("Upload failed."));resolve({secure_url:result.secure_url,public_id:result.public_id});});stream.end(buffer);});
 return NextResponse.json({status:"ok",url:uploaded.secure_url,publicId:uploaded.public_id});
}
