import { Schema, model, models, Document, Model, Types } from "mongoose";
export interface ITeam extends Document { name:string; slug:string; departmentId:Types.ObjectId; managerId?:Types.ObjectId; description?:string; status:"active"|"archived"; createdBy:Types.ObjectId; createdAt:Date; updatedAt:Date; }
const TeamSchema=new Schema<ITeam>({name:{type:String,required:true,trim:true,maxlength:120},slug:{type:String,required:true,lowercase:true,trim:true},departmentId:{type:Schema.Types.ObjectId,ref:"Department",required:true},managerId:{type:Schema.Types.ObjectId,ref:"User"},description:{type:String,trim:true,maxlength:1000},status:{type:String,enum:["active","archived"],default:"active"},createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true}},{timestamps:true});
TeamSchema.index({departmentId:1,status:1,name:1}); TeamSchema.index({slug:1},{unique:true});
const Team:Model<ITeam>=models.Team||model<ITeam>("Team",TeamSchema); export default Team;
