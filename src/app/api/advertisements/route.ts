import { NextRequest,NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Advertisement,{AD_PLACEMENTS,type AdPlacement} from "@/models/Advertisement";
import {getAuthenticatedSession} from "@/lib/auth/session";
import {unauthorizedResponse,forbiddenResponse,requireContentPermission} from "@/lib/auth/authorize";
export const dynamic="force-dynamic";
const canManage=(session:any)=>requireContentPermission(session,"homeSettings","edit");
const safeUrl=(value:string)=>{try{const u=new URL(value);return u.protocol==="https:";}catch{return false;}};
export async function GET(request:NextRequest){
 await connectToDatabase();
 const session=await getAuthenticatedSession(request);
 const admin=request.nextUrl.searchParams.get("admin")==="1";
 if(admin){if(!session)return unauthorizedResponse();if(!canManage(session))return forbiddenResponse("You cannot manage advertisements.");const items=await Advertisement.find({}).sort({updatedAt:-1}).lean();return NextResponse.json({status:"ok",items},{headers:{"Cache-Control":"no-store"}});}
 const placement=request.nextUrl.searchParams.get("placement") as AdPlacement|null;
 if(!placement||!AD_PLACEMENTS.includes(placement))return NextResponse.json({status:"ok",items:[]});
 const now=new Date();
 const items=await Advertisement.find({status:"active",approved:true,placements:placement,$and:[{$or:[{startsAt:null},{startsAt:{$exists:false}},{startsAt:{$lte:now}}]},{$or:[{endsAt:null},{endsAt:{$exists:false}},{endsAt:{$gte:now}}]}]}).sort({displayOrder:1,createdAt:-1}).limit(2).lean();
 return NextResponse.json({status:"ok",items},{headers:{"Cache-Control":"public, max-age=60, stale-while-revalidate=120"}});
}
export async function POST(request:NextRequest){
 const session=await getAuthenticatedSession(request);if(!session)return unauthorizedResponse();if(!canManage(session))return forbiddenResponse("You cannot manage advertisements.");
 const body=await request.json();const payload=validate(body);if(!payload.ok)return NextResponse.json({status:"error",message:payload.message},{status:400});
 await connectToDatabase();const item=await Advertisement.create(payload.value);return NextResponse.json({status:"ok",item},{status:201});
}
export async function PUT(request:NextRequest){
 const session=await getAuthenticatedSession(request);if(!session)return unauthorizedResponse();if(!canManage(session))return forbiddenResponse("You cannot manage advertisements.");
 const body=await request.json();if(!body.id)return NextResponse.json({status:"error",message:"Advertisement ID is required."},{status:400});
 const payload=validate(body);if(!payload.ok)return NextResponse.json({status:"error",message:payload.message},{status:400});
 await connectToDatabase();const item=await Advertisement.findByIdAndUpdate(body.id,{$set:payload.value},{new:true,runValidators:true});if(!item)return NextResponse.json({status:"error",message:"Advertisement not found."},{status:404});
 return NextResponse.json({status:"ok",item});
}
export async function DELETE(request:NextRequest){
 const session=await getAuthenticatedSession(request);if(!session)return unauthorizedResponse();if(!canManage(session))return forbiddenResponse("You cannot manage advertisements.");
 const id=request.nextUrl.searchParams.get("id");if(!id)return NextResponse.json({status:"error",message:"Advertisement ID is required."},{status:400});
 await connectToDatabase();const item=await Advertisement.findByIdAndDelete(id);if(!item)return NextResponse.json({status:"error",message:"Advertisement not found."},{status:404});return NextResponse.json({status:"ok"});
}
function validate(body:any):{ok:true;value:any}|{ok:false;message:string}{
 const title=String(body.title||"").trim();if(!title)return{ok:false,message:"Add an advertisement title."};
 const media=Array.isArray(body.media)?body.media.slice(0,30).map((m:any)=>({kind:m.kind==="video"?"video":"image",url:String(m.url||"").trim(),altText:String(m.altText||"").trim().slice(0,180),durationSeconds:Math.min(86400,Math.max(1,Number(m.durationSeconds)||8))})):[];
 if(!media.length||media.some((m:any)=>!safeUrl(m.url)))return{ok:false,message:"Upload at least one image or video. Media URLs must use HTTPS."};
 const placements=Array.isArray(body.placements)?body.placements.filter((p:string)=>AD_PLACEMENTS.includes(p as AdPlacement)):[];
 const targetUrl=String(body.targetUrl||"").trim();if(targetUrl&&!safeUrl(targetUrl))return{ok:false,message:"The destination link must use HTTPS."};
 const startsAt=body.startsAt?new Date(body.startsAt):undefined,endsAt=body.endsAt?new Date(body.endsAt):undefined;
 if(startsAt&&Number.isNaN(startsAt.getTime())||endsAt&&Number.isNaN(endsAt.getTime()))return{ok:false,message:"Enter valid campaign dates."};
 if(startsAt&&endsAt&&endsAt<=startsAt)return{ok:false,message:"The end date must be after the start date."};
 const requested=String(body.status||"draft");const status=["draft","active","paused","scheduled","expired"].includes(requested)?requested:"draft";
 const category=["tgo","external","partner"].includes(body.category)?body.category:"external";
 return{ok:true,value:{title:title.slice(0,120),description:String(body.description||"").trim().slice(0,360),category,status,placements,media,ctaLabel:String(body.ctaLabel||"Learn more").trim().slice(0,40),targetUrl,startsAt,endsAt,displayOrder:Math.max(0,Number(body.displayOrder)||0),frequencyCap:Math.min(20,Math.max(0,Number(body.frequencyCap??2)||0)),approved:category==="tgo"||body.approved===true}};
}
