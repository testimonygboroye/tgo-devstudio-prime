import {NextRequest,NextResponse} from "next/server";
import {createHmac,timingSafeEqual} from "node:crypto";
import {getServerSession} from "@/lib/auth/serverSession";
import {connectToDatabase} from "@/lib/db";
import IntegrationConnection from "@/models/IntegrationConnection";
import {encryptCredentials,decryptCredentials} from "@/lib/integrations/crypto";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
export const runtime="nodejs";export const dynamic="force-dynamic";
const names:Record<string,string>={google_search_console:"Google Search Console",google_analytics:"Google Analytics 4"};
function siteUrl(){return (process.env.SITE_URL||process.env.NEXT_PUBLIC_SITE_URL||"").replace(/\/$/,"");}
function sign(value:string){const secret=process.env.JWT_ACCESS_SECRET;if(!secret)throw new Error("OAuth state signing is not configured.");return createHmac("sha256",secret).update(value).digest("hex");}
function fail(message:string){const url=siteUrl();return NextResponse.redirect(new URL("/admin/integrations?oauth_error="+encodeURIComponent(message),url||"https://example.invalid"));}
export async function GET(request:NextRequest){const session=await getServerSession();if(!session||!session.role.isFounderRole)return fail("Founder authentication expired. Please reconnect.");
 const params=request.nextUrl.searchParams;if(params.get("error"))return fail("Google authorization was declined: "+String(params.get("error")).slice(0,100));
 const code=params.get("code")||"",state=params.get("state")||"",cookie=request.cookies.get("tgo_google_oauth_state")?.value||"";
 if(!code||!state||!cookie||state!==cookie)return fail("Google OAuth state validation failed. Start the connection again.");
 const parts=state.split(".");if(parts.length!==4)return fail("Invalid OAuth state.");const [provider,nonce,userId,signature]=parts;const payload=[provider,nonce,userId].join(".");
 if(!names[provider]||userId!==String(session.user._id))return fail("OAuth provider or user mismatch.");
 const expected=sign(payload);const a=Buffer.from(signature),b=Buffer.from(expected);if(a.length!==b.length||!timingSafeEqual(a,b))return fail("OAuth state signature is invalid.");
 const clientId=process.env.GOOGLE_OAUTH_CLIENT_ID,clientSecret=process.env.GOOGLE_OAUTH_CLIENT_SECRET;if(!clientId||!clientSecret||!siteUrl())return fail("Google OAuth environment configuration is incomplete.");
 try{const tokenResponse=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:clientId,client_secret:clientSecret,redirect_uri:siteUrl()+"/api/platform/integrations/google/callback",grant_type:"authorization_code"}),cache:"no-store"});const tokens=await tokenResponse.json() as Record<string,unknown>;if(!tokenResponse.ok||typeof tokens.access_token!=="string")return fail("Google token exchange failed. Check OAuth client and redirect URI.");
 const providerName=names[provider],category=provider==="google_search_console"?"search":"analytics";
 await connectToDatabase();
 const existing=await IntegrationConnection.findOne({providerId:provider}).select("+credentialsCiphertext");
 let previousRefreshToken="";
 try{if(existing?.credentialsCiphertext)previousRefreshToken=decryptCredentials(existing.credentialsCiphertext).refreshToken||"";}catch{}
 const refreshToken=typeof tokens.refresh_token==="string"&&tokens.refresh_token?tokens.refresh_token:previousRefreshToken;
 if(!refreshToken)return fail("Google did not issue a refresh token. Remove the existing TGO DevStudio authorization from your Google Account security settings, then reconnect and approve offline access.");
 const ciphertext=encryptCredentials({accessToken:String(tokens.access_token),refreshToken,expiresAt:String(Date.now()+Number(tokens.expires_in||3600)*1000),scope:String(tokens.scope||""),tokenType:String(tokens.token_type||"Bearer")});
 const row=await IntegrationConnection.findOneAndUpdate({providerId:provider},{$set:{displayName:providerName,category,status:"connected",credentialsCiphertext:ciphertext,credentialNames:["Google OAuth access token","Refresh token"],lastVerifiedAt:new Date(),lastError:"",updatedBy:String(session.user._id)},$setOnInsert:{createdBy:String(session.user._id)}},{upsert:true,new:true,runValidators:true});
 await writePlatformAuditEvent({actorType:"human",actorId:String(session.user._id),actorLabel:session.user.name,action:"integration.google_oauth_connected",module:"integrations",targetType:"IntegrationConnection",targetId:String(row._id),outcome:"success",metadata:{providerId:provider,scope:String(tokens.scope||"")}});
 const response=NextResponse.redirect(new URL("/admin/integrations?oauth_success="+encodeURIComponent(provider),siteUrl()));response.cookies.delete("tgo_google_oauth_state");return response;
 }catch(error){console.error("Google OAuth callback failed",error);return fail("Could not complete Google authorization. Check server logs and OAuth configuration.");}
}
