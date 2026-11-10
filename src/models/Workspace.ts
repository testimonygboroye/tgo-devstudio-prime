import { Schema, model, models, Document, Model, Types } from "mongoose";
export type WorkspaceKind = "company" | "department" | "team" | "employee" | "client" | "project" | "direct" | "group" | "ai";
export interface IWorkspace extends Document {
  name: string; slug: string; description?: string; kind: WorkspaceKind; visibility: "private" | "organization";
  ownerId: Types.ObjectId; organizationId?: Types.ObjectId; departmentId?: Types.ObjectId; teamId?: Types.ObjectId;
  clientId?: Types.ObjectId; projectId?: Types.ObjectId; deliveryProjectId?: Types.ObjectId; status: "active" | "archived";
  settings: { allowMemberInvites: boolean; allowClientMembers: boolean; allowAiAgents: boolean };
  createdAt: Date; updatedAt: Date;
}
const WorkspaceSchema = new Schema<IWorkspace>({
  name:{type:String,required:true,trim:true,maxlength:120}, slug:{type:String,required:true,trim:true,lowercase:true,maxlength:140},
  description:{type:String,trim:true,maxlength:2000}, kind:{type:String,enum:["company","department","team","employee","client","project","direct","group","ai"],required:true},
  visibility:{type:String,enum:["private","organization"],default:"private"}, ownerId:{type:Schema.Types.ObjectId,ref:"User",required:true},
  organizationId:{type:Schema.Types.ObjectId,ref:"ClientOrganization"}, departmentId:{type:Schema.Types.ObjectId,ref:"Department"},
  teamId:{type:Schema.Types.ObjectId,ref:"Team"}, clientId:{type:Schema.Types.ObjectId,ref:"User"}, projectId:{type:Schema.Types.ObjectId,ref:"Project"}, deliveryProjectId:{type:Schema.Types.ObjectId,ref:"DeliveryProject"},
  status:{type:String,enum:["active","archived"],default:"active"},
  settings:{allowMemberInvites:{type:Boolean,default:false},allowClientMembers:{type:Boolean,default:false},allowAiAgents:{type:Boolean,default:false}}
},{timestamps:true});
WorkspaceSchema.index({slug:1},{unique:true}); WorkspaceSchema.index({ownerId:1,status:1}); WorkspaceSchema.index({kind:1,status:1}); WorkspaceSchema.index({deliveryProjectId:1},{unique:true,sparse:true});
const Workspace:Model<IWorkspace>=models.Workspace||model<IWorkspace>("Workspace",WorkspaceSchema); export default Workspace;