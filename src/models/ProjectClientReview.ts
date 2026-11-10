import {Schema,model,models,Document,Model,Types} from "mongoose";
export type ProjectClientReviewStatus="submitted"|"reviewed"|"featured"|"archived";
export interface IProjectClientReview extends Document{projectId:Types.ObjectId;clientId:Types.ObjectId;rating:number;title:string;feedback:string;status:ProjectClientReviewStatus;submittedAt:Date;reviewedAt?:Date;reviewedBy?:Types.ObjectId;createdAt:Date;updatedAt:Date}
const D=new Schema<IProjectClientReview>({projectId:{type:Schema.Types.ObjectId,ref:"DeliveryProject",required:true,index:true},clientId:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},rating:{type:Number,required:true,min:1,max:5,validate:Number.isInteger},title:{type:String,required:true,trim:true,maxlength:160},feedback:{type:String,required:true,trim:true,maxlength:3000},status:{type:String,enum:["submitted","reviewed","featured","archived"],default:"submitted",index:true},submittedAt:{type:Date,default:Date.now},reviewedAt:Date,reviewedBy:{type:Schema.Types.ObjectId,ref:"User"}},{timestamps:true});
D.index({projectId:1,clientId:1},{unique:true});
D.index({status:1,submittedAt:-1});
const M:Model<IProjectClientReview>=models.ProjectClientReview||model<IProjectClientReview>("ProjectClientReview",D);export default M;
