import {NextRequest,NextResponse} from "next/server";
import {Types} from "mongoose";
import {connectToDatabase} from "@/lib/db";
import MediaCollection from "@/models/MediaCollection";
export async function GET(req:NextRequest){const id=req.nextUrl.searchParams.get("id");if(!Types.ObjectId.isValid(String(id||"")))return NextResponse.redirect(new URL("/",req.url));await connectToDatabase();const now=new Date();const c=await MediaCollection.findOne({_id:id,enabled:true,approved:true,$and:[{$or:[{startsAt:null},{startsAt:{$exists:false}},{startsAt:{$lte:now}}]},{$or:[{endsAt:null},{endsAt:{$exists:false}},{endsAt:{$gte:now}}]}]}).lean();const url=c?.destinationUrl||c?.items?.[0]?.url;if(!url)return NextResponse.redirect(new URL("/",req.url));return NextResponse.redirect(url);}
