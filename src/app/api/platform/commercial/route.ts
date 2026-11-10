/* eslint-disable @typescript-eslint/no-explicit-any -- this resource-discriminated Mongoose registry uses dynamic model generics; request values are validated before writes. */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
import CommercialService from "@/models/CommercialService";
import SalesLead from "@/models/SalesLead";
import User from "@/models/User";
import CommercialProposal from "@/models/CommercialProposal";
import CommercialQuote from "@/models/CommercialQuote";
import CommercialContract from "@/models/CommercialContract";
import CommercialOrder from "@/models/CommercialOrder";
import DeliveryProject from "@/models/DeliveryProject";
import DeliveryMilestone from "@/models/DeliveryMilestone";
import DeliveryTask from "@/models/DeliveryTask";
import ProjectResourceAllocation from "@/models/ProjectResourceAllocation";
import ProjectDeliverable from "@/models/ProjectDeliverable";
import ProjectChangeRequest from "@/models/ProjectChangeRequest";
import ProjectQualityReview from "@/models/ProjectQualityReview";
import MaintenanceWarranty from "@/models/MaintenanceWarranty";
import ConsultationBooking from "@/models/ConsultationBooking";
import ProjectTemplate from "@/models/ProjectTemplate";
import PaymentTransaction from "@/models/PaymentTransaction";
import FinancialLedgerEntry from "@/models/FinancialLedgerEntry";
import ProjectClientReview from "@/models/ProjectClientReview";
import Workspace from "@/models/Workspace";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import WorkspaceChannel from "@/models/WorkspaceChannel";
import WorkspaceActivity from "@/models/WorkspaceActivity";

export const dynamic = "force-dynamic";
type Resource = "services"|"leads"|"proposals"|"quotes"|"contracts"|"orders"|"projects"|"milestones"|"tasks"|"resources"|"deliverables"|"changeRequests"|"qa"|"maintenance"|"consultations"|"templates"|"payments"|"ledger"|"reviews";
const models: Record<Resource, any> = { services:CommercialService,leads:SalesLead,proposals:CommercialProposal,quotes:CommercialQuote,contracts:CommercialContract,orders:CommercialOrder,projects:DeliveryProject,milestones:DeliveryMilestone,tasks:DeliveryTask,resources:ProjectResourceAllocation,deliverables:ProjectDeliverable,changeRequests:ProjectChangeRequest,qa:ProjectQualityReview,maintenance:MaintenanceWarranty,consultations:ConsultationBooking,templates:ProjectTemplate,payments:PaymentTransaction,ledger:FinancialLedgerEntry,reviews:ProjectClientReview };
function fail(message:string,status=400){return NextResponse.json({ok:false,error:message},{status});}
function validId(value:unknown){return typeof value==="string"&&Types.ObjectId.isValid(value);}
function reference(prefix:string){return `${prefix}-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${randomUUID().slice(0,8).toUpperCase()}`;}
async function audit(session:any,action:string,targetType:string,targetId:string,metadata:Record<string,unknown>={}) {
  await writePlatformAuditEvent({actorType:"human",actorId:String(session.user._id),actorLabel:session.user.name,action,module:"commercial_delivery",targetType,targetId,outcome:"success",metadata});
}
async function founder() {
  const session=await getServerSession();
  if(!session)return {session:null,response:fail("Authentication required.",401)};
  if(!session.role?.isFounderRole)return {session:null,response:fail("Founder permissions are required for commercial operations.",403)};
  await connectToDatabase();
  return {session,response:null};
}

export async function GET(request:NextRequest) {
  const auth=await founder(); if(auth.response)return auth.response;
  const resourceParam=request.nextUrl.searchParams.get("resource");
  if(resourceParam==="summary"){
    const keys=Object.keys(models) as Resource[];
    const values=await Promise.all(keys.map(async key=>[key,await models[key].countDocuments({})] as const));
    return NextResponse.json({ok:true,counts:Object.fromEntries(values)},{headers:{"Cache-Control":"private, no-store"}});
  }
  const resource=resourceParam as Resource|null;
  if(!resource||!models[resource])return fail("Choose a supported commercial resource.");
  const status=request.nextUrl.searchParams.get("status");
  const limit=Math.min(200,Math.max(1,Number(request.nextUrl.searchParams.get("limit")||50)));
  const query:Record<string,unknown>={};
  if(status)query.status=status;
  let cursor=models[resource].find(query);if(resource==="payments")cursor=cursor.select("-accessCode -authorizationUrl");
  const [rows,total]=await Promise.all([cursor.sort({updatedAt:-1}).limit(limit).lean(),models[resource].countDocuments(query)]);
  return NextResponse.json({ok:true,resource,items:rows,total},{headers:{"Cache-Control":"private, no-store"}});
}

