import { Schema, model, models, type Model, type Document } from "mongoose";
export interface ILaunchSettings extends Document {
 enabled:boolean; countdownEnabled:boolean; countdownVisible:boolean; launchDate?:Date; title:string; description:string;
 videoUrl:string; flyerUrl:string; afterLaunchVideoUrl:string; afterLaunchFlyerUrl:string; videoAudioEnabled:boolean; flyerDurationMinutes:number; flyerDurationSeconds:number;
 videoSeconds:number; flyerSeconds:number; videoDurationHours:number; videoDurationMinutes:number; videoDurationSeconds:number; useVideoDurationOverride:boolean; updatedAt:Date;
}
const SchemaDefinition=new Schema<ILaunchSettings>({
 enabled:{type:Boolean,default:false},countdownEnabled:{type:Boolean,default:true},countdownVisible:{type:Boolean,default:true},launchDate:{type:Date},
 title:{type:String,default:"Something exceptional is coming",maxlength:140},
 description:{type:String,default:"Explore what's next from TGO DevStudio.",maxlength:400},
 videoUrl:{type:String,default:""},flyerUrl:{type:String,default:""},videoAudioEnabled:{type:Boolean,default:false},flyerDurationMinutes:{type:Number,default:0,min:0,max:1440},flyerDurationSeconds:{type:Number,default:8,min:0,max:59},
 afterLaunchVideoUrl:{type:String,default:""},afterLaunchFlyerUrl:{type:String,default:""},
 videoSeconds:{type:Number,default:0,min:0,max:86400},flyerSeconds:{type:Number,default:8,min:1,max:3600},
 videoDurationHours:{type:Number,default:0,min:0,max:24},videoDurationMinutes:{type:Number,default:0,min:0,max:59},videoDurationSeconds:{type:Number,default:0,min:0,max:59},useVideoDurationOverride:{type:Boolean,default:false}
},{timestamps:true});
const LaunchSettings:Model<ILaunchSettings>=models.LaunchSettings||model<ILaunchSettings>("LaunchSettings",SchemaDefinition);
export default LaunchSettings;
