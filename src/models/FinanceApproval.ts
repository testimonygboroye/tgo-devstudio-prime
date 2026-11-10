import {Schema,model,models,Document,Model,Types} from "mongoose";
export interface IFinanceApproval extends Document {
 action:"expense_payment"|"refund"|"credit_adjustment";targetId:Types.ObjectId;amountMinor:number;currency:string;requestedBy:Types.ObjectId;
 status:"pending"|"approved"|"rejected";decidedBy?:Types.ObjectId;decidedAt?:Date;decisionNote?:string;createdAt:Date;
}
const D=new Schema<IFinanceApproval>({
 action:{type:String,enum:["expense_payment","refund","credit_adjustment"],required:true},targetId:{type:Schema.Types.ObjectId,required:true,index:true},
 amountMinor:{type:Number,required:true,min:1},currency:{type:String,required:true,uppercase:true},requestedBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 status:{type:String,enum:["pending","approved","rejected"],default:"pending",index:true},decidedBy:{type:Schema.Types.ObjectId,ref:"User"},
 decidedAt:{type:Date},decisionNote:{type:String,maxlength:1000},
},{timestamps:true});
const M:Model<IFinanceApproval>=models.FinanceApproval||model<IFinanceApproval>("FinanceApproval",D);export default M;
