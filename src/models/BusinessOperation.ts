import { Schema, model, models, Document, Model, Types } from "mongoose";
export const BUSINESS_OPERATION_TYPES = ["recruitment","contract","training","procurement","vendor","asset","policy","compliance","document","calendar","approval","workflow","payroll_integration"] as const;
export type BusinessOperationType = typeof BUSINESS_OPERATION_TYPES[number];
export const BUSINESS_OPERATION_STATUSES = ["draft","open","in_progress","pending_approval","approved","rejected","completed","active","expired","archived","connected","disconnected"] as const;
export interface IBusinessOperation extends Document {
 type: BusinessOperationType; title: string; description: string; details: string; reference: string; status: typeof BUSINESS_OPERATION_STATUSES[number];
 ownerId?: Types.ObjectId; departmentId?: Types.ObjectId; employeeId?: Types.ObjectId; vendorName: string; amount?: number; currency: string;
 startDate?: Date; dueDate?: Date; documentUrl: string; createdBy: Types.ObjectId; updatedBy: Types.ObjectId; createdAt: Date; updatedAt: Date;
}
const schema = new Schema<IBusinessOperation>({
 type:{type:String,enum:BUSINESS_OPERATION_TYPES,required:true}, title:{type:String,required:true,trim:true,maxlength:180},
 description:{type:String,default:"",trim:true,maxlength:3000}, details:{type:String,default:"",trim:true,maxlength:5000},
 reference:{type:String,default:"",trim:true,maxlength:160}, status:{type:String,enum:BUSINESS_OPERATION_STATUSES,required:true,default:"open"},
 ownerId:{type:Schema.Types.ObjectId,ref:"User"}, departmentId:{type:Schema.Types.ObjectId,ref:"Department"},
 employeeId:{type:Schema.Types.ObjectId,ref:"EmployeeProfile"}, vendorName:{type:String,default:"",trim:true,maxlength:180},
 amount:{type:Number,min:0}, currency:{type:String,default:"NGN",uppercase:true,trim:true,maxlength:3},
 startDate:Date,dueDate:Date,documentUrl:{type:String,default:"",trim:true,maxlength:1000},
 createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},updatedBy:{type:Schema.Types.ObjectId,ref:"User",required:true}
},{timestamps:true,versionKey:true});
schema.index({type:1,status:1,updatedAt:-1}); schema.index({dueDate:1,status:1}); schema.index({departmentId:1,type:1}); schema.index({employeeId:1,type:1});
const BusinessOperation:Model<IBusinessOperation>=models.BusinessOperation||model<IBusinessOperation>("BusinessOperation",schema);
export default BusinessOperation;
