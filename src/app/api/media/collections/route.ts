import {NextRequest,NextResponse} from "next/server";
import {Types} from "mongoose";
import {connectToDatabase} from "@/lib/db";
import {getAuthenticatedSession} from "@/lib/auth/session";
import {unauthorizedResponse,forbiddenResponse,requireAnyContentPermission} from "@/lib/auth/authorize";
import MediaCollection from "@/models/MediaCollection";
import LaunchSettings from "@/models/LaunchSettings";
import MediaCollectionEvent from "@/models/MediaCollectionEvent";
import cloudinary from "@/lib/cloudinary";
export const dynamic="force-dynamic";
const isAdmin=(s:any)=>Boolean(s?.role?.isFounderRole||s?.role?.canManageUsers||requireAnyContentPermission(s,"homeSettings"));
const allowedKeys=["launch","permanent","advertisement","partner"];
const allowedPlacements=["homepage-after-media","homepage-before-footer","about","services","service-detail","portfolio","blog","blog-article","client-partners"];
function cloudinaryPublicId(url:string){try{const u=new URL(url);if(!u.hostname.endsWith("cloudinary.com"))return "";const marker="/upload/";const i=u.pathname.indexOf(marker);if(i<0)return "";let parts=u.pathname.slice(i+marker.length).split("/");if(parts[0]?.includes(","))parts=parts.slice(1);const version=parts[0]||"";if(version.startsWith("v")&&version.length>1&&Number.isFinite(Number(version.slice(1))))parts=parts.slice(1);const last=parts.pop()||"";const dot=last.lastIndexOf(".");parts.push(dot>0?last.slice(0,dot):last);return parts.join("/")}catch{return ""}}
async function migrateLegacyHomepageMedia(key:string){
 if(key!=="launch"&&key!=="permanent")return;
 if(await MediaCollection.exists({key}))return;
 const legacy=await LaunchSettings.findOne().lean();if(!legacy)return;
 const source=key==="launch"?[{url:legacy.videoUrl,kind:"video"},{url:legacy.flyerUrl,kind:"image"}]:[{url:legacy.afterLaunchVideoUrl,kind:"video"},{url:legacy.afterLaunchFlyerUrl,kind:"image"}];
 const items=source.filter(x=>typeof x.url==="string"&&x.url.startsWith("https://")).map((x:any,index:number)=>({url:x.url,publicId:cloudinaryPublicId(x.url),kind:x.kind,alt:key==="launch"?"TGO launch media":"TGO permanent media",durationSeconds:key==="launch"?Math.max(1,Number(legacy.flyerDurationMinutes||0)*60+Number(legacy.flyerDurationSeconds??legacy.flyerSeconds??8)):8,videoCutoffSeconds:key==="launch"&&legacy.useVideoDurationOverride?Math.max(0,Number(legacy.videoDurationHours||0)*3600+Number(legacy.videoDurationMinutes||0)*60+Number(legacy.videoDurationSeconds||0)):0,repeatCount:1,order:index,focalX:50,focalY:50}));
 if(items.length)await MediaCollection.create({key,name:key==="launch"?"Launch Media (migrated)":"Permanent Media (migrated)",enabled:legacy.enabled===true,placement:"homepage-after-media",items,approved:true,advertiser:"TGO DevStudio"});
}
export async function GET(req:NextRequest){
 await connectToDatabase();
 const key=req.nextUrl.searchParams.get("key"),placement=req.nextUrl.searchParams.get("placement"),admin=req.nextUrl.searchParams.get("admin")==="1";
 if(admin){await migrateLegacyHomepageMedia("launch");await migrateLegacyHomepageMedia("permanent");}else if(key==="launch"||key==="permanent")await migrateLegacyHomepageMedia(key);
 if(admin){
  const s=await getAuthenticatedSession(req);if(!s)return unauthorizedResponse();if(!isAdmin(s))return forbiddenResponse("Founder access required.");
  const [rows,events,placements,devices]=await Promise.all([MediaCollection.find({}).sort({priority:-1,updatedAt:-1}).lean(),MediaCollectionEvent.aggregate([{$group:{_id:{collectionId:"$collectionId",eventType:"$eventType"},count:{$sum:1}}}]),MediaCollectionEvent.aggregate([{$match:{eventType:"impression"}},{$group:{_id:{collectionId:"$collectionId",placement:"$placement"},count:{$sum:1}}}]),MediaCollectionEvent.aggregate([{$match:{eventType:"impression"}},{$group:{_id:{collectionId:"$collectionId",device:"$device"},count:{$sum:1}}}])]);
  const analytics:Record<string,Record<string,number>>={};for(const e of events){const id=String(e._id.collectionId);analytics[id]??={};analytics[id][e._id.eventType]=e.count;}for(const row of rows){const a=analytics[String(row._id)]||{};a.ctr=a.impression?Number(((a.click||0)/a.impression*100).toFixed(2)):0;analytics[String(row._id)]=a;}for(const e of placements){const id=String(e._id.collectionId);analytics[id]??={};analytics[id]["placement:"+e._id.placement]=e.count;}for(const e of devices){const id=String(e._id.collectionId);analytics[id]??={};analytics[id]["device:"+e._id.device]=e.count;}
  return NextResponse.json({collections:rows.map(x=>({...x,analytics:analytics[String(x._id)]||{}}))},{headers:{"Cache-Control":"private, no-store"}});
 }
 const now=new Date();const filter:any={enabled:true,$and:[{$or:[{startsAt:null},{startsAt:{$exists:false}},{startsAt:{$lte:now}}]},{$or:[{endsAt:null},{endsAt:{$exists:false}},{endsAt:{$gte:now}}]}]};
 if(key&&allowedKeys.includes(key))filter.key=key;if(placement&&allowedPlacements.includes(placement))filter.placement=placement;
 const rows=await MediaCollection.find(filter).sort({priority:-1,updatedAt:-1}).lean();
 const hasCollection=key==="launch"||key==="permanent"?Boolean(await MediaCollection.exists({key})):false;
 const publicRows=rows.filter(x=>x.key!=="advertisement"&&x.key!=="partner"||x.approved).filter(x=>placement==="client-partners"?x.key==="partner":placement?x.key==="advertisement":key==="launch"||key==="permanent"?x.key===key:true);
 return NextResponse.json({collections:publicRows,hasCollection},{headers:{"Cache-Control":"public, max-age=20, stale-while-revalidate=40"}});
}
export async function POST(req:NextRequest){
 const s=await getAuthenticatedSession(req);if(!s)return unauthorizedResponse();if(!isAdmin(s))return forbiddenResponse("Founder access required.");
 let b:any;try{b=await req.json()}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}
 if(!allowedKeys.includes(b.key)||!String(b.name||"").trim())return NextResponse.json({error:"A valid collection type and name are required."},{status:400});
 if(b.placement&&!allowedPlacements.includes(b.placement))return NextResponse.json({error:"Invalid placement."},{status:400});
 if(b.key==="partner"&&b.placement!=="client-partners")return NextResponse.json({error:"Partner recommendations must use the dedicated Client Portal placement."},{status:400});
 if(b.key==="advertisement"&&b.placement==="client-partners")return NextResponse.json({error:"Ordinary advertisements cannot be placed inside the Client Portal."},{status:400});
 if(b.id&&!Types.ObjectId.isValid(String(b.id)))return NextResponse.json({error:"Invalid collection ID."},{status:400});
 const items=Array.isArray(b.items)?b.items.map((x:any,i:number)=>({url:String(x.url||""),publicId:String(x.publicId||""),kind:x.kind==="video"?"video":"image",alt:String(x.alt||"").slice(0,180),durationSeconds:Math.min(86400,Math.max(1,Number(x.durationSeconds)||8)),videoCutoffSeconds:Math.min(86400,Math.max(0,Number(x.videoCutoffSeconds)||0)),repeatCount:Math.min(100,Math.max(1,Number(x.repeatCount)||1)),order:i,focalX:Math.min(100,Math.max(0,Number.isFinite(Number(x.focalX))?Number(x.focalX):50)),focalY:Math.min(100,Math.max(0,Number.isFinite(Number(x.focalY))?Number(x.focalY):50))})): [];
 if(items.some((x:any)=>!/^https:\/\//i.test(x.url)))return NextResponse.json({error:"Every media item must use HTTPS."},{status:400});
 const destinationUrl=String(b.destinationUrl||"").trim().slice(0,1000);if(destinationUrl&&!/^https:\/\//i.test(destinationUrl))return NextResponse.json({error:"Campaign destination must use HTTPS."},{status:400});
 const startsAt=b.startsAt?new Date(b.startsAt):null,endsAt=b.endsAt?new Date(b.endsAt):null;
 if(startsAt&&Number.isNaN(startsAt.getTime())||endsAt&&Number.isNaN(endsAt.getTime())||startsAt&&endsAt&&endsAt<=startsAt)return NextResponse.json({error:"Enter a valid campaign schedule; end must be after start."},{status:400});
 const campaignType=b.campaignType==="external"?"external":"tgo";const data={key:b.key,name:String(b.name).trim().slice(0,140),enabled:b.enabled===true,placement:b.key==="partner"?"client-partners":b.key==="launch"||b.key==="permanent"?"homepage-after-media":b.placement||"homepage-after-media",items,startsAt,endsAt,priority:Math.max(-100,Math.min(100,Number(b.priority)||0)),advertiser:String(b.advertiser||"TGO DevStudio").slice(0,140),approved:b.key==="advertisement"?(campaignType==="tgo"||b.approved===true):b.key==="partner"?b.approved===true:true,destinationUrl,campaignDescription:String(b.campaignDescription||"").trim().slice(0,400),ctaLabel:String(b.ctaLabel||"Learn more").trim().slice(0,40),campaignType,frequencyCapPerDay:Math.max(1,Math.min(20,Number(b.frequencyCapPerDay)||2)),maxPerPageView:Math.max(1,Math.min(5,Number(b.maxPerPageView)||1)),deviceTarget:["mobile","desktop"].includes(b.deviceTarget)?b.deviceTarget:"all"};
 await connectToDatabase();const row=b.id?await MediaCollection.findByIdAndUpdate(b.id,{$set:data},{new:true,runValidators:true}):(b.key==="launch"||b.key==="permanent")?await MediaCollection.findOneAndUpdate({key:b.key},{$set:data},{new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true}):await MediaCollection.create(data);
 if(!row)return NextResponse.json({error:"Collection not found."},{status:404});
 return NextResponse.json({collection:row},{status:b.id?200:201,headers:{"Cache-Control":"private, no-store"}});
}
export async function DELETE(req:NextRequest){
 const s=await getAuthenticatedSession(req);if(!s)return unauthorizedResponse();if(!isAdmin(s))return forbiddenResponse("Founder access required.");
 let b:any;try{b=await req.json()}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}
 if(!Types.ObjectId.isValid(String(b.id||"")))return NextResponse.json({error:"Invalid collection ID."},{status:400});
 await connectToDatabase();const row=await MediaCollection.findById(b.id);if(!row)return NextResponse.json({error:"Collection not found."},{status:404});
 if(b.deleteStoredMedia===true){
  for(const item of row.items){if(!item.publicId)continue;try{const result=await cloudinary.uploader.destroy(item.publicId,{resource_type:item.kind==="video"?"video":"image",invalidate:true});if(result.result!=="ok"&&result.result!=="not found")throw new Error("Deletion was not confirmed.");await MediaCollection.updateMany({},{$pull:{items:{publicId:item.publicId}}});const legacy=await LaunchSettings.findOne();if(legacy){for(const field of ["videoUrl","flyerUrl","afterLaunchVideoUrl","afterLaunchFlyerUrl"] as const){if(typeof legacy[field]==="string"&&legacy[field].includes(item.publicId))legacy[field]="";}await legacy.save();}}catch(error){console.error("[Collection media cleanup]",error);return NextResponse.json({error:"A stored media file could not be deleted. The collection was retained; check Cloudinary before retrying."},{status:502});}}
 }
 await MediaCollectionEvent.deleteMany({collectionId:row._id});await row.deleteOne();
 return NextResponse.json({status:"ok",deletedStoredMedia:b.deleteStoredMedia===true});
}
