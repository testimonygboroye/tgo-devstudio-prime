import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { connectToDatabase } from "@/lib/db";
import Invite from "@/models/Invite";
import User from "@/models/User";
import { hashToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/passwords";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";

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
    const {credential,token,name}=await request.json() as {credential?:string;token?:string;name?:string};
    if(!credential||!token) return NextResponse.json({status:"error",message:"Google credential and invitation token are required."},{status:400});
    const google=await verifyGoogleCredential(credential);
    await connectToDatabase();
    const invite=await Invite.findOne({tokenHash:hashToken(token)});
    if(!invite) return NextResponse.json({status:"error",message:"Invite not found or invalid."},{status:404});
    if(invite.approvalStatus!=="approved") return NextResponse.json({status:"error",message:"This invite has not been approved yet."},{status:403});
    if(invite.usedAt) return NextResponse.json({status:"error",message:"This invite has already been used."},{status:410});
    if(invite.expiresAt.getTime()<Date.now()) return NextResponse.json({status:"error",message:"This invite has expired."},{status:410});
    if(google.email!==invite.email.trim().toLowerCase()) return NextResponse.json({status:"error",message:"Choose the Google account matching the email address on this invitation."},{status:403});
    if(await User.findOne({email:google.email})) return NextResponse.json({status:"error",message:"An account with this email already exists."},{status:409});
    const passwordHash=await hashPassword(randomBytes(48).toString("base64url"));
    const user=await User.create({name:(name||google.name||google.email.split("@")[0]).trim(),email:google.email,passwordHash,googleSub:google.sub,role:invite.role});
    const consumed=await Invite.updateOne({_id:invite._id,usedAt:null,approvalStatus:"approved",expiresAt:{$gt:new Date()}},{$set:{usedAt:new Date()}});
    if(consumed.modifiedCount!==1){await User.deleteOne({_id:user._id});return NextResponse.json({status:"error",message:"This invitation has already been used or expired."},{status:409});}
    const access=signAccessToken({userId:user._id.toString(),roleId:user.role.toString(),tokenVersion:user.refreshTokenVersion});
    const refresh=signRefreshToken({userId:user._id.toString(),tokenVersion:user.refreshTokenVersion});
    const response=NextResponse.json({status:"ok",message:"Account created and signed in successfully."},{status:201});setAuthCookies(response,access,refresh);return response;
  } catch(error){return NextResponse.json({status:"error",message:error instanceof Error?error.message:"Google invitation registration failed."},{status:401});}
}
