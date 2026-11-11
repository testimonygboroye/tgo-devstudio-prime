import { NextRequest, NextResponse } from "next/server";
import {Types} from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import ClientActivity from "@/models/ClientActivity";
import CommercialService from "@/models/CommercialService";
import CommercialOrder from "@/models/CommercialOrder";
import DeliveryProject from "@/models/DeliveryProject";
import DeliveryMilestone from "@/models/DeliveryMilestone";
import DeliveryTask from "@/models/DeliveryTask";
import ProjectDeliverable from "@/models/ProjectDeliverable";
import ProjectQualityReview from "@/models/ProjectQualityReview";
import ProjectChangeRequest from "@/models/ProjectChangeRequest";
import CommercialContract from "@/models/CommercialContract";
import CommercialQuote from "@/models/CommercialQuote";
import CommercialProposal from "@/models/CommercialProposal";
import SalesLead from "@/models/SalesLead";
import ConsultationBooking from "@/models/ConsultationBooking";
import PaymentTransaction from "@/models/PaymentTransaction";
import MaintenanceWarranty from "@/models/MaintenanceWarranty";
import ProjectClientReview from "@/models/ProjectClientReview";
import FinanceSettings from "@/models/FinanceSettings";
import FinanceInvoice from "@/models/FinanceInvoice";
import ClientCreditAccount from "@/models/ClientCreditAccount";
import FinanceInstallmentPlan from "@/models/FinanceInstallmentPlan";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
import { awardEngagementPoints } from "@/lib/engagement/award";

export const dynamic="force-dynamic";
function fail(message:string,status=400){return NextResponse.json({ok:false,error:message},{status});}
function validId(value:unknown):value is string{return typeof value==="string"&&Types.ObjectId.isValid(value);}
async function clientSession(){const session=await getServerSession();if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)return null;return session;}
type ClientSession=NonNullable<Awaited<ReturnType<typeof getServerSession>>>;
async function logClient(session:ClientSession,action:string,targetType:string,targetId:string,summary:string,metadata:Record<string,unknown>={}) {
  await Promise.all([
    ClientActivity.create({clientId:session.user._id,actorId:session.user._id,actorType:"client",action,summary,metadata}),
    writePlatformAuditEvent({actorType:"human",actorId:String(session.user._id),actorLabel:session.user.name,action,module:"commercial_delivery",targetType,targetId,outcome:"success",metadata}),
  ]);
}

export async function GET() {
  const session=await clientSession();if(!session)return fail("Verified client sign-in required.",401);
  await connectToDatabase();
  const [services,orders,projects,changeRequests,consultations,maintenance,payments,projectReviews,financeSettings,invoices,credits,installmentPlans]=await Promise.all([
    CommercialService.find({status:"published"}).sort({category:1,name:1}).lean(),
    CommercialOrder.find({clientId:session.user._id}).sort({createdAt:-1}).lean(),
    DeliveryProject.find({clientId:session.user._id}).sort({updatedAt:-1}).lean(),
    ProjectChangeRequest.find({clientId:session.user._id}).sort({createdAt:-1}).lean(),
    ConsultationBooking.find({clientId:session.user._id}).sort({createdAt:-1}).lean(),
    MaintenanceWarranty.find({clientId:session.user._id}).sort({endsAt:-1}).lean(),
    PaymentTransaction.find({clientId:session.user._id}).select("-accessCode -authorizationUrl").sort({createdAt:-1}).limit(50).lean(),
    ProjectClientReview.find({clientId:session.user._id}).sort({submittedAt:-1}).lean(),
    FinanceSettings.findOne({key:"global"}).lean(),
    FinanceInvoice.find({clientId:session.user._id,status:{$nin:["draft","void"]}}).sort({createdAt:-1}).lean(),
    ClientCreditAccount.find({clientId:session.user._id}).lean(),
    FinanceInstallmentPlan.find({clientId:session.user._id,status:"active"}).sort({createdAt:-1}).lean(),
  ]);
  const projectIds=projects.map(p=>p._id);
  const [milestones,tasks,deliverables]=await Promise.all([
    DeliveryMilestone.find({projectId:{$in:projectIds}}).sort({sequence:1}).lean(),
    DeliveryTask.find({projectId:{$in:projectIds}}).sort({dueDate:1}).lean(),
    ProjectDeliverable.find({projectId:{$in:projectIds},status:{$in:["client_review","approved","released"]}}).sort({createdAt:-1}).lean(),
  ]);
  const [proposals,quotes,contracts]=await Promise.all([
    CommercialProposal.find({clientId:session.user._id,status:{$in:["sent","accepted"]}}).sort({createdAt:-1}).lean(),
    CommercialQuote.find({clientId:session.user._id,status:{$in:["issued","accepted"]}}).sort({createdAt:-1}).lean(),
    CommercialContract.find({clientId:session.user._id,status:{$in:["issued","accepted"]}}).sort({createdAt:-1}).lean(),
  ]);
  const bankTransfer=financeSettings?.bankTransferEnabled?{enabled:true,bankName:financeSettings.bankName,accountName:financeSettings.bankAccountName,accountNumber:financeSettings.bankAccountNumber,bankCode:financeSettings.bankCode,instructions:financeSettings.bankTransferInstructions}:{enabled:false};
  return NextResponse.json({ok:true,services,orders,projects,milestones,tasks,deliverables,changeRequests,consultations,maintenance,payments,projectReviews,proposals,quotes,contracts,invoices,credits,installmentPlans,bankTransfer,paymentConfigured:Boolean(process.env.PAYSTACK_SECRET_KEY&&financeSettings?.paystackEnabled)},{headers:{"Cache-Control":"private, no-store"}});
}

