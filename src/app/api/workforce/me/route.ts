import {NextRequest,NextResponse} from "next/server";
import {getActiveEmployeeContext} from "@/lib/workforce/access";
import {connectToDatabase} from "@/lib/db";
import EmployeeSchedule from "@/models/EmployeeSchedule";
import AttendanceRecord from "@/models/AttendanceRecord";
import WorkforceRequest from "@/models/WorkforceRequest";
import PerformanceReview from "@/models/PerformanceReview";
import EmployeeProfile from "@/models/EmployeeProfile";
import DeliveryProject from "@/models/DeliveryProject";
import DeliveryTask from "@/models/DeliveryTask";
import DeliveryMilestone from "@/models/DeliveryMilestone";
import ProjectDeliverable from "@/models/ProjectDeliverable";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
export const dynamic="force-dynamic";

export async function GET(){
 const ctx=await getActiveEmployeeContext();if(!ctx)return NextResponse.json({error:"An active employee account is required."},{status:403});
 await connectToDatabase();const userId=ctx.session.user._id,now=new Date();
 const [schedule,attendance,requests,reviews,projects]=await Promise.all([
  EmployeeSchedule.findOne({userId,effectiveFrom:{$lte:now},$or:[{effectiveTo:null},{effectiveTo:{$gte:now}}]}).sort({effectiveFrom:-1}).lean(),
  AttendanceRecord.find({userId}).sort({workDate:-1}).limit(30).lean(),
  WorkforceRequest.find({userId}).sort({createdAt:-1}).limit(30).lean(),
  PerformanceReview.find({employeeId:userId,status:{$in:["shared","acknowledged"]}}).sort({periodEnd:-1}).limit(10).lean(),
  DeliveryProject.find({$or:[{projectManager:userId},{teamMembers:userId}],status:{$nin:["completed","cancelled"]}}).sort({updatedAt:-1}).limit(100).lean(),
 ]);
 const projectIds=projects.map(project=>project._id);
 const managerProjectIds=projects.filter(project=>String(project.projectManager||"")===String(userId)).map(project=>project._id);
 const [tasks,taskStats,milestoneStats,deliverableStats]=await Promise.all([
  DeliveryTask.find({$or:[{assigneeIds:userId},{projectId:{$in:managerProjectIds}}]}).populate("projectId","reference name status").populate("milestoneId","title status").sort({dueDate:1,updatedAt:-1}).limit(100).lean(),
  DeliveryTask.aggregate([{$match:{projectId:{$in:projectIds}}},{$group:{_id:"$projectId",total:{$sum:1},completed:{$sum:{$cond:[{$eq:["$status","done"]},1,0]}}}}]),
  DeliveryMilestone.aggregate([{$match:{projectId:{$in:projectIds}}},{$group:{_id:"$projectId",total:{$sum:1},completed:{$sum:{$cond:[{$eq:["$status","completed"]},1,0]}}}}]),
  ProjectDeliverable.aggregate([{$match:{projectId:{$in:projectIds}}},{$group:{_id:"$projectId",total:{$sum:1},released:{$sum:{$cond:[{$eq:["$status","released"]},1,0]}}}}]),
 ]);
 const stats=(rows:any[],id:unknown)=>rows.find(row=>String(row._id)===String(id))||{total:0,completed:0,released:0};
 return NextResponse.json({
  employee:{id:String(ctx.employee._id),employeeCode:ctx.employee.employeeCode,employmentStatus:ctx.employee.employmentStatus,employmentType:ctx.employee.employmentType,timezone:ctx.employee.timezone,workLocation:ctx.employee.workLocation,onboardingChecklist:ctx.employee.onboardingChecklist},
  schedule:schedule?{timezone:schedule.timezone,days:schedule.days}:null,
  attendance:attendance.map(x=>({id:String(x._id),workDate:x.workDate,clockInAt:x.clockInAt.toISOString(),clockOutAt:x.clockOutAt?.toISOString()||null})),
  requests:requests.map(x=>({id:String(x._id),requestType:x.requestType,category:x.category,subject:x.subject,status:x.status,priority:x.priority,createdAt:x.createdAt.toISOString(),startDate:x.startDate?.toISOString()||null,endDate:x.endDate?.toISOString()||null,decisionNote:x.decisionNote||""})),
  reviews:reviews.map(x=>({id:String(x._id),periodStart:x.periodStart.toISOString(),periodEnd:x.periodEnd.toISOString(),status:x.status,ratings:x.ratings,strengths:x.strengths,improvementAreas:x.improvementAreas,goals:x.goals,employeeComment:x.employeeComment||""})),
  projects:projects.map(project=>{const tasksForProject=stats(taskStats,project._id),milestonesForProject=stats(milestoneStats,project._id),deliverablesForProject=stats(deliverableStats,project._id);return {id:String(project._id),reference:project.reference,name:project.name,status:project.status,priority:project.priority,targetDate:project.targetDate?.toISOString()||null,taskCount:tasksForProject.total,completedTaskCount:tasksForProject.completed,milestoneCount:milestonesForProject.total,completedMilestoneCount:milestonesForProject.completed,deliverableCount:deliverablesForProject.total,releasedDeliverableCount:deliverablesForProject.released};}),
  tasks:tasks.map(task=>{const project=task.projectId as any;const milestone=task.milestoneId as any;return {id:String(task._id),title:task.title,description:task.description,status:task.status,priority:task.priority,dueDate:task.dueDate?.toISOString()||null,projectId:String(project?._id||task.projectId),projectName:project?.name||"Project",projectReference:project?.reference||"",milestoneTitle:milestone?.title||null};}),
 },{headers:{"Cache-Control":"private, no-store"}});
}

