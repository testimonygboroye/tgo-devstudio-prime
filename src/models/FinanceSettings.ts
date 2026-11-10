import {Schema,model,models,Document,Model} from "mongoose";
export interface IFinanceSettings extends Document {
 key:string; baseCurrency:string; enabledCurrencies:string[]; invoicePrefix:string; nextInvoiceNumber:number;
 allowPartialPayments:boolean; taxEnabled:boolean; taxName:string; taxRateBps:number; taxRegistrationNumber?:string;
 paystackEnabled:boolean; bankTransferEnabled:boolean; bankName?:string; bankAccountName?:string; bankAccountNumber?:string; bankCode?:string; bankTransferInstructions?:string;
 updatedAt:Date;
}
const D=new Schema<IFinanceSettings>({
 key:{type:String,default:"global",unique:true},
 baseCurrency:{type:String,default:"NGN",uppercase:true},
 enabledCurrencies:{type:[String],default:["NGN","USD"],uppercase:true},
 invoicePrefix:{type:String,default:"TGO-INV"},
 nextInvoiceNumber:{type:Number,default:1,min:1},
 allowPartialPayments:{type:Boolean,default:true},
 taxEnabled:{type:Boolean,default:false},
 taxName:{type:String,default:"VAT",maxlength:40},
 taxRateBps:{type:Number,default:0,min:0,max:10000},
 taxRegistrationNumber:{type:String,trim:true,maxlength:100},
 paystackEnabled:{type:Boolean,default:false},
 bankTransferEnabled:{type:Boolean,default:false},
 bankName:{type:String,trim:true,maxlength:120},
 bankAccountName:{type:String,trim:true,maxlength:120},
 bankAccountNumber:{type:String,trim:true,maxlength:40},
 bankCode:{type:String,trim:true,maxlength:30},
 bankTransferInstructions:{type:String,trim:true,maxlength:2000},
},{timestamps:true});
const M:Model<IFinanceSettings>=models.FinanceSettings||model<IFinanceSettings>("FinanceSettings",D);export default M;
