import { Schema, model, models, type Document, type Model } from "mongoose";

export const AD_PLACEMENTS = [
  "home-media-after","home-footer-before","about-content","services-content",
  "service-detail","portfolio-content","blog-listing","blog-article","client-partners"
] as const;
export type AdPlacement = typeof AD_PLACEMENTS[number];
export interface IAdMedia { kind:"image"|"video"; url:string; altText:string; durationSeconds:number; }
export interface IAdvertisement extends Document {
  title:string; description:string; category:"tgo"|"external"|"partner"; status:"draft"|"active"|"paused"|"scheduled"|"expired";
  placements:AdPlacement[]; media:IAdMedia[]; ctaLabel:string; targetUrl:string; startsAt?:Date; endsAt?:Date;
  displayOrder:number; frequencyCap:number; approved:boolean; impressions:number; clicks:number; createdAt:Date; updatedAt:Date;
}
const MediaSchema=new Schema<IAdMedia>({kind:{type:String,enum:["image","video"],required:true},url:{type:String,required:true,maxlength:1200},altText:{type:String,default:"",maxlength:180},durationSeconds:{type:Number,default:8,min:1,max:86400}},{_id:true});
const AdvertisementSchema=new Schema<IAdvertisement>({
 title:{type:String,required:true,trim:true,maxlength:120},description:{type:String,default:"",trim:true,maxlength:360},
 category:{type:String,enum:["tgo","external","partner"],default:"external",index:true},
 status:{type:String,enum:["draft","active","paused","scheduled","expired"],default:"draft",index:true},
 placements:{type:[String],enum:AD_PLACEMENTS,default:[]},media:{type:[MediaSchema],default:[]},
 ctaLabel:{type:String,default:"Learn more",trim:true,maxlength:40},targetUrl:{type:String,default:"",maxlength:1200},
 startsAt:{type:Date},endsAt:{type:Date},displayOrder:{type:Number,default:0},frequencyCap:{type:Number,default:2,min:0,max:20},
 approved:{type:Boolean,default:false,index:true},impressions:{type:Number,default:0,min:0},clicks:{type:Number,default:0,min:0}
},{timestamps:true});
AdvertisementSchema.index({status:1,approved:1,placements:1,startsAt:1,endsAt:1});
const Advertisement:Model<IAdvertisement>=models.Advertisement||model<IAdvertisement>("Advertisement",AdvertisementSchema);
export default Advertisement;
