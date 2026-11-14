import {NextRequest,NextResponse} from "next/server";
import {createHmac,randomBytes} from "node:crypto";
import {getServerSession} from "@/lib/auth/serverSession";
export const runtime="nodejs";export const dynamic="force-dynamic";
const scopes:Record<string,string>={google_search_console:"https://www.googleapis.com/auth/webmasters.readonly",google_analytics:"https://www.googleapis.com/auth/analytics.readonly"};
function siteUrl(){return (process.env.SITE_URL||process.env.NEXT_PUBLIC_SITE_URL||"").replace(/\/$/,"");}
function sign(value:string){const secret=process.env.JWT_ACCESS_SECRET;if(!secret)throw new Error("OAuth state signing is not configured.");return createHmac("sha256",secret).update(value).digest("hex");}
export async function GET(request:NextRequest){const session=await getServerSession();if(!session)return NextResponse.json({error:"Authentication required."},{status:401});if(!session.role.isFounderRole)return NextResponse.json({error:"Founder access required."},{status:403});
 const provider=request.nextUrl.searchParams.get("provider")||"";if(!scopes[provider])return NextResponse.json({error:"Unsupported Google integration."},{status:400});
 const clientId=process.env.GOOGLE_OAUTH_CLIENT_ID;const missing=["GOOGLE_OAUTH_CLIENT_ID","GOOGLE_OAUTH_CLIENT_SECRET","SITE_URL","JWT_ACCESS_SECRET"].filter(name=>!process.env[name]&&!(name==="SITE_URL"&&process.env.NEXT_PUBLIC_SITE_URL));if(missing.length)return NextResponse.json({error:"Google OAuth is not ready. Add these production environment variables: "+missing.join(", ")+"."},{status:503});
 const state=randomBytes(24).toString("base64url"),payload=provider+"."+state+"."+String(session.user._id),signature=sign(payload);
 const redirectUri=siteUrl()+"/api/platform/integrations/google/callback";
 const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");url.searchParams.set("client_id",clientId);url.searchParams.set("redirect_uri",redirectUri);url.searchParams.set("response_type","code");url.searchParams.set("scope",scopes[provider]);url.searchParams.set("access_type","offline");url.searchParams.set("prompt","consent");url.searchParams.set("include_granted_scopes","true");url.searchParams.set("state",payload+"."+signature);
 const response=NextResponse.redirect(url);response.cookies.set("tgo_google_oauth_state",payload+"."+signature,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/api/platform/integrations/google",maxAge:600});return response;
}
