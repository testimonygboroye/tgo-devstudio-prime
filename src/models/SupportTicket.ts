import { Schema, model, models, Document, Model, Types } from "mongoose";

export type SupportTicketStatus = "open" | "in_progress" | "waiting_on_client" | "waiting_on_team" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";
export interface ISupportMessage { _id?: Types.ObjectId; senderId: Types.ObjectId; senderType: "client" | "staff" | "ai" | "system"; body: string; attachments: Array<{name:string;url:string;mimeType:string;size:number}>; createdAt: Date; }
export interface ISupportTicket extends Document {
  reference: string; clientId: Types.ObjectId; subject: string; description: string; category: string;
  status: SupportTicketStatus; priority: SupportTicketPriority; assignedTo?: Types.ObjectId;
  escalationLevel: number; firstResponseDueAt: Date; resolutionDueAt: Date; firstRespondedAt?: Date;
  resolvedAt?: Date; closedAt?: Date; lastEscalatedAt?: Date; messages: ISupportMessage[];
  satisfaction?: { rating: number; feedback?: string; submittedAt: Date };
  createdAt: Date; updatedAt: Date;
}
const MessageSchema = new Schema<ISupportMessage>({
  senderId: {type:Schema.Types.ObjectId,ref:"User",required:true},
  senderType: {type:String,enum:["client","staff","ai","system"],required:true},
  body: {type:String,required:true,trim:true,maxlength:10000},
  attachments: {type:[new Schema({name:{type:String,required:true,maxlength:255},url:{type:String,required:true,maxlength:2000},mimeType:{type:String,required:true,maxlength:120},size:{type:Number,required:true,min:0}},{_id:false})],default:[]},
  createdAt:{type:Date,default:Date.now,required:true},
},{_id:true});
const TicketSchema = new Schema<ISupportTicket>({
  reference:{type:String,required:true,unique:true,index:true},
  clientId:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},
  subject:{type:String,required:true,trim:true,minlength:4,maxlength:180},
  description:{type:String,required:true,trim:true,minlength:10,maxlength:10000},
  category:{type:String,required:true,trim:true,maxlength:80},
  status:{type:String,enum:["open","in_progress","waiting_on_client","waiting_on_team","resolved","closed"],default:"open",index:true},
  priority:{type:String,enum:["low","normal","high","urgent"],default:"normal",index:true},
  assignedTo:{type:Schema.Types.ObjectId,ref:"User",index:true},
  escalationLevel:{type:Number,default:0,min:0,max:5},
  firstResponseDueAt:{type:Date,required:true,index:true},
  resolutionDueAt:{type:Date,required:true,index:true},
  firstRespondedAt:{type:Date},
  resolvedAt:{type:Date},
  closedAt:{type:Date},
  lastEscalatedAt:{type:Date,index:true},
  messages:{type:[MessageSchema],default:[]},
  satisfaction:{rating:{type:Number,min:1,max:5},feedback:{type:String,trim:true,maxlength:2000},submittedAt:{type:Date}},
},{timestamps:true});
TicketSchema.index({clientId:1,updatedAt:-1});
TicketSchema.index({status:1,priority:-1,firstResponseDueAt:1});
TicketSchema.index({assignedTo:1,status:1,updatedAt:-1});
const SupportTicket:Model<ISupportTicket>=models.SupportTicket||model<ISupportTicket>("SupportTicket",TicketSchema);
export default SupportTicket;
