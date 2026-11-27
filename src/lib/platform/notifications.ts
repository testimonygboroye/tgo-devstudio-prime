import { connectToDatabase } from "@/lib/db";
import PlatformNotification from "@/models/PlatformNotification";
import type { Types } from "mongoose";
import { sanitizePlatformMetadata } from "@/platform/audit/sanitize";
import User from "@/models/User";
import Role from "@/models/Role";
export interface CreatePlatformNotificationInput { recipientId:string|Types.ObjectId; category:string; title:string; body:string; href?:string; actionLabel?:string; priority?:"low"|"normal"|"high"|"urgent"; requiresAction?:boolean; dedupeKey?:string; sourceType?:string; sourceId?:string; metadata?:Record<string,unknown>; }
export async function createPlatformNotification(input:CreatePlatformNotificationInput){await connectToDatabase();const safeHref=input.href&&input.href.startsWith("/")&&!input.href.startsWith("//")?input.href:undefined;const safe={...input,href:safeHref,metadata:sanitizePlatformMetadata(input.metadata||{}) as Record<string,unknown>};if(input.dedupeKey)return PlatformNotification.findOneAndUpdate({recipientId:input.recipientId,dedupeKey:input.dedupeKey},{$setOnInsert:safe},{upsert:true,new:true,setDefaultsOnInsert:true});return PlatformNotification.create(safe);}
export async function notifyUsers(ids:Array<string|Types.ObjectId>,input:Omit<CreatePlatformNotificationInput,"recipientId">){const unique=[...new Set(ids.map(String))].filter(id=>/^[a-f0-9]{24}$/i.test(id));return Promise.all(unique.map(recipientId=>createPlatformNotification({...input,recipientId})));}
export async function notifyRole(roleSlug:string,input:Omit<CreatePlatformNotificationInput,"recipientId">){await connectToDatabase();const role=await Role.findOne({slug:roleSlug}).select("_id").lean();if(!role)return[];const users=await User.find({role:role._id,accountType:"staff",isBanned:false}).select("_id").lean();return notifyUsers(users.map(u=>u._id),input);}
export async function notifyAccountType(accountType:"staff"|"client",input:Omit<CreatePlatformNotificationInput,"recipientId">){await connectToDatabase();const users=await User.find({accountType,isBanned:false}).select("_id").lean();return notifyUsers(users.map(u=>u._id),input);}

export async function notifyStaffWithPermission(contentType:string,input:Omit<CreatePlatformNotificationInput,"recipientId">){
 await connectToDatabase();
 const roles=await Role.find({});
 const allowed=roles.filter(role=>role.isFounderRole||Object.values(role.contentPermissions?.get(contentType)||{}).some(Boolean)).map(role=>role._id);
 if(!allowed.length)return[];
 const users=await User.find({role:{$in:allowed},accountType:"staff",isBanned:false}).select("_id").lean();
 return notifyUsers(users.map(user=>user._id),input);
}
