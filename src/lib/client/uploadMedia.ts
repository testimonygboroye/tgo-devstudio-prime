"use client";
export type UploadedMedia={url:string;publicId:string};
export async function uploadMediaDirect(file:File,folder:string):Promise<UploadedMedia>{
 const resourceType=file.type.startsWith("video/")?"video":"image";
 const signed=await fetch("/api/media/upload-signature",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",cache:"no-store",body:JSON.stringify({folder,resourceType})});
 const signature=await signed.json();
 if(!signed.ok||signature.status!=="ok")throw new Error(signature.message||"Could not authorize media upload.");
 const body=new FormData();
 body.append("file",file);body.append("api_key",signature.apiKey);body.append("timestamp",String(signature.timestamp));
 body.append("folder",signature.folder);body.append("signature",signature.signature);
 const endpoint="https://api.cloudinary.com/v1_1/"+encodeURIComponent(signature.cloudName)+"/"+resourceType+"/upload";
 const response=await fetch(endpoint,{method:"POST",body});
 const result=await response.json();
 if(!response.ok||!result.secure_url||!result.public_id)throw new Error(result.error?.message||"Cloud media upload failed.");
 return {url:String(result.secure_url),publicId:String(result.public_id)};
}
