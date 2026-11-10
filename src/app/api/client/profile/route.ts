import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import ClientProfile from "@/models/ClientProfile";
import ClientActivity from "@/models/ClientActivity";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/db";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const dynamic = "force-dynamic";
export async function GET() {
  const session=await getServerSession();
  if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)return NextResponse.json({error:"Verified client sign-in required."},{status:401});
  await connectToDatabase();
  const profile=await ClientProfile.findOne({userId:session.user._id}).populate("organizationId","name slug").lean();
  const account=await User.findById(session.user._id).select("firstName middleName lastName").lean();
  const organization=profile?.organizationId&&typeof profile.organizationId==="object"&&"name" in profile.organizationId?profile.organizationId as unknown as {name:string;slug:string}:null;
  return NextResponse.json({profile:profile?{id:String(profile._id),phone:profile.phone||"",jobTitle:profile.jobTitle||"",website:profile.website||"",country:profile.country||"",timezone:profile.timezone||"",lifecycle:profile.lifecycle,segments:profile.segments,onboardingStatus:profile.onboardingStatus,organization:organization?{name:organization.name,slug:organization.slug}:null}:null,user:{name:session.user.name,firstName:account?.firstName||"",middleName:account?.middleName||"",lastName:account?.lastName||"",email:session.user.email,emailVerified:session.user.isEmailVerified}},{headers:{"Cache-Control":"private, no-store"}});
}
export async function PATCH(request:NextRequest) {
  const session=await getServerSession();
  if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)return NextResponse.json({error:"Verified client sign-in required."},{status:401});
  let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid request."},{status:400});}
  const allowed=["phone","jobTitle","website","country","timezone"] as const;
  const values:Record<string,string>={};
  const maxLengths:Record<(typeof allowed)[number],number>={phone:40,jobTitle:120,website:300,country:100,timezone:80};
  for(const key of allowed)if(body[key]!==undefined){if(typeof body[key]!=="string"||String(body[key]).length>maxLengths[key])return NextResponse.json({error:"One or more profile fields are invalid."},{status:400});values[key]=String(body[key]).trim();}
  const firstName=typeof body.firstName==="string"?body.firstName.trim():undefined;
  const middleName=typeof body.middleName==="string"?body.middleName.trim():undefined;
  const lastName=typeof body.lastName==="string"?body.lastName.trim():undefined;
  if(firstName!==undefined&&(firstName.length<2||firstName.length>60))return NextResponse.json({error:"First name must be between 2 and 60 characters."},{status:400});
  if(middleName!==undefined&&middleName.length>60)return NextResponse.json({error:"Middle name must be 60 characters or fewer."},{status:400});
  if(lastName!==undefined&&(lastName.length<2||lastName.length>60))return NextResponse.json({error:"Last name must be between 2 and 60 characters."},{status:400});
  if(values.website&&!/^https:\/\//i.test(values.website))return NextResponse.json({error:"Website must use https://."},{status:400});
  if(!Object.keys(values).length&&firstName===undefined&&middleName===undefined&&lastName===undefined)return NextResponse.json({error:"No profile changes were supplied."},{status:400});
  await connectToDatabase();
  const current=await ClientProfile.findOne({userId:session.user._id});if(!current)return NextResponse.json({error:"Client profile not found."},{status:404});
  const merged={phone:values.phone??current.phone??"",country:values.country??current.country??"",timezone:values.timezone??current.timezone??""};
  const onboardingStatus=merged.phone&&merged.country&&merged.timezone?"completed":"in_progress";
  const profile=await ClientProfile.findOneAndUpdate({userId:session.user._id},{$set:{...values,onboardingStatus}},{new:true,runValidators:true});
  const accountUpdate:Record<string,unknown>={};
  if(firstName!==undefined)accountUpdate.firstName=firstName;
  if(middleName!==undefined)accountUpdate.middleName=middleName||undefined;
  if(lastName!==undefined)accountUpdate.lastName=lastName;
  if(Object.keys(accountUpdate).length){const account=await User.findOne({_id:session.user._id,accountType:"client"});if(!account)return NextResponse.json({error:"Client account not found."},{status:404});Object.assign(account,accountUpdate);const names=[accountUpdate.firstName??account.firstName,accountUpdate.middleName??account.middleName,accountUpdate.lastName??account.lastName].filter(Boolean);account.name=names.join(" ");await account.save();}
  if(!profile)return NextResponse.json({error:"Client profile not found."},{status:404});
  const fields=[...Object.keys(values),...(Object.keys(accountUpdate).length?Object.keys(accountUpdate):[])];
  await Promise.all([
    ClientActivity.create({clientId:session.user._id,actorId:session.user._id,actorType:"client",action:"client.profile_updated",summary:"Client updated their personal and contact details.",metadata:{fields}}),
    writePlatformAuditEvent({actorType:"human",actorId:String(session.user._id),actorLabel:session.user.name,action:"client.profile_updated",module:"clients",targetType:"client",targetId:String(session.user._id),outcome:"success",metadata:{fields,onboardingStatus}}),
  ]);
  return NextResponse.json({ok:true,message:"Profile updated."});
}
