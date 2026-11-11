import {NextRequest,NextResponse} from "next/server";
import {Types} from "mongoose";
import {getServerSession} from "@/lib/auth/serverSession";
import {connectToDatabase} from "@/lib/db";
import MarketingCampaign from "@/models/MarketingCampaign";
import MarketingCampaignDelivery from "@/models/MarketingCampaignDelivery";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import {sendNotificationEmail} from "@/lib/email/sendEmail";
import {generateUnsubscribeToken} from "@/lib/newsletter/unsubscribeToken";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
import {enqueueWebhookDeliveries} from "@/lib/integrations/webhooks";
export const runtime="nodejs";export const dynamic="force-dynamic";
const fail=(message:string,status=400)=>NextResponse.json({error:message},{status});
async function founder(){const session=await getServerSession();if(!session)return{response:fail("Authentication required.",401)}as const;if(!session.role.isFounderRole)return{response:fail("Founder access required.",403)}as const;return{session}as const;}
function escapeHtml(value:string){return value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));}
export async function POST(request:NextRequest){
 const auth=await founder();if("response"in auth)return auth.response;let b:Record<string,unknown>;try{b=await request.json();}catch{return fail("Invalid request body.");}
 const id=String(b.campaignId||"");if(!Types.ObjectId.isValid(id))return fail("A valid campaign ID is required.");
 await connectToDatabase();const campaign=await MarketingCampaign.findById(id);if(!campaign)return fail("Campaign not found.",404);
 if(campaign.channel!=="email")return fail("SMS dispatch is disabled until a recorded SMS opt-in and verified sender identity are implemented.",409);
 if(b.action==="queue"){
  if(campaign.status!=="draft"&&campaign.status!=="ready")return fail("Only a draft or ready campaign can be queued.",409);
  if(campaign.audience!=="newsletter_subscribers")return fail("Only the explicitly subscribed newsletter audience is currently supported.",409);
  const subscribers=await NewsletterSubscriber.find({status:"subscribed"}).select("_id email").lean();
  if(!subscribers.length)return fail("There are no currently subscribed newsletter recipients.",409);
  for(let i=0;i<subscribers.length;i+=500){await MarketingCampaignDelivery.bulkWrite(subscribers.slice(i,i+500).map(s=>({updateOne:{filter:{campaignId:campaign._id,subscriberId:s._id},update:{$setOnInsert:{campaignId:campaign._id,subscriberId:s._id,email:s.email,status:"pending",attempts:0}},upsert:true}})),{ordered:false});}
  campaign.status="queued";campaign.updatedBy=auth.session.user._id as Types.ObjectId;await campaign.save();
  const pending=await MarketingCampaignDelivery.countDocuments({campaignId:campaign._id,status:{$in:["pending","failed"]}});
  await writePlatformAuditEvent({actorType:"human",actorId:String(auth.session.user._id),actorLabel:auth.session.user.name,action:"marketing_campaign.queued",module:"marketing",targetType:"MarketingCampaign",targetId:id,outcome:"success",metadata:{recipients:subscribers.length,pending}});
  return NextResponse.json({message:"Campaign queued for subscribed newsletter recipients.",queued:subscribers.length,pending});
 }
 if(b.action==="retry_failed"){if(campaign.status!=="failed")return fail("Only a completed campaign with failed deliveries can be retried.",409);const retried=await MarketingCampaignDelivery.updateMany({campaignId:campaign._id,status:"failed"},{$set:{status:"pending",attempts:0,lastError:""}});if(!retried.modifiedCount)return fail("There are no retryable failed recipients.",409);campaign.status="queued";campaign.updatedBy=auth.session.user._id as Types.ObjectId;await campaign.save();return NextResponse.json({message:"Failed recipients have been queued for another delivery attempt.",retried:retried.modifiedCount});}
 if(b.action!=="process")return fail("Unsupported dispatch action.");
 if(!["queued","sending"].includes(campaign.status))return fail("Campaign must be queued before delivery.",409);
 await MarketingCampaignDelivery.updateMany({campaignId:campaign._id,status:"sending",updatedAt:{$lt:new Date(Date.now()-15*60*1000)}},{$set:{status:"pending",lastError:"Recovered after an interrupted campaign batch."}});
 const batchSize=Math.min(25,Math.max(1,Number(b.batchSize)||20));
 const jobs=await MarketingCampaignDelivery.find({campaignId:campaign._id,status:"pending",attempts:{$lt:3}}).sort({createdAt:1}).limit(batchSize).lean();
 if(campaign.status==="queued"){campaign.status="sending";await campaign.save();}
 let sent=0,failed=0;
 for(const job of jobs){
  const claimed=await MarketingCampaignDelivery.findOneAndUpdate({_id:job._id,status:"pending",attempts:{$lt:3}},{$set:{status:"sending"},$inc:{attempts:1}},{new:true});if(!claimed)continue;
  const subscriber=await NewsletterSubscriber.findOne({_id:job.subscriberId,status:"subscribed"}).select("_id email").lean();
  if(!subscriber){await MarketingCampaignDelivery.updateOne({_id:job._id},{$set:{status:"failed",lastError:"Recipient is no longer subscribed."}});failed++;continue;}
  const token=generateUnsubscribeToken(String(subscriber._id));const base=(process.env.SITE_URL||"").replace(/\/$/,"");if(!base){await MarketingCampaignDelivery.updateOne({_id:job._id},{$set:{status:"pending",lastError:"SITE_URL is not configured."},$inc:{attempts:-1}});return fail("SITE_URL must be configured before sending unsubscribe-enabled campaigns.",503);}
  const unsubscribeUrl=base+"/unsubscribe/"+subscriber._id+"?token="+encodeURIComponent(token);
  const html=`<div style="font-family:Arial,sans-serif;line-height:1.6;white-space:pre-wrap">${escapeHtml(campaign.content)}</div><hr/><p style="font-size:12px;color:#777">You are receiving this because you subscribed to TGO DevStudio updates. <a href="${unsubscribeUrl}">Unsubscribe</a></p>`;
  const result=await sendNotificationEmail({toEmail:subscriber.email,subject:campaign.subject,htmlContent:html});
  if(result.success){await MarketingCampaignDelivery.updateOne({_id:job._id},{$set:{status:"sent",sentAt:new Date(),lastError:""}});sent++;}
  else{const attempts=claimed.attempts;await MarketingCampaignDelivery.updateOne({_id:job._id},{$set:{status:attempts>=3?"failed":"pending",lastError:(result.error||"Delivery failed.").slice(0,500)}});failed++;}
 }
 const [pending,sending,total,sentTotal,failedTotal]=await Promise.all([MarketingCampaignDelivery.countDocuments({campaignId:campaign._id,status:"pending"}),MarketingCampaignDelivery.countDocuments({campaignId:campaign._id,status:"sending"}),MarketingCampaignDelivery.countDocuments({campaignId:campaign._id}),MarketingCampaignDelivery.countDocuments({campaignId:campaign._id,status:"sent"}),MarketingCampaignDelivery.countDocuments({campaignId:campaign._id,status:"failed"})]);
 if(pending===0&&sending===0){campaign.status=failedTotal>0?"failed":"sent";await campaign.save();if(campaign.status==="sent")await enqueueWebhookDeliveries({eventId:"marketing-campaign:"+String(campaign._id)+":sent",eventName:"marketing.campaign.sent",payload:{id:String(campaign._id),name:campaign.name,status:campaign.status,sent:sentTotal,failed:failedTotal,completedAt:new Date().toISOString()}});}
 await writePlatformAuditEvent({actorType:"human",actorId:String(auth.session.user._id),actorLabel:auth.session.user.name,action:"marketing_campaign.batch_processed",module:"marketing",targetType:"MarketingCampaign",targetId:id,outcome:failed?"failure":"success",metadata:{sent,failed,pending,total,sentTotal,failedTotal}});
 return NextResponse.json({sent,failed,pending,total,sentTotal,failedTotal,complete:pending===0&&sending===0,status:campaign.status});
}
