import {NextRequest,NextResponse} from "next/server";
import {Types} from "mongoose";
import {createHash} from "crypto";
import {connectToDatabase} from "@/lib/db";
import MediaCollection from "@/models/MediaCollection";
import MediaCollectionEvent from "@/models/MediaCollectionEvent";

type EventType="impression"|"click"|"video_play"|"video_complete";
type TrackPayload={collectionId?:unknown;eventType?:unknown;visitorKey?:unknown;pageViewKey?:unknown;placement?:unknown;itemId?:unknown};
const EVENT_TYPES:EventType[]=["impression","click","video_play","video_complete"];

export async function POST(req:NextRequest){
 let body:TrackPayload;
 try{const parsed:unknown=await req.json();if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))return NextResponse.json({error:"Invalid event"},{status:400});body=parsed as TrackPayload;}
 catch{return NextResponse.json({error:"Invalid payload"},{status:400});}
 const collectionId=String(body.collectionId||"");
 const rawEventType=body.eventType;
 const visitorKey=typeof body.visitorKey==="string"?body.visitorKey:"";
 const pageViewKey=typeof body.pageViewKey==="string"?body.pageViewKey:"";
 if(!Types.ObjectId.isValid(collectionId)||typeof rawEventType!=="string"||!EVENT_TYPES.includes(rawEventType as EventType)||!visitorKey||visitorKey.length>100||!pageViewKey||pageViewKey.length>100)return NextResponse.json({error:"Invalid event"},{status:400});
 const eventType=rawEventType as EventType;
 await connectToDatabase();
 const now=new Date();
 const campaign=await MediaCollection.findOne({_id:collectionId,enabled:true,approved:true,$and:[{$or:[{startsAt:null},{startsAt:{$exists:false}},{startsAt:{$lte:now}}]},{$or:[{endsAt:null},{endsAt:{$exists:false}},{endsAt:{$gte:now}}]}]});
 if(!campaign)return NextResponse.json({ok:true});
 const visitorHash=createHash("sha256").update(visitorKey).digest("hex");
 const placement=String(body.placement||campaign.placement).slice(0,80);
 let pagePath="/";
 try{pagePath=(new URL(req.headers.get("referer")||"https://tgo.dev/").pathname+"#"+pageViewKey).slice(0,400)}catch{}
 if(eventType==="impression"){
  const since=new Date();since.setHours(0,0,0,0);
  const [dailyCount,pageCount]=await Promise.all([
   MediaCollectionEvent.countDocuments({collectionId:campaign._id,visitorHash,eventType,createdAt:{$gte:since}}),
   MediaCollectionEvent.countDocuments({collectionId:campaign._id,visitorHash,eventType,placement,path:pagePath})
  ]);
  if(dailyCount>=Math.max(1,campaign.frequencyCapPerDay||2))return NextResponse.json({ok:true,deduplicated:true,frequencyCapped:true});
  if(pageCount>=Math.max(1,campaign.maxPerPageView||1))return NextResponse.json({ok:true,deduplicated:true,pageCapped:true});
 }
 await MediaCollectionEvent.create({collectionId:campaign._id,itemId:Types.ObjectId.isValid(String(body.itemId||""))?new Types.ObjectId(String(body.itemId)):null,eventType,visitorHash,placement,path:pagePath,device:/mobile|android|iphone/i.test(req.headers.get("user-agent")||"")?"mobile":"desktop"});
 return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
