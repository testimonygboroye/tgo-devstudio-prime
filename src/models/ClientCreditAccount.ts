import {Schema,model,models,Document,Model,Types} from "mongoose";
export interface IClientCreditAccount extends Document {clientId:Types.ObjectId;currency:string;balanceMinor:number;updatedAt:Date;}
const D=new Schema<IClientCreditAccount>({
 clientId:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},currency:{type:String,required:true,uppercase:true},balanceMinor:{type:Number,default:0,min:0},
},{timestamps:true});
D.index({clientId:1,currency:1},{unique:true,name:"client_credit_currency_unique"});
const M:Model<IClientCreditAccount>=models.ClientCreditAccount||model<IClientCreditAccount>("ClientCreditAccount",D);export default M;