export async function POST(request:NextRequest) {
  const session=await clientSession();if(!session)return fail("Verified client sign-in required.",401);
  let body:Record<string,unknown>;try{body=await request.json();}catch{return fail("Invalid request body.");}
  await connectToDatabase();
  const user=await User.findOne({_id:session.user._id,accountType:"client",isEmailVerified:true});
  if(!user)return fail("Client account not found.",404);
  const firstName=user.firstName||user.name.trim().split(/\s+/)[0]||"Client";
  const lastName=user.lastName||user.name.trim().split(/\s+/).slice(1).join(" ")||"Account";
  const action=typeof body.action==="string"?body.action:"";
  try {
    if(action==="request.create") {
      if(typeof body.title!=="string"||body.title.trim().length<4||typeof body.description!=="string"||body.description.trim().length<20)return fail("Enter a request title and describe what you need (at least 20 characters).");
      const service=body.serviceId?await CommercialService.findOne({_id:String(body.serviceId),status:"published"}):null;
      if(body.serviceId&&!service)return fail("The selected service is no longer available.",404);
      if(service&&!service.customRequestEnabled)return fail("Custom requests are not enabled for this service.");
      const lead=await SalesLead.create({clientId:user._id,firstName:user.firstName||firstName,middleName:user.middleName,lastName:user.lastName||lastName,email:user.email,phone:typeof body.phone==="string"?body.phone:"",organization:typeof body.organization==="string"?body.organization:"",serviceId:service?._id,source:"client_portal",stage:"new",currency:service?.currency||"USD",notes:`REQUEST: ${body.title.trim()}\n\n${body.description.trim()}`});
      await logClient(session,"client.commercial_request_submitted","sales_lead",String(lead._id),"Client submitted a new service or project request.",{serviceId:service?String(service._id):null});
      return NextResponse.json({ok:true,message:"Your request has been submitted. Our team will review it and follow up.",reference:String(lead._id)},{status:201});
    }
    if(action==="consultation.request") {
      if(typeof body.topic!=="string"||body.topic.trim().length<4)return fail("Enter the consultation topic.");
      if(typeof body.preferredAt==="string"&&body.preferredAt&&(!Number.isFinite(new Date(body.preferredAt).getTime())||new Date(body.preferredAt)<new Date()))return fail("Choose a future preferred date and time.");
      const booking=await ConsultationBooking.create({clientId:user._id,firstName:user.firstName||firstName,middleName:user.middleName,lastName:user.lastName||lastName,email:user.email,phone:typeof body.phone==="string"?body.phone:"",topic:body.topic.trim(),details:typeof body.details==="string"?body.details:"",preferredAt:typeof body.preferredAt==="string"&&body.preferredAt?new Date(body.preferredAt):undefined,timezone:typeof body.timezone==="string"?body.timezone:"Africa/Lagos",meetingMode:typeof body.meetingMode==="string"&&["online","phone","in_person"].includes(body.meetingMode)?body.meetingMode as "online"|"phone"|"in_person":"online",status:"requested",provider:"manual"});
      await logClient(session,"client.consultation_requested","consultation_booking",String(booking._id),"Client requested a consultation.",{topic:booking.topic,preferredAt:booking.preferredAt?.toISOString()||null});
      return NextResponse.json({ok:true,message:"Your consultation request has been received. The team will confirm a time.",item:booking},{status:201});
    }
    if(action==="contract.accept") {
      const contract=await CommercialContract.findOne({_id:String(body.contractId),clientId:user._id,status:"issued"});
      if(!contract)return fail("This contract is not available for acceptance.",404);
      const quote=await CommercialQuote.findOne({_id:contract.quoteId,clientId:user._id});
      const proposal=await CommercialProposal.findOne({_id:contract.proposalId,clientId:user._id});
      if(!quote||!proposal)return fail("The contract's commercial records could not be verified.",409);
      contract.status="accepted";contract.acceptedAt=new Date();contract.acceptanceMethod="client_portal";contract.acceptedBy=user._id;
      quote.status="accepted";proposal.status="accepted";
      const lead=await SalesLead.findById(contract.leadId);if(lead&&String(lead.clientId||"")!==String(user._id))return fail("This sales record is not linked to your account.",403);
      if(lead)lead.clientId=user._id;
      await Promise.all([contract.save(),quote.save(),proposal.save(),lead?.save()]);
      await logClient(session,"client.contract_accepted","commercial_contract",String(contract._id),"Client accepted a service contract.",{reference:contract.reference});
      return NextResponse.json({ok:true,message:"Contract accepted. Your order can now be prepared by the TGO team."});
    }
    if(action==="deliverable.approve") {
      const deliverable=await ProjectDeliverable.findOne({_id:String(body.deliverableId),status:"client_review"});
      if(!deliverable)return fail("This deliverable is not awaiting your review.",404);
      const qa=deliverable.qaReviewId?await ProjectQualityReview.findOne({_id:deliverable.qaReviewId,deliverableId:deliverable._id,status:"passed"}):null;
      if(!qa)return fail("This deliverable cannot be approved until its quality review has passed.",409);
      const project=await DeliveryProject.findOne({_id:deliverable.projectId,clientId:user._id});
      if(!project)return fail("Deliverable not found in your projects.",404);
      deliverable.status="approved";deliverable.clientApprovedAt=new Date();await deliverable.save();
      if(deliverable.milestoneId)await DeliveryMilestone.updateOne({_id:deliverable.milestoneId,projectId:project._id},{$set:{clientApprovalStatus:"approved"}});
      await logClient(session,"client.deliverable_approved","project_deliverable",String(deliverable._id),"Client approved a project deliverable.",{projectId:String(project._id)});
      return NextResponse.json({ok:true,message:"Deliverable approved. The team can release it when all payment and quality gates are satisfied."});
    }
    if(action==="change.request") {
      if(typeof body.projectId!=="string"||typeof body.title!=="string"||body.title.trim().length<4||typeof body.description!=="string"||body.description.trim().length<20)return fail("Project, change title and detailed description are required.");
      const project=await DeliveryProject.findOne({_id:String(body.projectId),clientId:user._id});
      if(!project)return fail("Project not found in your account.",404);
      if(typeof body.title!=="string"||body.title.trim().length<4||typeof body.description!=="string"||body.description.trim().length<20)return fail("Enter a change title and explain the requested change (at least 20 characters).");
      const change=await ProjectChangeRequest.create({projectId:project._id,clientId:user._id,requestedBy:user._id,title:body.title.trim(),description:body.description.trim(),currency:"USD",status:"submitted"});
      await logClient(session,"client.change_request_submitted","project_change_request",String(change._id),"Client submitted a project change request.",{projectId:String(project._id)});
      return NextResponse.json({ok:true,message:"Your change request has been submitted for impact assessment.",item:change},{status:201});
    }
    if(action==="project.review"){
      if(!validId(body.projectId))return fail("Choose a completed project to review.");
      const project=await DeliveryProject.findOne({_id:String(body.projectId),clientId:user._id,status:"completed"});
      if(!project)return fail("Only completed projects in your account can be reviewed.",404);
      const rating=Number(body.rating);const title=typeof body.title==="string"?body.title.trim():"";const feedback=typeof body.feedback==="string"?body.feedback.trim():"";
      if(!Number.isInteger(rating)||rating<1||rating>5)return fail("Choose a rating from 1 to 5.");
      if(title.length<3||title.length>160||feedback.length<20||feedback.length>3000)return fail("Enter a short review title and at least 20 characters of feedback.");
      const existing=await ProjectClientReview.findOne({projectId:project._id,clientId:user._id});
      if(existing)return fail("You have already submitted a review for this project.",409);
      const review=await ProjectClientReview.create({projectId:project._id,clientId:user._id,rating,title,feedback,status:"submitted",submittedAt:new Date()});
      await awardEngagementPoints({clientId:String(user._id),eventKey:"project-review:"+String(review._id),eventType:"review_submitted",metadata:{projectId:String(project._id),reviewId:String(review._id),rating}});
      await logClient(session,"client.project_review_submitted","project_client_review",String(review._id),"Client submitted a completed-project review.",{projectId:String(project._id),rating});
      return NextResponse.json({ok:true,message:"Thank you. Your project review has been submitted for moderation.",item:review},{status:201});
    }
    return fail("Unsupported client commercial action.");
  } catch(error) {return fail(error instanceof Error?error.message:"Request could not be completed.",400);}
}
