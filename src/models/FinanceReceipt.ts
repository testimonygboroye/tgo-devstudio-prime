import {Schema,model,models,Document,Model,Types} from "mongoose";
export interface IFinanceReceipt extends Document {
 receiptNumber:string;paymentTransactionId:Types.ObjectId;clientId:Types.ObjectId;orderId:Types.ObjectId;invoiceId?:Types.ObjectId;
 amountMinor:number;currency:string;paymentMethod:string;providerReference:string;issuedAt:Date;createdAt:Date;
}
const D=new Schema<IFinanceReceipt>({
 receiptNumber:{type:String,required:true,unique:true,index:true},paymentTransactionId:{type:Schema.Types.ObjectId,ref:"PaymentTransaction",required:true,unique:true},
 clientId:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},orderId:{type:Schema.Types.ObjectId,ref:"CommercialOrder",required:true,index:true},
 invoiceId:{type:Schema.Types.ObjectId,ref:"FinanceInvoice"},amountMinor:{type:Number,required:true,min:1},currency:{type:String,required:true,uppercase:true},
 paymentMethod:{type:String,required:true},providerReference:{type:String,required:true},issuedAt:{type:Date,required:true},
},{timestamps:true});
const M:Model<IFinanceReceipt>=models.FinanceReceipt||model<IFinanceReceipt>("FinanceReceipt",D);export default M;
