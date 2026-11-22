import {NextRequest,NextResponse} from "next/server";
import {Types} from "mongoose";
import {connectToDatabase} from "@/lib/db";
import MediaCollection from "@/models/MediaCollection";
import MediaCollectionEvent from "@/models/MediaCollectionEvent";
import {createHash} from "crypto";
export async function POST(req:NextRequest){
 let b:any;try{b=await req.json()}catch{return NextResponse.json({error:"Invalid payload"},{status:400})}
 if(!Types.ObjectId.isValid(String(b.collectionId||""))||!["impression","click","video_play","video_complete"].includes(b.eventType)||typeof b.visitorKey!=="string"||b.visitorKey.length>100)return NextResponse.json({error:"Invalid event"},{status:400});
 await connectToDatabase();const now=new Date();const campaign=await MediaCollection.findOne({_id:b.collectionId,enabled:true,approved:true,$and:[{$or:[{startsAt:null},{startsAt:{$exists:false}},{startsAt:{$lte:now}}]},{$or:[{endsAt:null},{endsAt:{$exists:false}},{endsAt:{$gte:now}}]}]});if(!campaign)return NextResponse.json({ok:true});
 const visitorHash=createHash("sha256").update(b.visitorKey).digest("hex");
 if(b.eventType==="impression"){const since=new Date();since.setHours(0,0,0,0);const count=await MediaCollectionEvent.countDocuments({collectionId:campaign._id,visitorHash,eventType:"impression",createdAt:{$gte:since}});if(count>=Math.max(1,campaign.frequencyCapPerDay||2))return NextResponse.json({ok:true,deduplicated:true,frequencyCapped:true});}
 await MediaCollectionEvent.create({collectionId:campaign._id,itemId:Types.ObjectId.isValid(String(b.itemId||""))?b.itemId:null,eventType:b.eventType,visitorHash,placement:String(b.placement||campaign.placement).slice(0,80),path:String(req.headers.get("referer")||"").slice(0,500),device:/mobile|android|iphone/i.test(req.headers.get("user-agent")||"")?"mobile":"desktop"});
 return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
