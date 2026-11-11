import {NextRequest,NextResponse} from "next/server";
import {Types} from "mongoose";
import {getServerSession} from "@/lib/auth/serverSession";
import {connectToDatabase} from "@/lib/db";
import BusinessOperation,{BUSINESS_OPERATION_TYPES,BUSINESS_OPERATION_STATUSES} from "@/models/BusinessOperation";
import EmployeeProfile from "@/models/EmployeeProfile";
import Department from "@/models/Department";
import User from "@/models/User";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
export const dynamic="force-dynamic";
const fail=(message:string,status=400)=>NextResponse.json({error:message},{status});
const str=(v:unknown,max:number)=>typeof v==="string"?v.trim().slice(0,max):"";
const asDate=(v:unknown):Date|undefined=>{if(!v)return undefined;const d=new Date(String(v));return Number.isFinite(d.getTime())?d:undefined;};
const initialStatus=(type:string)=>type==="contract"?"draft":type==="procurement"||type==="approval"?"pending_approval":type==="payroll_integration"?"disconnected":["policy","vendor","asset"].includes(type)?"active":"open";
async function auth(){const session=await getServerSession();if(!session)return{response:fail("Authentication required.",401)} as const;if(!session.role.isFounderRole)return{response:fail("Founder access required.",403)} as const;return{session} as const;}
const serialize=(r:Record<string,unknown>)=>{const o=(v:unknown)=>v&&typeof v==="object"?v as Record<string,unknown>:null;const owner=o(r.ownerId),dept=o(r.departmentId),emp=o(r.employeeId),empUser=o(emp?.userId);return{id:String(r._id),type:r.type,title:r.title,description:r.description||"",details:r.details||"",reference:r.reference||"",status:r.status,ownerId:owner?String(owner._id):r.ownerId?String(r.ownerId):"",ownerName:owner?.name||"",departmentId:dept?String(dept._id):r.departmentId?String(r.departmentId):"",departmentName:dept?.name||"",employeeId:emp?String(emp._id):r.employeeId?String(r.employeeId):"",employeeName:empUser?.name||"",vendorName:r.vendorName||"",amount:r.amount??null,currency:r.currency||"NGN",startDate:r.startDate?new Date(String(r.startDate)).toISOString():"",dueDate:r.dueDate?new Date(String(r.dueDate)).toISOString():"",documentUrl:r.documentUrl||"",createdAt:r.createdAt,updatedAt:r.updatedAt};};
export async function GET(request:NextRequest){
 const a=await auth();if("response"in a)return a.response;await connectToDatabase();const p=new URL(request.url).searchParams,type=p.get("type")||"",status=p.get("status")||"";
 if(type&&!BUSINESS_OPERATION_TYPES.includes(type as typeof BUSINESS_OPERATION_TYPES[number]))return fail("Invalid operation type.");
 if(status&&!BUSINESS_OPERATION_STATUSES.includes(status as typeof BUSINESS_OPERATION_STATUSES[number]))return fail("Invalid operation status.");
 const filter:Record<string,unknown>={};if(type)filter.type=type;if(status)filter.status=status;
 const [rows,counts,employees,departments]=await Promise.all([
  BusinessOperation.find(filter).populate("ownerId","name email").populate("departmentId","name").populate({path:"employeeId",select:"employeeCode userId",populate:{path:"userId",select:"name email"}}).sort({updatedAt:-1}).limit(500).lean(),
  BusinessOperation.aggregate([{$group:{_id:{type:"$type",status:"$status"},count:{$sum:1}}}]),
  EmployeeProfile.find({employmentStatus:{$in:["active","onboarding"]}}).populate("userId","name").select("employeeCode userId").sort({employeeCode:1}).limit(500).lean(),
  Department.find({status:"active"}).select("name").sort({name:1}).lean()
 ]);
 return NextResponse.json({records:rows.map(x=>serialize(x as unknown as Record<string,unknown>)),counts:counts.map((x:{_id:{type:string;status:string};count:number})=>({type:x._id.type,status:x._id.status,count:x.count})),employees:employees.map(x=>({id:String(x._id),code:x.employeeCode,name:x.userId&&typeof x.userId==="object"&&"name"in x.userId?String(x.userId.name):"Staff member"})),departments:departments.map(x=>({id:String(x._id),name:x.name}))},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(request:NextRequest){
 const a=await auth();if("response"in a)return a.response;let b:Record<string,unknown>;try{b=await request.json();}catch{return fail("Invalid request body.");}
 const type=str(b.type,40),title=str(b.title,180);if(!BUSINESS_OPERATION_TYPES.includes(type as typeof BUSINESS_OPERATION_TYPES[number]))return fail("Choose a valid operations category.");if(!title)return fail("A title is required.");
 const currency=(str(b.currency||"NGN",3)||"NGN").toUpperCase();if(!/^[A-Z]{3}$/.test(currency))return fail("Currency must be a three-letter code.");
 const amount=b.amount===""||b.amount===null||b.amount===undefined?undefined:Number(b.amount);if(amount!==undefined&&(!Number.isFinite(amount)||amount<0||amount>1e12))return fail("Enter a valid non-negative amount.");
 const startDate=asDate(b.startDate),dueDate=asDate(b.dueDate);if(b.startDate&&!startDate||b.dueDate&&!dueDate)return fail("Enter a valid date.");
 const documentUrl=str(b.documentUrl,1000);if(documentUrl){try{if(new URL(documentUrl).protocol!=="https:")return fail("Document links must use HTTPS.");}catch{return fail("Enter a valid HTTPS document link.");}}
 await connectToDatabase();const ownerId=str(b.ownerId,64),departmentId=str(b.departmentId,64),employeeId=str(b.employeeId,64);
 if(ownerId&&(!Types.ObjectId.isValid(ownerId)||!await User.exists({_id:ownerId,accountType:{$ne:"client"},isBanned:false})))return fail("Choose an active staff owner.");
 if(departmentId&&(!Types.ObjectId.isValid(departmentId)||!await Department.exists({_id:departmentId,status:"active"})))return fail("Choose an active department.");
 if(employeeId&&(!Types.ObjectId.isValid(employeeId)||!await EmployeeProfile.exists({_id:employeeId,employmentStatus:{$in:["active","onboarding"]}})))return fail("Choose an active employee.");
 const record=await BusinessOperation.create({type,title,description:str(b.description,3000),details:str(b.details,5000),reference:str(b.reference,160),status:initialStatus(type),ownerId:ownerId||undefined,departmentId:departmentId||undefined,employeeId:employeeId||undefined,vendorName:str(b.vendorName,180),amount,currency,startDate,dueDate,documentUrl,createdBy:a.session.user._id,updatedBy:a.session.user._id});
 await writePlatformAuditEvent({actorType:"human",actorId:String(a.session.user._id),actorLabel:a.session.user.name,action:"operations.record_created",module:"business_operations",targetType:type,targetId:String(record._id),outcome:"success",metadata:{title,status:record.status,reference:record.reference}});
 return NextResponse.json({id:String(record._id),status:record.status},{status:201});
}
export async function PATCH(request:NextRequest){
 const a=await auth();if("response"in a)return a.response;let b:Record<string,unknown>;try{b=await request.json();}catch{return fail("Invalid request body.");}
 const id=str(b.id,64);if(!Types.ObjectId.isValid(id))return fail("A valid record id is required.");await connectToDatabase();const record=await BusinessOperation.findById(id);if(!record)return fail("Record not found.",404);
 const action=str(b.action,30);
 if(action){
  const transitions:Record<string,string[]>={approve:["pending_approval"],reject:["pending_approval"],complete:["open","in_progress","approved","active"],start:["open","draft"],archive:["completed","rejected","expired","active","disconnected","draft"],reopen:["archived","rejected"],expire:["active","approved"]};
  if(!transitions[action]?.includes(record.status))return fail("This action is not valid for the record's current status.",409);
  if(record.type==="payroll_integration"&&action!=="archive")return fail("Payroll execution is disabled until a real provider connector is configured and verified.");
  const before=record.status,next:Record<string,string>={approve:"approved",reject:"rejected",complete:"completed",start:"in_progress",archive:"archived",reopen:"open",expire:"expired"};
  record.status=next[action] as typeof record.status;record.updatedBy=a.session.user._id;await record.save();
  await writePlatformAuditEvent({actorType:"human",actorId:String(a.session.user._id),actorLabel:a.session.user.name,action:"operations."+action,module:"business_operations",targetType:record.type,targetId:id,outcome:"success",metadata:{previousStatus:before,nextStatus:record.status,title:record.title}});
  return NextResponse.json({ok:true,status:record.status});
 }
 const fields:Record<string,unknown>={};for(const key of ["title","description","details","reference","vendorName"]){if(b[key]!==undefined)fields[key]=str(b[key],key==="title"?180:key==="details"?5000:key==="description"?3000:180);}
 if(b.title!==undefined&&!fields.title)return fail("A title is required.");
 if(b.currency!==undefined){const c=str(b.currency,3).toUpperCase();if(!/^[A-Z]{3}$/.test(c))return fail("Currency must be a three-letter code.");fields.currency=c;}
 if(b.amount!==undefined){const n=b.amount===""||b.amount===null?undefined:Number(b.amount);if(n!==undefined&&(!Number.isFinite(n)||n<0||n>1e12))return fail("Enter a valid amount.");fields.amount=n;}
 for(const key of ["startDate","dueDate"]){if(b[key]!==undefined){const d=asDate(b[key]);if(b[key]&&!d)return fail("Enter a valid date.");fields[key]=d;}}
 if(b.documentUrl!==undefined){const u=str(b.documentUrl,1000);if(u){try{if(new URL(u).protocol!=="https:")return fail("Document links must use HTTPS.");}catch{return fail("Enter a valid HTTPS document link.");}}fields.documentUrl=u;}
 for(const key of ["ownerId","departmentId","employeeId"]){if(b[key]===undefined)continue;const v=str(b[key],64);if(!v){fields[key]=undefined;continue;}if(!Types.ObjectId.isValid(v))return fail("An assigned record reference is invalid.");if(key==="ownerId"&&!await User.exists({_id:v,accountType:{$ne:"client"},isBanned:false}))return fail("Choose an active staff owner.");if(key==="departmentId"&&!await Department.exists({_id:v,status:"active"}))return fail("Choose an active department.");if(key==="employeeId"&&!await EmployeeProfile.exists({_id:v,employmentStatus:{$in:["active","onboarding"]}}))return fail("Choose an active employee.");fields[key]=v;}
 if(!Object.keys(fields).length)return fail("No editable changes were supplied.");
 const previous:Record<string,unknown>={};for(const k of Object.keys(fields))previous[k]=(record as unknown as Record<string,unknown>)[k];
 Object.assign(record,fields,{updatedBy:a.session.user._id});await record.save();
 await writePlatformAuditEvent({actorType:"human",actorId:String(a.session.user._id),actorLabel:a.session.user.name,action:"operations.record_updated",module:"business_operations",targetType:record.type,targetId:id,outcome:"success",metadata:{title:record.title,changedFields:Object.keys(fields),previousValues:previous}});
 return NextResponse.json({ok:true});
}
