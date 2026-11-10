import { NextRequest,NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
import { evaluateDeliveryRelease } from "@/lib/commercial/delivery-policy";
import { Types } from "mongoose";
import CommercialOrder from "@/models/CommercialOrder";
import DeliveryProject from "@/models/DeliveryProject";
import DeliveryMilestone from "@/models/DeliveryMilestone";
import DeliveryTask from "@/models/DeliveryTask";
import ProjectDeliverable from "@/models/ProjectDeliverable";
import ProjectQualityReview from "@/models/ProjectQualityReview";
import ConsultationBooking from "@/models/ConsultationBooking";
import ProjectChangeRequest from "@/models/ProjectChangeRequest";
function fail(message:string,status=400){return NextResponse.json({ok:false,error:message},{status});}
function validId(value:unknown):value is string{return typeof value==="string"&&Types.ObjectId.isValid(value);}
export async function POST(request:NextRequest){
 const session=await getServerSession();if(!session)return fail("Authentication required.",401);const isFounder=Boolean(session.role?.isFounderRole);if(session.user.accountType!=="staff")return fail("Staff authentication required.",403);
 let body:Record<string,unknown>;try{body=await request.json();}catch{return fail("Invalid request body.");}
 await connectToDatabase();
 const action=typeof body.action==="string"?body.action:"";
 const audit=async(action:string,type:string,id:string,metadata:Record<string,unknown>={})=>writePlatformAuditEvent({actorType:"human",actorId:String(session.user._id),actorLabel:session.user.name,action,module:"commercial_delivery",targetType:type,targetId:id,outcome:"success",metadata});
 try{
  if(action==="deliverable.release"){
    if(!isFounder)return fail("Only the founder can release a client deliverable after all approval and payment gates pass.",403);
   if(!validId(body.id))return fail("Valid deliverable id required.");const item=await ProjectDeliverable.findById(body.id);if(!item)return fail("Deliverable not found.",404);
   const milestone=item.milestoneId?await DeliveryMilestone.findOne({_id:item.milestoneId,projectId:item.projectId}):null;
   if(item.milestoneId&&!milestone)return fail("Milestone not found.",404);
   const qa=item.qaReviewId?await ProjectQualityReview.findOne({_id:item.qaReviewId,deliverableId:item._id,status:"passed"}):null;
   const gate=evaluateDeliveryRelease({deliverableStatus:item.status,hasMilestone:Boolean(milestone),hasPassedQa:Boolean(qa),clientApproved:Boolean(item.clientApprovedAt),milestonePaymentStatus:milestone?.paymentStatus||"unconfigured",milestoneClientApprovalStatus:milestone?.clientApprovalStatus||"pending"});
   if(!gate.allowed)return fail(`Release blocked: ${gate.reason}`,409);
   if(!milestone)return fail("Milestone not found.",404);
   item.status="released";item.releasedAt=new Date();await item.save();milestone.status="released";milestone.releasedAt=new Date();await milestone.save();
   await audit("delivery.progressive_release_completed","project_deliverable",String(item._id),{milestoneId:String(milestone._id)});
   return NextResponse.json({ok:true,item,message:"Deliverable released after all required gates passed."});
  }
  if(action==="milestone.update"){
   if(!validId(body.id))return fail("Valid milestone id required.");const item=await DeliveryMilestone.findById(String(body.id));if(!item)return fail("Milestone not found.",404);
    if(!isFounder){const project=await DeliveryProject.findOne({_id:item.projectId,$or:[{projectManager:session.user._id},{teamMembers:session.user._id}]});if(!project)return fail("You are not assigned to this project.",403);}
   if(typeof body.status!=="string"||!["planned","active","in_qa","awaiting_payment","blocked","completed"].includes(body.status))return fail("Invalid milestone status.");
   if(body.status==="completed"&&item.status!=="released")return fail("A milestone can only be completed after its deliverables are released.");
   item.status=body.status as typeof item.status;await item.save();await audit("delivery.milestone_status_changed","delivery_milestone",String(item._id),{status:item.status});return NextResponse.json({ok:true,item});
  }
  if(action==="project.update"){
    if(!isFounder)return fail("Only the founder can change the overall project lifecycle.",403);
   if(!validId(body.id))return fail("Valid project id required.");const project=await DeliveryProject.findById(String(body.id));if(!project)return fail("Project not found.",404);
   if(typeof body.status!=="string"||!["planning","active","on_hold","in_qa","awaiting_client","completed","cancelled"].includes(body.status))return fail("Invalid project status.");
   if(body.status==="completed"){
    const [tasks,milestones,deliverables]=await Promise.all([DeliveryTask.countDocuments({projectId:project._id,status:{$ne:"done"}}),DeliveryMilestone.countDocuments({projectId:project._id,status:{$ne:"completed"}}),ProjectDeliverable.countDocuments({projectId:project._id,status:{$ne:"released"}})]);
    if(tasks||milestones||deliverables)return fail("Completion blocked until all tasks, milestones and deliverables are complete.");
    project.completedAt=new Date();
   }else project.completedAt=undefined;
   project.status=body.status as typeof project.status;await project.save();if(body.status==="completed")await CommercialOrder.updateOne({_id:project.orderId},{$set:{status:"completed"}});
   await audit("delivery.project_status_changed","delivery_project",String(project._id),{status:project.status});return NextResponse.json({ok:true,item:project});
  }
  if(action==="consultation.update"){
   if(!validId(body.id)||typeof body.status!=="string"||!["requested","confirmed","completed","cancelled","no_show"].includes(body.status))return fail("Valid consultation and status are required.");
   const item=await ConsultationBooking.findById(String(body.id));if(!item)return fail("Consultation not found.",404);if(!isFounder&&String(item.assignedTo||"")!==String(session.user._id))return fail("You can only update consultations assigned to you.",403);if(!isFounder&&body.assignedTo!==undefined)return fail("Only the founder can reassign a consultation.",403);item.status=body.status as typeof item.status;if(isFounder&&validId(body.assignedTo)){const staff=await (await import("@/models/User")).default.findOne({_id:String(body.assignedTo),accountType:"staff",isBanned:false}).select("_id");if(!staff)return fail("Assigned consultant must be an active staff account.");item.assignedTo=staff._id;}await item.save();await audit("sales.consultation_status_changed","consultation_booking",String(item._id),{status:item.status});return NextResponse.json({ok:true,item});
  }
  if(action==="change.decide"){
   if(!validId(body.id)||typeof body.status!=="string"||!["submitted","under_review","approved","rejected","implemented"].includes(body.status))return fail("Valid change request and status are required.");
   const item=await ProjectChangeRequest.findById(String(body.id));if(!item)return fail("Change request not found.",404);if(!isFounder){const project=await DeliveryProject.findOne({_id:item.projectId,projectManager:session.user._id});if(!project)return fail("Only the project manager or founder can decide this change request.",403);}item.status=body.status as typeof item.status;item.decisionBy=session.user._id;item.decisionAt=new Date();if(body.impactOnCost!==undefined)item.impactOnCost=Math.max(0,Number(body.impactOnCost));if(body.impactOnDays!==undefined)item.impactOnDays=Math.max(0,Number(body.impactOnDays));await item.save();await audit("delivery.change_request_decided","project_change_request",String(item._id),{status:item.status});return NextResponse.json({ok:true,item});
  }
  if(action==="task.update"){
   if(!validId(body.id)||typeof body.status!=="string"||!["todo","in_progress","blocked","in_review","done"].includes(body.status))return fail("Valid task and status are required.");const item=await DeliveryTask.findById(String(body.id));if(!item)return fail("Task not found.",404);if(!isFounder){const assigned=item.assigneeIds.some(id=>String(id)===String(session.user._id));const manager=await DeliveryProject.exists({_id:item.projectId,projectManager:session.user._id});if(!assigned&&!manager)return fail("You can only update tasks assigned to you or managed by you.",403);}item.status=body.status as typeof item.status;item.completedAt=body.status==="done"?new Date():undefined;await item.save();await audit("delivery.task_updated","delivery_task",String(item._id),{status:item.status});return NextResponse.json({ok:true,item});
  }
  if(action==="qa.review"){
   if(!validId(body.projectId)||!validId(body.deliverableId)||!Array.isArray(body.checklist)||!body.checklist.length)return fail("Project, deliverable and QA checklist are required.");
   const item=await ProjectDeliverable.findOne({_id:String(body.deliverableId),projectId:String(body.projectId)});if(!item)return fail("Deliverable not found in project.",404);
    if(!isFounder){const project=await DeliveryProject.findOne({_id:item.projectId,$or:[{projectManager:session.user._id},{teamMembers:session.user._id}]});if(!project)return fail("You are not assigned to this project.",403);if(String(item.createdBy)===String(session.user._id))return fail("Independent QA review is required; you cannot approve your own deliverable.",403);}
   const checklist=body.checklist.map((value:unknown)=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{});
   if(checklist.some(value=>typeof value.item!=="string"||typeof value.passed!=="boolean"))return fail("Every QA checklist item requires a name and pass/fail result.");
   const passed=checklist.every(value=>value.passed===true);const review=await ProjectQualityReview.create({projectId:String(body.projectId),deliverableId:item._id,reviewerId:session.user._id,status:passed?"passed":"failed",checklist:checklist.slice(0,50).map(value=>({item:String(value.item),passed:value.passed===true,notes:typeof value.notes==="string"?value.notes:undefined})),summary:typeof body.summary==="string"?body.summary:"",reviewedAt:new Date()});
   item.qaReviewId=review._id;item.status=passed?"client_review":"rejected";await item.save();if(item.milestoneId)await DeliveryMilestone.updateOne({_id:item.milestoneId,projectId:item.projectId},{$set:{qaStatus:passed?"passed":"failed",status:passed?"awaiting_payment":"in_qa"}});
   await audit("delivery.quality_review_completed","project_quality_review",String(review._id),{deliverableId:String(item._id),status:review.status});return NextResponse.json({ok:true,item:review,deliverable:item});
  }
  return fail("Unsupported commercial workflow action.");
 }catch(error){return fail(error instanceof Error?error.message:"Workflow operation failed.",400);}
}
