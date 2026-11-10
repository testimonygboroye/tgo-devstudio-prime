import {Schema,model,models,Document,Model,Types} from "mongoose";
export interface IFinanceReconciliation extends Document {
 reference:string;provider:"paystack"|"bank_transfer";currency:string;fromDate:Date;toDate:Date;scannedCount:number;verifiedCount:number;discrepancyCount:number;
 totalLocalMinor:number;totalProviderMinor:number;status:"completed"|"completed_with_discrepancies"|"failed";details:Array<{paymentId:Types.ObjectId;reference:string;status:string;localAmountMinor:number;providerAmountMinor?:number;note?:string}>;
 createdBy:Types.ObjectId;createdAt:Date;
}
const Detail=new Schema({paymentId:{type:Schema.Types.ObjectId,ref:"PaymentTransaction",required:true},reference:{type:String,required:true},status:{type:String,required:true},localAmountMinor:{type:Number,required:true},providerAmountMinor:{type:Number},note:{type:String}},{_id:false});
const D=new Schema<IFinanceReconciliation>({
 reference:{type:String,required:true,unique:true},provider:{type:String,enum:["paystack","bank_transfer"],required:true},currency:{type:String,required:true,uppercase:true},
 fromDate:{type:Date,required:true},toDate:{type:Date,required:true},scannedCount:{type:Number,default:0},verifiedCount:{type:Number,default:0},discrepancyCount:{type:Number,default:0},
 totalLocalMinor:{type:Number,default:0},totalProviderMinor:{type:Number,default:0},status:{type:String,enum:["completed","completed_with_discrepancies","failed"],required:true},
 details:{type:[Detail],default:[]},createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
},{timestamps:true});
const M:Model<IFinanceReconciliation>=models.FinanceReconciliation||model<IFinanceReconciliation>("FinanceReconciliation",D);export default M;
