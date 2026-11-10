import {Schema,model,models,Document,Model,Types} from "mongoose";
export interface IFinanceInvoice extends Document {
 reference:string;clientId:Types.ObjectId;orderId:Types.ObjectId;currency:string;items:Array<{description:string;quantity:number;unitAmountMinor:number;lineTotalMinor:number}>;
 subtotalMinor:number;discountMinor:number;taxMinor:number;taxName?:string;taxRateBps?:number;taxRegistrationNumber?:string;totalMinor:number;amountPaidMinor:number;balanceMinor:number;
 status:"draft"|"issued"|"partially_paid"|"paid"|"overdue"|"void";issuedAt?:Date;dueAt?:Date;terms?:string;createdBy:Types.ObjectId;createdAt:Date;updatedAt:Date;
}
const Line=new Schema({description:{type:String,required:true,maxlength:300},quantity:{type:Number,required:true,min:0.001},unitAmountMinor:{type:Number,required:true,min:0},lineTotalMinor:{type:Number,required:true,min:0}},{_id:false});
const D=new Schema<IFinanceInvoice>({
 reference:{type:String,required:true,unique:true,index:true},clientId:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},
 orderId:{type:Schema.Types.ObjectId,ref:"CommercialOrder",required:true,unique:true,index:true},currency:{type:String,required:true,uppercase:true},
 items:{type:[Line],required:true},subtotalMinor:{type:Number,required:true,min:0},discountMinor:{type:Number,default:0,min:0},taxMinor:{type:Number,default:0,min:0},taxName:{type:String,maxlength:40},taxRateBps:{type:Number,min:0,max:10000},taxRegistrationNumber:{type:String,maxlength:100},
 totalMinor:{type:Number,required:true,min:0},amountPaidMinor:{type:Number,default:0,min:0},balanceMinor:{type:Number,required:true,min:0},
 status:{type:String,enum:["draft","issued","partially_paid","paid","overdue","void"],default:"draft",index:true},
 issuedAt:{type:Date},dueAt:{type:Date},terms:{type:String,maxlength:4000},createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
},{timestamps:true});
D.index({clientId:1,status:1,dueAt:1});
const M:Model<IFinanceInvoice>=models.FinanceInvoice||model<IFinanceInvoice>("FinanceInvoice",D);export default M;
