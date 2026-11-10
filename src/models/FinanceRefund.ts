import {Schema,model,models,Document,Model,Types} from "mongoose";
export interface IFinanceRefund extends Document {
 reference:string;paymentTransactionId:Types.ObjectId;clientId:Types.ObjectId;orderId:Types.ObjectId;amountMinor:number;currency:string;reason:string;
 status:"requested"|"approved"|"processing"|"processed"|"failed";providerReference?:string;requestedBy:Types.ObjectId;approvedBy?:Types.ObjectId;approvedAt?:Date;processedAt?:Date;failureReason?:string;createdAt:Date;
}
const D=new Schema<IFinanceRefund>({
 reference:{type:String,required:true,unique:true},paymentTransactionId:{type:Schema.Types.ObjectId,ref:"PaymentTransaction",required:true,index:true},
 clientId:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},orderId:{type:Schema.Types.ObjectId,ref:"CommercialOrder",required:true,index:true},
 amountMinor:{type:Number,required:true,min:1},currency:{type:String,required:true,uppercase:true},reason:{type:String,required:true,maxlength:2000},
 status:{type:String,enum:["requested","approved","processing","processed","failed"],default:"requested",index:true},
 providerReference:{type:String},requestedBy:{type:Schema.Types.ObjectId,ref:"User",required:true},approvedBy:{type:Schema.Types.ObjectId,ref:"User"},
 approvedAt:{type:Date},processedAt:{type:Date},failureReason:{type:String,maxlength:1000},
},{timestamps:true});
const M:Model<IFinanceRefund>=models.FinanceRefund||model<IFinanceRefund>("FinanceRefund",D);export default M;
