import {NextRequest,NextResponse} from "next/server";
import {getAuthenticatedSession} from "@/lib/auth/session";
import {unauthorizedResponse,forbiddenResponse,requireAnyContentPermission} from "@/lib/auth/authorize";
import cloudinary from "@/lib/cloudinary";
const MAX_FILE_SIZE_BYTES=50*1024*1024;
const IMAGE_TYPES=["image/jpeg","image/png","image/webp","image/avif","image/gif"];
const FOLDERS=["case-studies","team","about","blog","services","job-applications","launch","homepage-media","advertisements","partners"] as const;
export async function POST(request:NextRequest){
 let form:FormData;try{form=await request.formData()}catch{return NextResponse.json({status:"error",message:"Invalid upload form."},{status:400})}
 const file=form.get("file"),requested=form.get("folder");const folder=typeof requested==="string"&&FOLDERS.includes(requested as typeof FOLDERS[number])?requested:"case-studies";
 if(!(file instanceof File))return NextResponse.json({status:"error",message:"No file provided."},{status:400});
 const isImage=IMAGE_TYPES.includes(file.type),isVideo=file.type.startsWith("video/");
 if(!isImage&&!isVideo)return NextResponse.json({status:"error",message:"Audio-only uploads are not supported. Embedded video audio is stripped from public playback."},{status:400});
 if(file.size<=0||file.size>MAX_FILE_SIZE_BYTES)return NextResponse.json({status:"error",message:"File must be between 1 byte and 50MB."},{status:400});
 if(folder!=="job-applications"){
  const session=await getAuthenticatedSession(request);if(!session)return unauthorizedResponse();
  const permissionType=["services"].includes(folder)?"services":folder==="team"?"team":folder==="blog"?"blog":folder==="about"?"about":(["launch","homepage-media","advertisements","partners"].includes(folder)?"homeSettings":"caseStudies");
  if(!requireAnyContentPermission(session,permissionType))return forbiddenResponse("You do not have permission to upload media.");
 }
 const buffer=Buffer.from(await file.arrayBuffer());
 try{
  const result=await new Promise<{secure_url:string;public_id:string}>((resolve,reject)=>{const stream=cloudinary.uploader.upload_stream({folder:`tgo-devstudio-prime/${folder}`,resource_type:isVideo?"video":"image"},(error,uploaded)=>{if(error||!uploaded)return reject(error||new Error("Cloudinary returned no upload result."));resolve({secure_url:uploaded.secure_url,public_id:uploaded.public_id})});stream.end(buffer)});
  return NextResponse.json({status:"ok",url:result.secure_url,publicId:result.public_id});
 }catch(error){console.error("[Media upload]",error);return NextResponse.json({status:"error",message:"Cloud media upload failed."},{status:502})}
}
