import {NextRequest,NextResponse} from "next/server";
import {Types} from "mongoose";
import {connectToDatabase} from "@/lib/db";
import {getAuthenticatedSession} from "@/lib/auth/session";
import {unauthorizedResponse,forbiddenResponse} from "@/lib/auth/authorize";
import MediaCollection from "@/models/MediaCollection";
import cloudinary from "@/lib/cloudinary";
export const dynamic="force-dynamic";
const isAdmin=(s:any)=>Boolean(s?.role?.isFounderRole||s?.role?.canManageUsers);
const allowedKeys=["launch","permanent","advertisement","partner"];
const allowedPlacements=["homepage-after-media","homepage-before-footer","about","services","service-detail","portfolio","blog","blog-article","client-partners"];
export async function GET(req:NextRequest){
 await connectToDatabase();
 const key=req.nextUrl.searchParams.get("key");
 const admin=req.nextUrl.searchParams.get("admin")==="1";
 if(admin){const s=await getAuthenticatedSession(req);if(!s)return unauthorizedResponse();if(!isAdmin(s))return forbiddenResponse("Founder access required.");const rows=await MediaCollection.find({}).sort({priority:-1,updatedAt:-1}).lean();return NextResponse.json({collections:rows},{headers:{"Cache-Control":"private, no-store"}});}
 const now=new Date();const filter:any={enabled:true,$and:[{$or:[{startsAt:null},{startsAt:{$exists:false}},{startsAt:{$lte:now}}]},{$or:[{endsAt:null},{endsAt:{$exists:false}},{endsAt:{$gte:now}}]}]};
 if(key&&allowedKeys.includes(key))filter.key=key;
 const rows=await MediaCollection.find(filter).sort({priority:-1,updatedAt:-1}).lean();
 return NextResponse.json({collections:rows.filter(x=>x.key!=="advertisement"&&x.key!=="partner"||x.approved)},{headers:{"Cache-Control":"public, max-age=30, stale-while-revalidate=60"}});
}
export async function POST(req:NextRequest){
 const s=await getAuthenticatedSession(req);if(!s)return unauthorizedResponse();if(!isAdmin(s))return forbiddenResponse("Founder access required.");
 let b:any;try{b=await req.json()}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}
 if(!allowedKeys.includes(b.key)||!String(b.name||"").trim())return NextResponse.json({error:"A valid collection type and name are required."},{status:400});
 if(b.placement&&!allowedPlacements.includes(b.placement))return NextResponse.json({error:"Invalid placement."},{status:400});
 const items=Array.isArray(b.items)?b.items.map((x:any,i:number)=>({url:String(x.url||""),publicId:String(x.publicId||""),kind:x.kind==="video"?"video":"image",alt:String(x.alt||"").slice(0,180),durationSeconds:Math.min(86400,Math.max(1,Number(x.durationSeconds)||8)),videoCutoffSeconds:Math.min(86400,Math.max(0,Number(x.videoCutoffSeconds)||0)),repeatCount:Math.min(100,Math.max(1,Number(x.repeatCount)||1)),order:i,focalX:Math.min(100,Math.max(0,Number(x.focalX)||50)),focalY:Math.min(100,Math.max(0,Number(x.focalY)||50))})): [];
 if(items.some((x:any)=>!/^https:\/\//i.test(x.url)))return NextResponse.json({error:"Every media item must use HTTPS."},{status:400});
 const data={key:b.key,name:String(b.name).trim().slice(0,140),enabled:b.enabled===true,placement:b.placement||"homepage-after-media",items,startsAt:b.startsAt?new Date(b.startsAt):null,endsAt:b.endsAt?new Date(b.endsAt):null,priority:Math.max(-100,Math.min(100,Number(b.priority)||0)),advertiser:String(b.advertiser||"TGO DevStudio").slice(0,140),approved:b.key==="advertisement"||b.key==="partner"?b.approved===true:true};
 if(data.startsAt&&Number.isNaN(data.startsAt.getTime())||data.endsAt&&Number.isNaN(data.endsAt.getTime()))return NextResponse.json({error:"Invalid campaign schedule."},{status:400});
 await connectToDatabase();let row;
 if(b.id&&Types.ObjectId.isValid(String(b.id)))row=await MediaCollection.findByIdAndUpdate(b.id,{$set:data},{new:true,runValidators:true});
 else row=await MediaCollection.create(data);
 return NextResponse.json({collection:row},{status:b.id?200:201,headers:{"Cache-Control":"private, no-store"}});
}
export async function DELETE(req:NextRequest){
 const s=await getAuthenticatedSession(req);if(!s)return unauthorizedResponse();if(!isAdmin(s))return forbiddenResponse("Founder access required.");
 let b:any;try{b=await req.json()}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}
 await connectToDatabase();const row=await MediaCollection.findById(String(b.id||""));if(!row)return NextResponse.json({error:"Collection not found."},{status:404});
 if(b.deleteStoredMedia===true){for(const item of row.items){if(item.publicId){const type=item.kind==="video"?"video":"image";await cloudinary.uploader.destroy(item.publicId,{resource_type:type});}}}
 await row.deleteOne();return NextResponse.json({status:"ok",deletedStoredMedia:b.deleteStoredMedia===true});
}
