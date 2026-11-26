import {NextRequest,NextResponse} from "next/server";
import {getServerSession} from "@/lib/auth/serverSession";
import {connectToDatabase} from "@/lib/db";
import AIExecutionLog from "@/models/AIExecutionLog";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const session=await getServerSession();if(!session)return NextResponse.json({error:"Authentication required."},{status:401});
 if(!session.role?.isFounderRole)return NextResponse.json({error:"Founder access required."},{status:403});
 await connectToDatabase();
 const params=request.nextUrl.searchParams;const limit=Math.min(200,Math.max(1,Number(params.get("limit")||100)));
 const filter:Record<string,unknown>={};
 const status=params.get("status");if(status&&["success","failure","fallback"].includes(status))filter.status=status;
 const provider=params.get("provider");if(provider)filter.providerId=provider;
 const model=params.get("model");if(model)filter.model={$regex:model.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),$options:"i"};
 const feature=params.get("feature");if(feature)filter.feature=feature;
 const since=params.get("since");if(since){const date=new Date(since);if(!Number.isNaN(date.getTime()))filter.createdAt={$gte:date};}
 const [logs,total,summary]=await Promise.all([
  AIExecutionLog.find(filter).sort({createdAt:-1}).limit(limit).lean(),
  AIExecutionLog.countDocuments(filter),
  AIExecutionLog.aggregate([{ $match: since&&filter.createdAt?{createdAt:filter.createdAt}:{} },{$group:{_id:"$status",count:{$sum:1},avgDurationMs:{$avg:"$durationMs"}}}])
 ]);
 return NextResponse.json({logs:logs.map(row=>({id:String(row._id),traceId:row.traceId,feature:row.feature,providerId:row.providerId,providerName:row.providerName,providerType:row.providerType,model:row.model,status:row.status,durationMs:row.durationMs,inputTokens:row.inputTokens,outputTokens:row.outputTokens,httpStatus:row.httpStatus,errorCode:row.errorCode,errorMessage:row.errorMessage,fallbackFrom:row.fallbackFrom,createdAt:row.createdAt})),total,summary},{headers:{"Cache-Control":"private, no-store"}});
}
