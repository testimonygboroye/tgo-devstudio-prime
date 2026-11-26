import {Schema,model,models,type Document,type Model} from "mongoose";
export interface IAIExecutionLog extends Document {
 traceId:string; feature:string; providerId?:string; providerName?:string; providerType?:string; model:string;
 status:"success"|"failure"|"fallback"; durationMs:number; inputTokens:number; outputTokens:number; httpStatus?:number;
 errorCode?:string; errorMessage?:string; fallbackFrom?:string; createdAt:Date;
}
const schema=new Schema<IAIExecutionLog>({
 traceId:{type:String,required:true,index:true,maxlength:100},feature:{type:String,required:true,index:true,maxlength:100},
 providerId:{type:String,index:true,maxlength:100},providerName:{type:String,maxlength:120},providerType:{type:String,maxlength:60},
 model:{type:String,required:true,index:true,maxlength:160},status:{type:String,enum:["success","failure","fallback"],required:true,index:true},
 durationMs:{type:Number,default:0,min:0},inputTokens:{type:Number,default:0,min:0},outputTokens:{type:Number,default:0,min:0},
 httpStatus:Number,errorCode:{type:String,maxlength:120},errorMessage:{type:String,maxlength:2000},fallbackFrom:{type:String,maxlength:300}
},{timestamps:{createdAt:true,updatedAt:false}});
schema.index({createdAt:-1,status:1});schema.index({providerId:1,model:1,createdAt:-1});
const M:Model<IAIExecutionLog>=models.AIExecutionLog||model<IAIExecutionLog>("AIExecutionLog",schema);
export default M;
