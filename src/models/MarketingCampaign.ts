import { Schema, model, models, type Document, type Model, Types } from "mongoose";
export type CampaignChannel = "email" | "sms";
export interface IMarketingCampaign extends Document {
 name:string;channel:CampaignChannel;subject:string;content:string;audience:"newsletter_subscribers"|"all_clients"|"manual_segment";
 status:"draft"|"ready"|"archived";createdBy:Types.ObjectId;updatedBy:Types.ObjectId;createdAt:Date;updatedAt:Date;
}
const schema=new Schema<IMarketingCampaign>({
 name:{type:String,required:true,trim:true,maxlength:140},channel:{type:String,enum:["email","sms"],required:true},
 subject:{type:String,default:"",trim:true,maxlength:180},content:{type:String,required:true,trim:true,maxlength:20000},
 audience:{type:String,enum:["newsletter_subscribers","all_clients","manual_segment"],default:"newsletter_subscribers"},
 status:{type:String,enum:["draft","ready","archived"],default:"draft",index:true},
 createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},updatedBy:{type:Schema.Types.ObjectId,ref:"User",required:true}
},{timestamps:true});
schema.index({status:1,updatedAt:-1});
const MarketingCampaign:Model<IMarketingCampaign>=models.MarketingCampaign||model<IMarketingCampaign>("MarketingCampaign",schema);
export default MarketingCampaign;
