import {Schema,model,models,Document,Model,Types} from "mongoose";
export interface IFinanceExpense extends Document {
 reference:string;category:string;vendor:string;description:string;amountMinor:number;currency:string;incurredAt:Date;
 status:"submitted"|"approved"|"rejected"|"paid";receiptUrl?:string;requestedBy:Types.ObjectId;approvedBy?:Types.ObjectId;approvedAt?:Date;paidAt?:Date;paymentReference?:string;createdAt:Date;
}
const D=new Schema<IFinanceExpense>({
 reference:{type:String,required:true,unique:true},category:{type:String,required:true,trim:true,maxlength:80},vendor:{type:String,required:true,trim:true,maxlength:160},
 description:{type:String,required:true,trim:true,maxlength:2000},amountMinor:{type:Number,required:true,min:1},currency:{type:String,required:true,uppercase:true},
 incurredAt:{type:Date,required:true},status:{type:String,enum:["submitted","approved","rejected","paid"],default:"submitted",index:true},
 receiptUrl:{type:String,maxlength:1000},requestedBy:{type:Schema.Types.ObjectId,ref:"User",required:true},approvedBy:{type:Schema.Types.ObjectId,ref:"User"},
 approvedAt:{type:Date},paidAt:{type:Date},paymentReference:{type:String,maxlength:160},
},{timestamps:true});
D.index({status:1,incurredAt:-1});
const M:Model<IFinanceExpense>=models.FinanceExpense||model<IFinanceExpense>("FinanceExpense",D);export default M;
