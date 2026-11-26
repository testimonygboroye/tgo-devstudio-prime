import { Schema, model, models, type Document, type Model, Types } from "mongoose";
export interface IIntegrationApplication extends Document {
 providerId:string; appName:string; appType:"oauth_app"|"github_app"|"service_account"|"api_client";
 ownerType:"founder"|"client"; ownerId:Types.ObjectId; clientId?:string; clientSecretCiphertext?:string;
 callbackUrl:string; scopes:string[]; active:boolean; createdBy:Types.ObjectId; updatedBy:Types.ObjectId; createdAt?:Date; updatedAt?:Date;
}
const schema=new Schema<IIntegrationApplication>({
 providerId:{type:String,required:true,index:true},appName:{type:String,required:true,trim:true,maxlength:120},
 appType:{type:String,enum:["oauth_app","github_app","service_account","api_client"],required:true},
 ownerType:{type:String,enum:["founder","client"],required:true,index:true},ownerId:{type:Schema.Types.ObjectId,required:true,index:true},
 clientId:{type:String,maxlength:500},clientSecretCiphertext:{type:String,select:false},
 callbackUrl:{type:String,required:true,maxlength:2000},scopes:{type:[String],default:[]},active:{type:Boolean,default:true,index:true},
 createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},updatedBy:{type:Schema.Types.ObjectId,ref:"User",required:true}
},{timestamps:true});
schema.index({providerId:1,ownerType:1,ownerId:1,appName:1},{unique:true});
const M:Model<IIntegrationApplication>=models.IntegrationApplication||model<IIntegrationApplication>("IntegrationApplication",schema);
export default M;