export async function PATCH(request:NextRequest){
 const ctx=await getActiveEmployeeContext();if(!ctx)return NextResponse.json({error:"An active employee account is required."},{status:403});
 let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid request."},{status:400});}
 const phone=typeof body.phone==="string"?body.phone.trim():"",timezone=typeof body.timezone==="string"?body.timezone.trim():"";
 if(phone.length>40||timezone.length>80)return NextResponse.json({error:"Profile values are too long."},{status:400});
 if(timezone){try{Intl.DateTimeFormat("en",{timeZone:timezone});}catch{return NextResponse.json({error:"Enter a valid IANA timezone."},{status:400});}}
 await connectToDatabase();const profile=await EmployeeProfile.findById(ctx.employee._id);if(!profile)return NextResponse.json({error:"Employee profile not found."},{status:404});
 if(body.phone!==undefined)profile.phone=phone;if(timezone)profile.timezone=timezone;
 if(body.workLocation!==undefined){if(!["remote","hybrid","onsite"].includes(String(body.workLocation)))return NextResponse.json({error:"Invalid work location."},{status:400});profile.workLocation=body.workLocation as typeof profile.workLocation;}
 if(body.emergencyContact&&typeof body.emergencyContact==="object"){const v=body.emergencyContact as Record<string,unknown>;profile.emergencyContact={name:String(v.name||"").slice(0,100),relationship:String(v.relationship||"").slice(0,60),phone:String(v.phone||"").slice(0,40)};}
 if(typeof body.completedChecklistKey==="string"){const item=profile.onboardingChecklist.find(x=>x.key===body.completedChecklistKey);if(!item)return NextResponse.json({error:"Onboarding checklist item not found."},{status:404});if(!item.completedAt){item.completedAt=new Date();item.completedBy=ctx.session.user._id;}}
 await profile.save();if(timezone)await EmployeeSchedule.updateMany({userId:ctx.session.user._id,effectiveTo:null},{$set:{timezone}});
 await writePlatformAuditEvent({actorType:"human",actorId:String(ctx.session.user._id),actorLabel:ctx.session.user.name,action:"workforce.employee_profile_updated",module:"workforce",targetType:"employee",targetId:String(profile._id),outcome:"success",metadata:{fields:Object.keys(body)}});
 return NextResponse.json({ok:true});
}
