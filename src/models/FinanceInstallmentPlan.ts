import {Schema,model,models,Document,Model,Types} from "mongoose";
export interface IFinanceInstallmentPlan extends Document {
 orderId:Types.ObjectId;invoiceId?:Types.ObjectId;clientId:Types.ObjectId;currency:string;totalMinor:number;
 installments:Array<{_id:Types.ObjectId;sequence:number;dueAt:Date;amountMinor:number;paidMinor:number;status:"pending"|"partially_paid"|"paid"|"overdue"}>;
 status:"active"|"completed"|"cancelled";createdBy:Types.ObjectId;createdAt:Date;
}
const Installment=new Schema({sequence:{type:Number,required:true,min:1},dueAt:{type:Date,required:true},amountMinor:{type:Number,required:true,min:1},paidMinor:{type:Number,default:0,min:0},status:{type:String,enum:["pending","partially_paid","paid","overdue"],default:"pending"}},{_id:true});
const D=new Schema<IFinanceInstallmentPlan>({
 orderId:{type:Schema.Types.ObjectId,ref:"CommercialOrder",required:true,unique:true},invoiceId:{type:Schema.Types.ObjectId,ref:"FinanceInvoice"},
 clientId:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},currency:{type:String,required:true,uppercase:true},totalMinor:{type:Number,required:true,min:1},
 installments:{type:[Installment],required:true},status:{type:String,enum:["active","completed","cancelled"],default:"active",index:true},
 createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
},{timestamps:true});
const M:Model<IFinanceInstallmentPlan>=models.FinanceInstallmentPlan||model<IFinanceInstallmentPlan>("FinanceInstallmentPlan",D);export default M;
