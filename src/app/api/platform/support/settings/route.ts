import {NextRequest,NextResponse} from "next/server";
import {authorizePlatformPermission} from "@/lib/platform/authorize";
import {connectToDatabase} from "@/lib/db";
import SupportSettings from "@/models/SupportSettings";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
export const dynamic="force-dynamic";
function fail(error:string,status=400){return NextResponse.json({ok:false,error},{status});}
const defaults={low:{firstResponse:48,resolution:120},normal:{firstResponse:24,resolution:72},high:{firstResponse:8,resolution:24},urgent:{firstResponse:2,resolution:8}};
export async function GET(){
 const auth=await authorizePlatformPermission("support.view");
 if(!auth.allowed)return fail("You do not have permission to view support settings.",auth.reason==="unauthenticated"?401:403);
 await connectToDatabase();
 const settings=await SupportSettings.findOneAndUpdate({key:"global"},{$setOnInsert:{key:"global",slaHours:defaults}},{upsert:true,new:true,setDefaultsOnInsert:true}).lean();
 return NextResponse.json({ok:true,settings},{headers:{"Cache-Control":"private, no-store"}});
}
export async function PATCH(request:NextRequest){
 const auth=await authorizePlatformPermission("support.tickets.manage");
 if(!auth.allowed)return fail("You do not have permission to manage support settings.",auth.reason==="unauthenticated"?401:403);
 let body:Record<string,unknown>;try{body=await request.json();}catch{return fail("Invalid request body.");}
 const categories=Array.isArray(body.categories)?[...new Set(body.categories.filter((x):x is string=>typeof x==="string").map(x=>x.trim()).filter(x=>x.length>=2&&x.length<=80))]:null;
 if(!categories||categories.length<1||categories.length>30)return fail("Provide between 1 and 30 valid support categories.");
 const sla=body.slaHours as Record<string,Record<string,unknown>>|undefined;
 const priorities=["low","normal","high","urgent"] as const;
 const slaHours:Record<string,{firstResponse:number;resolution:number}>={};
 for(const p of priorities){const v=sla?.[p];const firstResponse=Number(v?.firstResponse),resolution=Number(v?.resolution);if(!Number.isInteger(firstResponse)||!Number.isInteger(resolution)||firstResponse<1||firstResponse>720||resolution<firstResponse||resolution>1440)return fail("SLA values must be whole hours; resolution must be at least first response.");slaHours[p]={firstResponse,resolution};}
 await connectToDatabase();
 const settings=await SupportSettings.findOneAndUpdate({key:"global"},{$set:{categories,slaHours,notifications:{emailEnabled:body.emailEnabled!==false,whatsappEnabled:body.whatsappEnabled===true},aiEnabled:body.aiEnabled===true,updatedBy:String(auth.session!.user._id)}},{upsert:true,new:true,setDefaultsOnInsert:true});
 await writePlatformAuditEvent({actorType:"human",actorId:String(auth.session!.user._id),actorLabel:auth.session!.user.name,action:"support.settings_updated",module:"support",targetType:"support_settings",targetId:String(settings._id),outcome:"success",metadata:{categoryCount:categories.length,aiEnabled:settings.aiEnabled,whatsappEnabled:settings.notifications.whatsappEnabled}});
 return NextResponse.json({ok:true,settings});
}
