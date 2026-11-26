import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import ClientProfile from "@/models/ClientProfile";
import IntegrationAccount from "@/models/IntegrationAccount";
import IntegrationApplication from "@/models/IntegrationApplication";
import { INTEGRATION_REGISTRY, getIntegrationProvider } from "@/lib/integrations/registry";
import { encryptCredentials, decryptCredentials } from "@/lib/integrations/crypto";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
import mongoose from "mongoose";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const fail=(message:string,status=400)=>NextResponse.json({error:message},{status});
async function access(){
 const session=await getServerSession(); if(!session)return {response:fail("Authentication required.",401)} as const;
 const founder=Boolean(session.role?.isFounderRole);
 const client=founder?null:await ClientProfile.findOne({userId:session.user._id}).select("organizationId").lean();
 if(!founder&&!client)return {response:fail("An active client account is required to manage client integrations.",403)} as const;
 return {session,ownerType:founder?"founder" as const:"client" as const,ownerId:new mongoose.Types.ObjectId(String(session.user._id)),organizationId:client?.organizationId} as const;
}
function safe(row:any){return {id:String(row._id),providerId:row.providerId,accountLabel:row.accountLabel,ownerType:row.ownerType,ownerId:String(row.ownerId),organizationId:row.organizationId?String(row.organizationId):null,providerAccountId:row.providerAccountId||"",authMethod:row.authMethod,credentialNames:row.credentialNames||[],requestedPermissions:row.requestedPermissions||[],grantedPermissions:row.grantedPermissions||[],readEnabled:row.readEnabled,writeEnabled:row.writeEnabled,status:row.status,lastVerifiedAt:row.lastVerifiedAt||null,lastSyncAt:row.lastSyncAt||null,lastError:row.lastError||"",createdAt:row.createdAt,updatedAt:row.updatedAt};}
export async function GET(){
 const auth=await access();if("response"in auth)return auth.response;await connectToDatabase();
 const filter={ownerType:auth.ownerType,ownerId:auth.ownerId};
 const [accounts,applications]=await Promise.all([
  IntegrationAccount.find(filter).sort({providerId:1,createdAt:-1}).lean(),
  IntegrationApplication.find(filter).select("-clientSecretCiphertext").sort({providerId:1,appName:1}).lean()
 ]);
 return NextResponse.json({providers:INTEGRATION_REGISTRY,accounts:accounts.map(safe),applications:applications.map(a=>({id:String(a._id),providerId:a.providerId,appName:a.appName,appType:a.appType,clientId:a.clientId||"",callbackUrl:a.callbackUrl,scopes:a.scopes||[],active:a.active,createdAt:a.createdAt,updatedAt:a.updatedAt}))},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(request:NextRequest){
 const auth=await access();if("response"in auth)return auth.response;
 let body:any;try{body=await request.json()}catch{return fail("Invalid request body.");}
 await connectToDatabase();
 const providerId=String(body.providerId||"");const provider=getIntegrationProvider(providerId);if(!provider)return fail("Unknown integration provider.");
 const accountLabel=String(body.accountLabel||"").trim().slice(0,120);if(!accountLabel)return fail("Give this account connection a clear label, such as Production GitHub or Client Firebase.");
 const authMethod=["api_key","oauth2","github_app","service_account","webhook"].includes(body.authMethod)?body.authMethod:"api_key";
 const credentials=body.credentials&&typeof body.credentials==="object"&&!Array.isArray(body.credentials)?body.credentials:{};
 const clean:Record<string,string>={};
 for(const [key,value] of Object.entries(credentials)){if(typeof value!=="string"||value.length>12000)return fail("Credentials must be text values under 12,000 characters.");if(value.trim())clean[key]=value.trim();}
 if(!Object.keys(clean).length)return fail("Provide credentials or complete the provider's OAuth authorization flow first.");
 const requested=Array.isArray(body.requestedPermissions)?body.requestedPermissions.filter((x:any)=>typeof x==="string").slice(0,250):[];
 const granted=Array.isArray(body.grantedPermissions)?body.grantedPermissions.filter((x:any)=>typeof x==="string").slice(0,250):[];
 let ciphertext:string;try{ciphertext=encryptCredentials(clean)}catch(e){return fail(e instanceof Error?e.message:"Credential encryption unavailable.",503);}
 const row=await IntegrationAccount.findOneAndUpdate({providerId,ownerType:auth.ownerType,ownerId:auth.ownerId,accountLabel},{
  $set:{authMethod,credentialsCiphertext:ciphertext,credentialNames:Object.keys(clean),requestedPermissions:requested,grantedPermissions:granted,readEnabled:body.readEnabled!==false,writeEnabled:body.writeEnabled!==false,status:"configured",lastError:"",disconnectedAt:null,revokedAt:null,organizationId:auth.organizationId},
  $setOnInsert:{providerId,ownerType:auth.ownerType,ownerId:auth.ownerId,accountLabel,connectedBy:auth.session.user._id}
 },{upsert:true,new:true,runValidators:true});
 await writePlatformAuditEvent({actorType:"human",actorId:String(auth.session.user._id),actorLabel:auth.session.user.name,action:"integration.account_saved",module:"integrations",targetType:"IntegrationAccount",targetId:String(row._id),outcome:"success",metadata:{providerId,accountLabel,ownerType:auth.ownerType,credentialNames:Object.keys(clean),requestedPermissions:requested,grantedPermissions:granted,readEnabled:row.readEnabled,writeEnabled:row.writeEnabled}});
 return NextResponse.json({account:safe(row.toObject()),message:"Account credentials encrypted and stored. Run a provider-specific verification before using this account."},{status:201});
}
export async function PATCH(request:NextRequest){
 const auth=await access();if("response"in auth)return auth.response;
 let body:any;try{body=await request.json()}catch{return fail("Invalid request body.");}
 await connectToDatabase();const id=String(body.id||"");if(!mongoose.isValidObjectId(id))return fail("Invalid integration account.");
 const filter={_id:id,ownerType:auth.ownerType,ownerId:auth.ownerId};const row=await IntegrationAccount.findOne(filter).select("+credentialsCiphertext");if(!row)return fail("Integration account not found in this owner scope.",404);
 if(body.action==="permissions"){
  if(typeof body.readEnabled!=="boolean"||typeof body.writeEnabled!=="boolean")return fail("Read and write permission settings are required.");
  row.readEnabled=body.readEnabled;row.writeEnabled=body.writeEnabled;
  if(Array.isArray(body.requestedPermissions))row.requestedPermissions=body.requestedPermissions.filter((x:any)=>typeof x==="string").slice(0,250);
  await row.save();
 }else if(body.action==="disconnect"||body.action==="revoke"){
  let remoteRevoked=false;
  let remoteRevocationMessage="";
  if(body.action==="revoke"&&row.authMethod==="oauth2"){
   try{
    const credentials=decryptCredentials(row.credentialsCiphertext);
    const application=await IntegrationApplication.findOne({providerId:row.providerId,ownerType:auth.ownerType,ownerId:auth.ownerId,active:true,appType:"oauth_app"}).select("+clientSecretCiphertext");
    const secret=application?.clientSecretCiphertext?decryptCredentials(application.clientSecretCiphertext).clientSecret||"": "";
    if(row.providerId==="github"&&application&&secret&&credentials.accessToken){
     const basic=Buffer.from(String(application.clientId)+":"+secret).toString("base64");
     const response=await fetch("https://api.github.com/applications/"+encodeURIComponent(String(application.clientId))+"/grant",{method:"DELETE",headers:{Authorization:"Basic "+basic,Accept:"application/vnd.github+json","Content-Type":"application/json","User-Agent":"TGO-DevStudio-Prime"},body:JSON.stringify({access_token:credentials.accessToken}),signal:AbortSignal.timeout(12000),cache:"no-store"});
     remoteRevoked=response.ok||response.status===204;
     if(!remoteRevoked)remoteRevocationMessage="GitHub did not confirm remote token revocation (HTTP "+response.status+").";
    }else if((row.providerId==="google_workspace"||row.providerId==="google_cloud")&&(credentials.accessToken||credentials.refreshToken)){
     const token=String(credentials.refreshToken||credentials.accessToken);
     const response=await fetch("https://oauth2.googleapis.com/revoke",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({token}).toString(),signal:AbortSignal.timeout(12000),cache:"no-store"});
     remoteRevoked=response.ok;
     if(!remoteRevoked)remoteRevocationMessage="Google did not confirm remote token revocation (HTTP "+response.status+").";
    }else remoteRevocationMessage="Provider-side revocation is not implemented for this authorization type; local credentials were cleared.";
   }catch(error){remoteRevocationMessage=error instanceof Error?error.message:"Remote revocation could not be confirmed.";}
  }else if(body.action==="revoke")remoteRevocationMessage="This credential type has no provider-side revocation adapter; local credentials were cleared.";
  row.status=body.action==="revoke"&&remoteRevoked?"revoked":"disconnected";
  row.credentialsCiphertext=encryptCredentials({});
  row.disconnectedAt=new Date();
  if(remoteRevoked)row.revokedAt=new Date();
  row.lastError=remoteRevocationMessage|| (body.action==="revoke"?"Local credentials cleared; remote revocation not confirmed.":"Disconnected by account owner.");
  await row.save();
 }else return fail("Unsupported integration account action.");
 await writePlatformAuditEvent({actorType:"human",actorId:String(auth.session.user._id),actorLabel:auth.session.user.name,action:"integration.account_"+body.action,module:"integrations",targetType:"IntegrationAccount",targetId:String(row._id),outcome:"success",metadata:{providerId:row.providerId,accountLabel:row.accountLabel,readEnabled:row.readEnabled,writeEnabled:row.writeEnabled,remoteRevoked:body.action==="revoke"&&row.status==="revoked"}});
 return NextResponse.json({account:safe(row.toObject()),remoteRevoked:body.action==="revoke"&&row.status==="revoked",message:body.action==="revoke"?(row.status==="revoked"?"Provider authorization revoked and local credentials cleared.":"Local credentials cleared. Provider-side revocation could not be confirmed; see the connection diagnostic."):"Account disconnected and local credentials cleared."});
}
