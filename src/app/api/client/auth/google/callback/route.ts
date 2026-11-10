import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { createClientIdentity, ensureClientRole } from "@/lib/clients/identity";
import { signAccessToken, signRefreshToken, signTemp2FAToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import User from "@/models/User";
import ClientProfile from "@/models/ClientProfile";
import ClientActivity from "@/models/ClientActivity";
import { rememberClientAccount } from "@/lib/clients/account-selector";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

type GoogleProfile = { sub?: string; email?: string; email_verified?: boolean; name?: string };

export async function GET(request: NextRequest) {
  const siteUrl = process.env.SITE_URL || request.nextUrl.origin;
  const fail = (reason: string) => NextResponse.redirect(new URL(`/client/login?error=${encodeURIComponent(reason)}`, siteUrl));
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("tgo_client_oauth_state")?.value;
  if (!code || !state || !expectedState || state !== expectedState) return fail("google_state_invalid");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("google_unavailable");

  try {
    const callbackUrl = new URL("/api/client/auth/google/callback", siteUrl).toString();
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: callbackUrl, grant_type: "authorization_code" }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return fail("google_exchange_failed");
    const tokenData = await tokenResponse.json() as { access_token?: string };
    if (!tokenData.access_token) return fail("google_exchange_failed");
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }, cache: "no-store",
    });
    if (!profileResponse.ok) return fail("google_profile_failed");
    const profile = await profileResponse.json() as GoogleProfile;
    const email = profile.email?.trim().toLowerCase();
    if (!profile.sub || !email || profile.email_verified !== true) return fail("google_email_unverified");

    await connectToDatabase();
    let user = await User.findOne({ googleSub: profile.sub });
    if (!user) {
      user = await User.findOne({ email, accountType: "client" });
      if (user) {
        if (user.accountType !== "client" || !user.isEmailVerified) return fail("google_account_conflict");
        if (user.googleSub && user.googleSub !== profile.sub) return fail("google_account_conflict");
        user.googleSub = profile.sub;
        if (!user.authProviders?.includes("google")) user.authProviders = [...(user.authProviders || []), "google"];
        await user.save();
      } else {
        const nameParts=(profile.name?.trim()||email.split("@")[0]).split(/\s+/).filter(Boolean);
        user = await createClientIdentity({
          name: nameParts.join(" "), firstName:nameParts[0]||"Client", middleName:nameParts.length>2?nameParts.slice(1,-1).join(" "):undefined, lastName:nameParts.length>1?nameParts[nameParts.length-1]:"Account", email,
          googleSub: profile.sub, source: "google",
        });
      }
    }
    if (user.accountType !== "client" || user.isBanned || !user.isEmailVerified) return fail("google_account_unavailable");
    if (user.email.toLowerCase() !== email) return fail("google_account_conflict");
    const role = await ensureClientRole();
    if (!user.role.equals(role._id)) return fail("google_account_conflict");
    if (user.twoFactorEnabled) {
      const response = NextResponse.redirect(new URL("/client/login?two_factor=required", siteUrl));
      response.cookies.set("tgo_client_temp_2fa", signTemp2FAToken({ userId: String(user._id) }), {
        httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/client", maxAge: 300,
      });
      response.cookies.delete("tgo_client_oauth_state");
      return response;
    }
    await ClientProfile.updateOne({ userId: user._id }, { $setOnInsert: { userId: user._id, source: "google" } }, { upsert: true });
    await Promise.all([
      ClientActivity.create({
        clientId: user._id, actorId: user._id, actorType: "client",
        action: "client.google_signed_in", summary: "Client signed in with Google.",
      }),
      writePlatformAuditEvent({ actorType: "human", actorId: String(user._id), actorLabel: user.name, action: "client.google_signed_in", module: "clients", targetType: "client", targetId: String(user._id), outcome: "success" }),
    ]);
    const accessToken = signAccessToken({ userId: String(user._id), roleId: String(user.role), tokenVersion: user.refreshTokenVersion });
    const refreshToken = signRefreshToken({ userId: String(user._id), tokenVersion: user.refreshTokenVersion });
    const response = NextResponse.redirect(new URL("/client/dashboard", siteUrl));
    setAuthCookies(response, accessToken, refreshToken);
    rememberClientAccount(response, request, email);
    response.cookies.delete("tgo_client_oauth_state");
    return response;
  } catch {
    return fail("google_sign_in_failed");
  }
}
