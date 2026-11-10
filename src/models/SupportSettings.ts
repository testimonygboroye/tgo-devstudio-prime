import {Schema,model,models,Model,Document} from "mongoose";

export interface ISupportSettings extends Document {
  key:string;
  categories:string[];
  slaHours:{low:{firstResponse:number;resolution:number};normal:{firstResponse:number;resolution:number};high:{firstResponse:number;resolution:number};urgent:{firstResponse:number;resolution:number}};
  notifications:{emailEnabled:boolean;whatsappEnabled:boolean};
  aiEnabled:boolean;
  updatedBy?:string;
}
const SupportSettingsSchema=new Schema<ISupportSettings>({
  key:{type:String,default:"global",unique:true,required:true},
  categories:{type:[String],default:["General enquiry","Project delivery","Billing and payments","Account access","Technical issue","Other"]},
  slaHours:{type:Schema.Types.Mixed,default:{low:{firstResponse:48,resolution:120},normal:{firstResponse:24,resolution:72},high:{firstResponse:8,resolution:24},urgent:{firstResponse:2,resolution:8}}},
  notifications:{emailEnabled:{type:Boolean,default:true},whatsappEnabled:{type:Boolean,default:false}},
  aiEnabled:{type:Boolean,default:true},
  updatedBy:{type:String},
},{timestamps:true});
const SupportSettings:Model<ISupportSettings>=models.SupportSettings||model<ISupportSettings>("SupportSettings",SupportSettingsSchema);
export default SupportSettings;