export async function POST(request:NextRequest) {
  const auth=await founder(); if(auth.response)return auth.response;
  const session=auth.session!;
  let body:Record<string,any>;try{body=await request.json();}catch{return fail("Invalid request body.");}
  const action=String(body.action||"");
  try {
    if(action==="template.create") {
      if(typeof body.name!=="string"||body.name.trim().length<3||typeof body.category!=="string"||!body.category.trim()||!Array.isArray(body.milestones)||!body.milestones.length)return fail("Template name, category and at least one milestone are required.");
      const template=await ProjectTemplate.create({key:String(body.key||body.name).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),name:body.name.trim(),category:body.category.trim(),description:String(body.description||""),status:body.status==="active"?"active":"draft",milestones:body.milestones.map((m:any)=>({title:String(m.title||"").trim(),description:String(m.description||""),amount:Math.max(0,Number(m.amount||0)),currency:String(m.currency||body.currency||"USD").toUpperCase(),clientApprovalRequired:m.clientApprovalRequired!==false,tasks:Array.isArray(m.tasks)?m.tasks.map((t:any)=>({title:String(t.title||"").trim(),description:String(t.description||""),priority:["low","normal","high","urgent"].includes(t.priority)?t.priority:"normal"})):[]})),createdBy:session.user._id});
      await audit(session,"delivery.project_template_created","project_template",String(template._id),{key:template.key,status:template.status});
      return NextResponse.json({ok:true,item:template},{status:201});
    }
    if(action==="template.update") {
      if(!validId(body.id))return fail("Valid project template id required.");
      const template=await ProjectTemplate.findById(body.id);if(!template)return fail("Project template not found.",404);
      for(const key of ["name","category","description","status","milestones"])if(body[key]!==undefined)template.set(key,body[key]);
      await template.save();await audit(session,"delivery.project_template_updated","project_template",String(template._id),{fields:Object.keys(body)});
      return NextResponse.json({ok:true,item:template});
    }
    if(action==="service.create") {
      const {name,slug,category,summary,description,packages=[]}=body;
      if(typeof name!=="string"||name.trim().length<3||typeof category!=="string"||!category.trim()||typeof summary!=="string"||!summary.trim()||typeof description!=="string"||description.trim().length<10)return fail("Service name, category, summary and full description are required.");
      if(!Array.isArray(packages)||packages.length>20)return fail("A service may contain up to 20 packages.");
      const service=await CommercialService.create({name:name.trim(),slug:String(slug||name).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),category:category.trim(),summary:summary.trim(),description:description.trim(),status:body.status==="published"?"published":"draft",pricingModel:["fixed","from","custom"].includes(body.pricingModel)?body.pricingModel:"custom",currency:String(body.currency||"USD").toUpperCase(),packages:packages.map((p:any)=>({key:String(p.key||p.name||randomUUID()).toLowerCase().replace(/[^a-z0-9]+/g,"-"),name:String(p.name||"").trim(),summary:String(p.summary||""),price:Math.max(0,Number(p.price||0)),currency:String(p.currency||body.currency||"USD").toUpperCase(),billingModel:["fixed","hourly","monthly","custom"].includes(p.billingModel)?p.billingModel:"fixed",deliveryDays:Math.max(0,Number(p.deliveryDays||0)),revisions:Math.max(0,Number(p.revisions||0)),features:Array.isArray(p.features)?p.features.filter((x:any)=>typeof x==="string").slice(0,30):[],enabled:p.enabled!==false})),customRequestEnabled:body.customRequestEnabled!==false,consultationEnabled:body.consultationEnabled!==false,deliveryTemplate:typeof body.deliveryTemplate==="string"?body.deliveryTemplate:undefined,createdBy:session.user._id});
      await audit(session,"commercial.service_created","commercial_service",String(service._id),{slug:service.slug,status:service.status});
      return NextResponse.json({ok:true,item:service},{status:201});
    }
    if(action==="service.update") {
      if(!validId(body.id))return fail("Valid service id required.");
      const service=await CommercialService.findById(body.id);if(!service)return fail("Service not found.",404);
      for(const key of ["name","category","summary","description","status","pricingModel","currency","packages","customRequestEnabled","consultationEnabled","deliveryTemplate"])if(body[key]!==undefined)service.set(key,body[key]);
      await service.save();await audit(session,"commercial.service_updated","commercial_service",String(service._id),{fields:Object.keys(body)});
      return NextResponse.json({ok:true,item:service});
    }
    if(action==="lead.create") {
      const {firstName,middleName,lastName,email}=body;
      if(typeof firstName!=="string"||firstName.trim().length<2||typeof lastName!=="string"||lastName.trim().length<2||typeof email!=="string"||!/^\S+@\S+\.\S+$/.test(email))return fail("First name, last name and a valid email address are required.");
      const matchedClient=await User.findOne({email:email.trim().toLowerCase(),accountType:"client"}).select("_id");
      const lead=await SalesLead.create({clientId:matchedClient?._id,firstName:firstName.trim(),middleName:typeof middleName==="string"?middleName.trim():undefined,lastName:lastName.trim(),email:email.trim().toLowerCase(),phone:body.phone,organization:body.organization,serviceId:validId(body.serviceId)?body.serviceId:undefined,source:"manual",stage:"new",estimatedValue:body.estimatedValue===undefined?undefined:Math.max(0,Number(body.estimatedValue)),currency:String(body.currency||"USD").toUpperCase(),notes:String(body.notes||""),assignedTo:validId(body.assignedTo)?body.assignedTo:undefined});
      await audit(session,"sales.lead_created","sales_lead",String(lead._id),{source:lead.source});
      return NextResponse.json({ok:true,item:lead},{status:201});
    }
    if(action==="lead.stage") {
      if(!validId(body.id))return fail("Valid lead id required.");
      const allowed=["new","qualified","discovery","proposal","negotiation","won","lost"];
      if(!allowed.includes(body.stage))return fail("Invalid sales pipeline stage.");
      const lead=await SalesLead.findById(body.id);if(!lead)return fail("Lead not found.",404);
      lead.stage=body.stage;if(body.nextFollowUpAt)lead.nextFollowUpAt=new Date(body.nextFollowUpAt);if(body.lostReason)lead.lostReason=String(body.lostReason).slice(0,1000);await lead.save();
      await audit(session,"sales.lead_stage_changed","sales_lead",String(lead._id),{stage:lead.stage});
      return NextResponse.json({ok:true,item:lead});
    }
    if(action==="proposal.create") {
      if(!validId(body.leadId))return fail("Choose a valid sales lead.");
      const lead=await SalesLead.findById(body.leadId);if(!lead)return fail("Lead not found.",404);
      if(typeof body.title!=="string"||!body.title.trim()||typeof body.scope!=="string"||body.scope.trim().length<10||!Array.isArray(body.lines)||!body.lines.length)return fail("Proposal title, scope and at least one priced line item are required.");
      const lines=body.lines.map((line:any)=>{const quantity=Number(line.quantity||1),unitPrice=Number(line.unitPrice);if(!line.description||!Number.isFinite(quantity)||quantity<=0||!Number.isFinite(unitPrice)||unitPrice<0)throw new Error("Proposal line items contain invalid quantities or prices.");return {description:String(line.description).slice(0,500),serviceId:validId(line.serviceId)?line.serviceId:undefined,packageKey:line.packageKey,quantity,unitPrice,amount:Math.round(quantity*unitPrice*100)/100};});
      const subtotal=lines.reduce((sum:number,line:any)=>sum+line.amount,0),discount=Math.max(0,Number(body.discount||0)),tax=Math.max(0,Number(body.tax||0));
      if(discount>subtotal)return fail("Discount cannot exceed the proposal subtotal.");
      const proposal=await CommercialProposal.create({reference:reference("PROP"),leadId:lead._id,clientId:lead.clientId,title:body.title.trim(),scope:body.scope.trim(),exclusions:String(body.exclusions||""),deliverables:Array.isArray(body.deliverables)?body.deliverables.filter((x:any)=>typeof x==="string").slice(0,50):[],lines,currency:String(body.currency||lead.currency||"USD").toUpperCase(),subtotal,discount,tax,total:Math.round((subtotal-discount+tax)*100)/100,status:"draft",validUntil:body.validUntil?new Date(body.validUntil):undefined,createdBy:session.user._id});
      lead.stage="proposal";await lead.save();await audit(session,"sales.proposal_created","commercial_proposal",String(proposal._id),{reference:proposal.reference,total:proposal.total});
      return NextResponse.json({ok:true,item:proposal},{status:201});
    }
    if(action==="proposal.send") {
      if(!validId(body.id))return fail("Valid proposal id required.");
      const proposal=await CommercialProposal.findById(body.id);if(!proposal)return fail("Proposal not found.",404);
      if(proposal.status!=="draft")return fail("Only draft proposals can be issued.");
      proposal.status="sent";await proposal.save();await audit(session,"sales.proposal_issued","commercial_proposal",String(proposal._id),{reference:proposal.reference});
      return NextResponse.json({ok:true,item:proposal});
    }
    if(action==="quote.create") {
      if(!validId(body.proposalId))return fail("Choose a valid proposal.");
      const proposal=await CommercialProposal.findById(body.proposalId);if(!proposal||!["sent","accepted"].includes(proposal.status))return fail("A sent or accepted proposal is required.");
      const quote=await CommercialQuote.create({reference:reference("QUOT"),proposalId:proposal._id,leadId:proposal.leadId,clientId:proposal.clientId,currency:proposal.currency,subtotal:proposal.subtotal,discount:proposal.discount,tax:proposal.tax,total:proposal.total,lineItems:proposal.lines.map((l:any)=>({description:l.description,quantity:l.quantity,unitPrice:l.unitPrice,amount:l.amount})),status:"issued",validUntil:body.validUntil?new Date(body.validUntil):proposal.validUntil,createdBy:session.user._id});
      await audit(session,"sales.quote_issued","commercial_quote",String(quote._id),{reference:quote.reference,total:quote.total});
      return NextResponse.json({ok:true,item:quote},{status:201});
    }
    if(action==="contract.create") {
      if(!validId(body.quoteId))return fail("Choose a valid quotation.");
      const quote=await CommercialQuote.findById(body.quoteId);if(!quote)return fail("Quotation not found.",404);
      const proposal=await CommercialProposal.findById(quote.proposalId);if(!proposal)return fail("Related proposal not found.",404);
      if(typeof body.terms!=="string"||body.terms.trim().length<30)return fail("Contract terms must contain at least 30 characters.");
      const contract=await CommercialContract.create({reference:reference("CONT"),proposalId:proposal._id,quoteId:quote._id,leadId:quote.leadId,clientId:quote.clientId,title:String(body.title||proposal.title),terms:body.terms.trim(),status:"issued",issuedAt:new Date(),createdBy:session.user._id});
      await audit(session,"sales.contract_issued","commercial_contract",String(contract._id),{reference:contract.reference});
      return NextResponse.json({ok:true,item:contract},{status:201});
    }
    if(action==="order.create") {
      if(!validId(body.contractId))return fail("Choose a valid contract.");
      const contract=await CommercialContract.findById(body.contractId);if(!contract||contract.status!=="accepted"||!contract.clientId)return fail("The client must accept the contract before an order can be created.");
      const quote=await CommercialQuote.findById(contract.quoteId);if(!quote||quote.status!=="accepted")return fail("The quotation must be accepted before creating an order.");
      const proposal=await CommercialProposal.findById(contract.proposalId);if(!proposal)return fail("Related proposal not found.");
      const order=await CommercialOrder.create({reference:reference("ORD"),clientId:contract.clientId,leadId:contract.leadId,proposalId:proposal._id,quoteId:quote._id,contractId:contract._id,title:proposal.title,amount:quote.total,currency:quote.currency,status:"pending",paymentStatus:"unconfigured",createdBy:session.user._id});
      const lead=await SalesLead.findById(contract.leadId);if(lead){lead.stage="won";await lead.save();}
      await audit(session,"commerce.order_created","commercial_order",String(order._id),{reference:order.reference,amount:order.amount,paymentStatus:order.paymentStatus});
      return NextResponse.json({ok:true,item:order},{status:201});
    }
    if(action==="project.create") {
      if(!validId(body.orderId))return fail("Choose a valid order.");
      const order=await CommercialOrder.findById(body.orderId);if(!order)return fail("Order not found.",404);
      if(order.status==="cancelled"||order.status==="refunded")return fail("A cancelled or refunded order cannot enter delivery.");
      const exists=await DeliveryProject.findOne({orderId:order._id});if(exists)return fail("A delivery project already exists for this order.",409);
      const template=body.templateKey?await ProjectTemplate.findOne({key:body.templateKey,status:"active"}):null;
      if(body.templateKey&&!template)return fail("The selected project template is not active or does not exist.");
      let projectManager:Types.ObjectId|undefined;
      if(validId(body.projectManager)){const manager=await User.findOne({_id:body.projectManager,accountType:"staff",isBanned:false}).select("_id");if(!manager)return fail("Project manager must be an active staff account.");projectManager=manager._id;}
      const teamIds=Array.isArray(body.teamMembers)?body.teamMembers.filter(validId):[];
      if(teamIds.length){const staff=await User.find({_id:{$in:teamIds},accountType:"staff",isBanned:false}).select("_id");if(staff.length!==teamIds.length)return fail("Every project team member must be an active staff account.");}
      const project=await DeliveryProject.create({reference:reference("PRJ"),orderId:order._id,clientId:order.clientId,name:String(body.name||order.title).slice(0,200),summary:String(body.summary||""),status:"planning",priority:["low","normal","high","critical"].includes(body.priority)?body.priority:"normal",projectManager,teamMembers:teamIds,templateKey:template?.key,startDate:body.startDate?new Date(body.startDate):new Date(),targetDate:body.targetDate?new Date(body.targetDate):undefined,createdBy:session.user._id});
      let workspace:Awaited<ReturnType<typeof Workspace.create>>|null=null;
      const previousOrderStatus=order.status;
      try{
        const workspaceSlug=String(project.name).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,90)+"-"+new Types.ObjectId().toString().slice(-6);
        workspace=await Workspace.create({name:(project.name.slice(0,108)+" Workspace"),slug:workspaceSlug,description:project.summary||"Private collaboration space for this delivery project.",kind:"project",visibility:"private",ownerId:session.user._id,clientId:order.clientId,deliveryProjectId:project._id,status:"active",settings:{allowMemberInvites:false,allowClientMembers:true,allowAiAgents:false}});
        const memberMap=new Map<string,{workspaceId:Types.ObjectId;userId:Types.ObjectId;memberType:"human";role:"owner"|"manager"|"member"|"guest";permissions:string[];status:"active";invitedBy:Types.ObjectId;joinedAt:Date}>();
        const addMember=(userId:Types.ObjectId,role:"owner"|"manager"|"member"|"guest")=>{const permissions=role==="owner"?["workspace:manage","members:manage","channels:manage","tasks:manage","documents:manage","approvals:manage"]:role==="guest"?["workspace:read","messages:write","documents:read","deliverables:review"]:role==="manager"?["workspace:read","messages:write","tasks:manage","documents:manage","deliverables:manage"]:["workspace:read","messages:write","tasks:manage","files:upload"];memberMap.set(String(userId),{workspaceId:workspace!._id,userId,memberType:"human",role,permissions,status:"active",invitedBy:session.user._id,joinedAt:new Date()});};
        addMember(session.user._id,"owner");addMember(order.clientId,"guest");if(projectManager&&!memberMap.has(String(projectManager)))addMember(projectManager,"manager");for(const memberId of teamIds)if(!memberMap.has(String(memberId)))addMember(memberId,"member");
        const members=[...memberMap.values()];
        await WorkspaceMembership.insertMany(members);
        await WorkspaceChannel.create({workspaceId:workspace._id,name:"General",slug:"general",description:"Project-wide discussion and delivery updates.",kind:"public",createdBy:session.user._id,memberIds:members.map(member=>member.userId)});
        await WorkspaceActivity.create({workspaceId:workspace._id,actorId:session.user._id,actorType:"human",action:"project.workspace_created",targetType:"DeliveryProject",targetId:project._id,summary:"Project collaboration workspace was provisioned.",metadata:{projectId:String(project._id),orderId:String(order._id)}});
        project.workspaceId=workspace._id;await project.save();
        if(template){
          for(const [index,milestoneTemplate] of template.milestones.entries()){
            const milestone=await DeliveryMilestone.create({projectId:project._id,title:milestoneTemplate.title,description:milestoneTemplate.description,sequence:index,amount:milestoneTemplate.amount,currency:order.currency,paymentStatus:milestoneTemplate.amount===0?"not_required":"unconfigured",qaStatus:"not_started",clientApprovalStatus:milestoneTemplate.clientApprovalRequired?"pending":"not_required",createdBy:session.user._id});
            for(const taskTemplate of milestoneTemplate.tasks)await DeliveryTask.create({projectId:project._id,milestoneId:milestone._id,title:taskTemplate.title,description:taskTemplate.description,priority:taskTemplate.priority,status:"todo",createdBy:session.user._id});
          }
        }
        order.status="confirmed";await order.save();
      }catch(error){
        if(workspace){await Promise.all([WorkspaceMembership.deleteMany({workspaceId:workspace._id}),WorkspaceChannel.deleteMany({workspaceId:workspace._id}),WorkspaceActivity.deleteMany({workspaceId:workspace._id}),Workspace.deleteOne({_id:workspace._id})]);}
        await Promise.all([DeliveryTask.deleteMany({projectId:project._id}),DeliveryMilestone.deleteMany({projectId:project._id}),DeliveryProject.deleteOne({_id:project._id})]);
        order.status=previousOrderStatus;await order.save();throw error;
      }
      await audit(session,"delivery.project_created","delivery_project",String(project._id),{reference:project.reference,orderId:String(order._id),templateKey:template?.key||null,workspaceId:workspace?._id?String(workspace._id):null});
      return NextResponse.json({ok:true,item:project,workspace:{id:String(workspace?._id),name:workspace?.name,href:"/workspaces"}},{status:201});
    }
    if(action==="milestone.create") {
      if(!validId(body.projectId)||typeof body.title!=="string"||!body.title.trim())return fail("Project and milestone title are required.");
      const project=await DeliveryProject.findById(body.projectId);if(!project)return fail("Project not found.",404);
      const sequence=await DeliveryMilestone.countDocuments({projectId:project._id});
      const linkedOrder=await CommercialOrder.findById(project.orderId);
      const milestone=await DeliveryMilestone.create({projectId:project._id,title:body.title.trim(),description:String(body.description||""),sequence,amount:Math.max(0,Number(body.amount||0)),currency:String(body.currency||linkedOrder?.currency||"USD").toUpperCase(),paymentStatus:Number(body.amount||0)===0?"not_required":"unconfigured",qaStatus:"not_started",clientApprovalStatus:body.clientApprovalRequired===false?"not_required":"pending",dueDate:body.dueDate?new Date(body.dueDate):undefined,createdBy:session.user._id});
      await audit(session,"delivery.milestone_created","delivery_milestone",String(milestone._id),{projectId:String(project._id),sequence});
      return NextResponse.json({ok:true,item:milestone},{status:201});
    }
    if(action==="task.create") {
      if(!validId(body.projectId)||typeof body.title!=="string"||!body.title.trim())return fail("Project and task title are required.");
      const project=await DeliveryProject.findById(body.projectId);if(!project)return fail("Project not found.",404);
      const assigneeIds=Array.isArray(body.assigneeIds)?body.assigneeIds.filter(validId):[];
      if(assigneeIds.length){const staff=await User.find({_id:{$in:assigneeIds},accountType:"staff",isBanned:false}).select("_id");if(staff.length!==assigneeIds.length)return fail("Every task assignee must be an active staff account.");}
      const task=await DeliveryTask.create({projectId:project._id,milestoneId:validId(body.milestoneId)?body.milestoneId:undefined,title:body.title.trim(),description:String(body.description||""),status:"todo",priority:["low","normal","high","urgent"].includes(body.priority)?body.priority:"normal",assigneeIds,dueDate:body.dueDate?new Date(body.dueDate):undefined,createdBy:session.user._id});
      await audit(session,"delivery.task_created","delivery_task",String(task._id),{projectId:String(project._id)});
      return NextResponse.json({ok:true,item:task},{status:201});
    }
    if(action==="task.update") {
      if(!validId(body.id))return fail("Valid task id required.");
      const task=await DeliveryTask.findById(body.id);if(!task)return fail("Task not found.",404);
      if(body.status!==undefined){if(!["todo","in_progress","blocked","in_review","done"].includes(body.status))return fail("Invalid task status.");task.status=body.status;task.completedAt=body.status==="done"?new Date():undefined;}
      if(body.assigneeIds!==undefined){if(!Array.isArray(body.assigneeIds)||body.assigneeIds.some((x:any)=>!validId(x)))return fail("Invalid assignee list.");const staff=await User.find({_id:{$in:body.assigneeIds},accountType:"staff",isBanned:false}).select("_id");if(staff.length!==body.assigneeIds.length)return fail("Every task assignee must be an active staff account.");task.assigneeIds=body.assigneeIds;}
      if(body.priority!==undefined){if(!["low","normal","high","urgent"].includes(body.priority))return fail("Invalid task priority.");task.priority=body.priority;}
      await task.save();await audit(session,"delivery.task_updated","delivery_task",String(task._id),{status:task.status});
      return NextResponse.json({ok:true,item:task});
    }
    if(action==="resource.allocate") {
      if(!validId(body.projectId)||!validId(body.userId)||typeof body.role!=="string"||!body.role.trim())return fail("Project, employee and assigned role are required.");
      const staff=await User.findOne({_id:body.userId,accountType:"staff",isBanned:false}).select("_id");if(!staff)return fail("Resource allocation must target an active staff account.");
      const allocation=Number(body.allocationPercent);if(!Number.isFinite(allocation)||allocation<1||allocation>100)return fail("Allocation must be between 1 and 100 percent.");
      const startsAt=new Date(body.startsAt||Date.now()),endsAt=body.endsAt?new Date(body.endsAt):undefined;
      const overlapping=await ProjectResourceAllocation.find({userId:body.userId,status:{$in:["planned","active"]},$or:[{endsAt:{$exists:false}},{endsAt:{$gte:startsAt}}],startsAt:{$lte:endsAt||new Date("2999-12-31")}}).lean();
      if(overlapping.reduce((sum:any,item:any)=>sum+item.allocationPercent,0)+allocation>100)return fail("This employee would exceed 100% allocated capacity during the selected period.",409);
      const resource=await ProjectResourceAllocation.create({projectId:body.projectId,userId:body.userId,role:body.role.trim(),allocationPercent:allocation,startsAt,endsAt,status:"planned",notes:String(body.notes||""),createdBy:session.user._id});
      await audit(session,"delivery.resource_allocated","project_resource_allocation",String(resource._id),{projectId:String(body.projectId),userId:String(body.userId),allocationPercent:allocation});
      return NextResponse.json({ok:true,item:resource},{status:201});
    }
    if(action==="deliverable.create") {
      if(!validId(body.projectId)||typeof body.title!=="string"||!body.title.trim())return fail("Project and deliverable title are required.");
      const project=await DeliveryProject.findById(body.projectId);if(!project)return fail("Project not found.",404);
      const latest=await ProjectDeliverable.findOne({projectId:project._id,title:body.title.trim()}).sort({version:-1});
      const deliverable=await ProjectDeliverable.create({projectId:project._id,milestoneId:validId(body.milestoneId)?body.milestoneId:undefined,title:body.title.trim(),description:String(body.description||""),version:(latest?.version||0)+1,status:"draft",createdBy:session.user._id});
      await audit(session,"delivery.deliverable_created","project_deliverable",String(deliverable._id),{projectId:String(project._id),version:deliverable.version});
      return NextResponse.json({ok:true,item:deliverable},{status:201});
    }
    if(action==="qa.review") {
      if(!validId(body.projectId)||!validId(body.deliverableId))return fail("Project and deliverable are required.");
      const deliverable=await ProjectDeliverable.findOne({_id:body.deliverableId,projectId:body.projectId});if(!deliverable)return fail("Deliverable not found in this project.",404);
      if(!Array.isArray(body.checklist)||!body.checklist.length||body.checklist.some((x:any)=>typeof x.item!=="string"||typeof x.passed!=="boolean"))return fail("A QA checklist with a pass/fail result for each item is required.");
      const passed=body.checklist.every((x:any)=>x.passed===true);
      const review=await ProjectQualityReview.create({projectId:body.projectId,deliverableId:deliverable._id,reviewerId:session.user._id,status:passed?"passed":"failed",checklist:body.checklist.slice(0,50),summary:String(body.summary||""),reviewedAt:new Date()});
      deliverable.qaReviewId=review._id;deliverable.status=passed?"client_review":"rejected";await deliverable.save();
      if(deliverable.milestoneId){await DeliveryMilestone.updateOne({_id:deliverable.milestoneId,projectId:body.projectId},{$set:{qaStatus:passed?"passed":"failed",status:passed?"awaiting_payment":"in_qa"}});}
      await audit(session,"delivery.quality_review_completed","project_quality_review",String(review._id),{deliverableId:String(deliverable._id),status:review.status});
      return NextResponse.json({ok:true,item:review,deliverable});
    }
    if(action==="change.decide") {
      if(!validId(body.id))return fail("Valid change request id required.");
      if(!["under_review","approved","rejected","implemented"].includes(body.status))return fail("Invalid change request status.");
      const change=await ProjectChangeRequest.findById(body.id);if(!change)return fail("Change request not found.",404);
      change.status=body.status;change.decisionBy=session.user._id;change.decisionAt=new Date();if(body.impactOnCost!==undefined)change.impactOnCost=Math.max(0,Number(body.impactOnCost));if(body.impactOnDays!==undefined)change.impactOnDays=Math.max(0,Number(body.impactOnDays));await change.save();
      await audit(session,"delivery.change_request_decided","project_change_request",String(change._id),{status:change.status});
      return NextResponse.json({ok:true,item:change});
    }
    if(action==="review.update"){
      if(!validId(body.id)||typeof body.status!=="string"||!["submitted","reviewed","featured","archived"].includes(body.status))return fail("Choose a valid project-review status.");
      const review=await ProjectClientReview.findById(String(body.id));if(!review)return fail("Project review not found.",404);
      review.status=body.status as typeof review.status;review.reviewedBy=session.user._id;review.reviewedAt=new Date();await review.save();
      await audit(session,"client.project_review_status_changed","project_client_review",String(review._id),{status:review.status});
      return NextResponse.json({ok:true,item:review});
    }
    if(action==="maintenance.create") {
      if(!validId(body.projectId)||!validId(body.orderId)||!body.startsAt||!body.endsAt||typeof body.coverage!=="string"||body.coverage.trim().length<10)return fail("Project, order, service period and coverage details are required.");
      const project=await DeliveryProject.findById(body.projectId);const order=await CommercialOrder.findById(body.orderId);
      if(!project||!order||String(project.orderId)!==String(order._id)||project.status!=="completed")return fail("Maintenance or warranty can only be attached to the completed project for its matching order.");
      const startsAt=new Date(body.startsAt),endsAt=new Date(body.endsAt);if(!Number.isFinite(startsAt.getTime())||!Number.isFinite(endsAt.getTime())||endsAt<=startsAt)return fail("The maintenance period is invalid.");
      const record=await MaintenanceWarranty.create({projectId:project._id,orderId:order._id,clientId:order.clientId,type:body.type==="maintenance"?"maintenance":"warranty",status:startsAt<=new Date()&&endsAt>new Date()?"active":"scheduled",startsAt,endsAt,coverage:body.coverage.trim(),serviceLevel:String(body.serviceLevel||"standard"),renewalAmount:body.renewalAmount===undefined?undefined:Math.max(0,Number(body.renewalAmount)),currency:order.currency,createdBy:session.user._id});
      await audit(session,"delivery.maintenance_created","maintenance_warranty",String(record._id),{projectId:String(project._id),type:record.type});
      return NextResponse.json({ok:true,item:record},{status:201});
    }
    return fail("Unsupported commercial action.");
  } catch(error) {
    const message=error instanceof Error?error.message:"Commercial operation failed.";
    return fail(message, message.includes("duplicate key")?409:400);
  }
}
