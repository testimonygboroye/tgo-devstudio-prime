import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireAnyContentPermission } from "@/lib/auth/authorize";
import cloudinary from "@/lib/cloudinary";
const FOLDERS=["case-studies","team","about","blog","services","homepage-media"] as const;
export async function POST(request:NextRequest){
 const session=await getAuthenticatedSession(request);if(!session)return unauthorizedResponse();
 const body=await request.json() as {folder?:string;resourceType?:"image"|"video"};
 const folder=body.folder;
 const resourceType=body.resourceType;
 if(!folder||!FOLDERS.includes(folder as typeof FOLDERS[number])||!resourceType||!["image","video"].includes(resourceType))return NextResponse.json({status:"error",message:"Unsupported upload destination."},{status:400});
 const permission=folder==="services"?"services":folder==="team"?"team":folder==="blog"?"blog":folder==="about"?"about":folder==="homepage-media"?"homeSettings":"caseStudies";
 if(!requireAnyContentPermission(session,permission))return forbiddenResponse("You do not have permission to upload media here.");
 const config=cloudinary.config();
 if(!config.cloud_name||!config.api_key||!config.api_secret)return NextResponse.json({status:"error",message:"Cloud media storage is not configured."},{status:503});
 const timestamp=Math.floor(Date.now()/1000);
 const cloudFolder="tgo-devstudio-prime/"+folder;
 const signature=cloudinary.utils.api_sign_request({folder:cloudFolder,timestamp},config.api_secret);
 return NextResponse.json({status:"ok",cloudName:config.cloud_name,apiKey:config.api_key,timestamp,folder:cloudFolder,signature,resourceType});
}
