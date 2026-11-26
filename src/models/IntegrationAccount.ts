import { Schema, model, models, type Document, type Model, Types } from "mongoose";

export type IntegrationOwnerType = "founder" | "client";
export type IntegrationAccountStatus = "configured" | "connected" | "error" | "disconnected" | "revoked";
export interface IIntegrationAccount extends Document {
  providerId: string; accountLabel: string; ownerType: IntegrationOwnerType; ownerId: Types.ObjectId;
  organizationId?: Types.ObjectId; providerAccountId?: string; authMethod: "api_key" | "oauth2" | "github_app" | "service_account" | "webhook";
  credentialsCiphertext: string; credentialNames: string[]; requestedPermissions: string[]; grantedPermissions: string[];
  readEnabled: boolean; writeEnabled: boolean; status: IntegrationAccountStatus; lastVerifiedAt?: Date; lastSyncAt?: Date;
  lastError?: string; connectedBy: Types.ObjectId; disconnectedAt?: Date; revokedAt?: Date;
}
const schema = new Schema<IIntegrationAccount>({
  providerId:{type:String,required:true,index:true,trim:true,maxlength:100}, accountLabel:{type:String,required:true,trim:true,maxlength:120},
  ownerType:{type:String,enum:["founder","client"],required:true,index:true}, ownerId:{type:Schema.Types.ObjectId,required:true,index:true},
  organizationId:{type:Schema.Types.ObjectId,ref:"BusinessOrganization",index:true}, providerAccountId:{type:String,maxlength:240},
  authMethod:{type:String,enum:["api_key","oauth2","github_app","service_account","webhook"],required:true},
  credentialsCiphertext:{type:String,required:true,select:false},credentialNames:{type:[String],default:[]},
  requestedPermissions:{type:[String],default:[]},grantedPermissions:{type:[String],default:[]},
  readEnabled:{type:Boolean,default:true},writeEnabled:{type:Boolean,default:true},
  status:{type:String,enum:["configured","connected","error","disconnected","revoked"],default:"configured",index:true},
  lastVerifiedAt:Date,lastSyncAt:Date,lastError:{type:String,maxlength:1000,default:""},
  connectedBy:{type:Schema.Types.ObjectId,ref:"User",required:true},disconnectedAt:Date,revokedAt:Date
},{timestamps:true});
schema.index({providerId:1,ownerType:1,ownerId:1,accountLabel:1},{unique:true});
schema.index({ownerType:1,ownerId:1,status:1,updatedAt:-1});
const M:Model<IIntegrationAccount>=models.IntegrationAccount||model<IIntegrationAccount>("IntegrationAccount",schema);
export default M;
