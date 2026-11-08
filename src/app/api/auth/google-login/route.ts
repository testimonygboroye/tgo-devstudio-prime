import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import { signAccessToken, signRefreshToken, signTemp2FAToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { apiError, apiSuccess } from "@/lib/i18n/apiResponse";

async function verifyGoogleCredential(credential:string) {
  const clientId=process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if(!clientId) throw new Error("Google sign-in is not configured.");
  const response=await fetch("https://oauth2.googleapis.com/tokeninfo?id_token="+encodeURIComponent(credential),{cache:"no-store"});
  if(!response.ok) throw new Error("Google credential is invalid or expired.");
  const claims=await response.json();
  if(claims.aud!==clientId || !["accounts.google.com","https://accounts.google.com"].includes(claims.iss) || Number(claims.exp)*1000<=Date.now() || claims.email_verified!=="true" || !claims.sub || !claims.email) throw new Error("Google could not verify this account.");
  return {sub:String(claims.sub),email:String(claims.email).trim().toLowerCase(),name:String(claims.name||"").trim()};
}
export async function POST(request:NextRequest) {
  try {
    const {credential}=await request.json() as {credential?:string};
    if(!credential) return apiError("invalidCredentials","Google credential is required.",400);
    const google=await verifyGoogleCredential(credential);
    await connectToDatabase();
    const user=await User.findOne({email:google.email});
    if(!user) return apiError("invalidCredentials","No existing TGO administrator account matches this verified Google email. Accept an invitation first.",403);
    if(user.isBanned) return apiError("accountSuspended","This account has been suspended. Contact the Founder.",403);
    if(user.googleSub && user.googleSub!==google.sub) return apiError("invalidCredentials","This Google account is not linked to this administrator.",403);
    if(!user.googleSub){user.googleSub=google.sub;await user.save();}
    if(user.twoFactorEnabled) {
      let skip=false;
      if(process.env.TWO_FACTOR_ENABLED==="false"){const role=await Role.findById(user.role).select("isFounderRole");skip=Boolean(role?.isFounderRole);}
      if(!skip) return NextResponse.json({status:"2fa_required",tempToken:signTemp2FAToken({userId:user._id.toString()})});
    }
    user.failedLoginAttempts=0;user.lockUntil=undefined;await user.save();
    const access=signAccessToken({userId:user._id.toString(),roleId:user.role.toString(),tokenVersion:user.refreshTokenVersion});
    const refresh=signRefreshToken({userId:user._id.toString(),tokenVersion:user.refreshTokenVersion});
    const response=await apiSuccess({},"loggedIn","Logged in successfully.",200);setAuthCookies(response,access,refresh);return response;
  } catch(error) { return apiError("googleSignInFailed",error instanceof Error?error.message:"Google sign-in failed.",401); }
}
