import {NextRequest,NextResponse} from "next/server";
import {connectToDatabase} from "@/lib/db";
import {getAuthenticatedSession} from "@/lib/auth/session";
import {unauthorizedResponse,forbiddenResponse} from "@/lib/auth/authorize";
import MediaCollection from "@/models/MediaCollection";
import cloudinary from "@/lib/cloudinary";
export async function POST(request:NextRequest){
 const session=await getAuthenticatedSession(request);if(!session)return unauthorizedResponse();
 if(!session.role.isFounderRole&&!session.role.canManageUsers)return forbiddenResponse("You do not have permission to delete media.");
 let body:any;try{body=await request.json()}catch{return NextResponse.json({status:"error",message:"Invalid request body."},{status:400})}
 const publicId=String(body.publicId||"");const resourceType=body.resourceType==="video"?"video":"image";
 if(!publicId.startsWith("tgo-devstudio-prime/")||publicId.length>500)return NextResponse.json({status:"error",message:"Only media owned by the TGO media library can be deleted here."},{status:400});
 try{
  const result=await cloudinary.uploader.destroy(publicId,{resource_type:resourceType,invalidate:true});
  if(result.result!=="ok"&&result.result!=="not found")throw new Error("Cloudinary did not confirm deletion.");
  await connectToDatabase();
  const refs=await MediaCollection.updateMany({},{$pull:{items:{publicId}}});
  return NextResponse.json({status:"ok",message:"Stored file deleted and all collection references removed.",cloudinary:result.result,updatedCollections:refs.modifiedCount});
 }catch(error){console.error("[Media delete]",error);return NextResponse.json({status:"error",message:"Cloudinary deletion could not be confirmed. The collection references were not changed."},{status:502})}
}
