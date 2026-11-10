import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { signAccessToken, signRefreshToken, signTemp2FAToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { rememberClientAccount } from "@/lib/clients/account-selector";
import ClientActivity from "@/models/ClientActivity";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const dynamic = "force-dynamic";

async function verifyGoogleCredential(credential?: string, accessToken?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Google sign-in is not configured.");
  if (credential) {
    const response = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential), { cache: "no-store" });
    if (!response.ok) throw new Error("Google credential is invalid or expired.");
    const claims = await response.json();
    if (claims.aud !== clientId || !["accounts.google.com", "https://accounts.google.com"].includes(claims.iss) || Number(claims.exp) * 1000 <= Date.now() || claims.email_verified !== "true" || !claims.sub || !claims.email) {
      throw new Error("Google could not verify this account.");
    }
    return { sub: String(claims.sub), email: String(claims.email).trim().toLowerCase(), name: String(claims.name || ""), picture: String(claims.picture || "") };
  }
  if (!accessToken) throw new Error("Google credential is required.");
  const tokenInfoResponse = await fetch("https://oauth2.googleapis.com/tokeninfo?access_token=" + encodeURIComponent(accessToken), { cache: "no-store" });
  if (!tokenInfoResponse.ok) throw new Error("Google account selection returned an invalid token.");
  const tokenInfo = await tokenInfoResponse.json();
  if ((tokenInfo.aud || tokenInfo.issued_to || tokenInfo.audience) !== clientId || Number(tokenInfo.expires_in) <= 0 || !String(tokenInfo.scope || "").split(" ").includes("openid")) {
    throw new Error("Google account token could not be verified for this application.");
  }
  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: "Bearer " + accessToken }, cache: "no-store" });
  if (!profileResponse.ok) throw new Error("Could not retrieve the selected Google account.");
  const profile = await profileResponse.json();
  if (profile.email_verified !== true || !profile.sub || !profile.email || (tokenInfo.user_id && String(tokenInfo.user_id) !== String(profile.sub)) || (tokenInfo.email && String(tokenInfo.email).toLowerCase() !== String(profile.email).toLowerCase())) {
    throw new Error("Google could not verify the selected email address.");
  }
  return { sub: String(profile.sub), email: String(profile.email).trim().toLowerCase(), name: String(profile.name || ""), picture: String(profile.picture || "") };
}

export async function POST(request: NextRequest) {
  try {
    const { credential, accessToken } = await request.json() as { credential?: string; accessToken?: string };
    if (!credential && !accessToken) return NextResponse.json({ error: "Google credential is required." }, { status: 400 });
    const google = await verifyGoogleCredential(credential, accessToken);
    await connectToDatabase();

    const user = await User.findOne({ email: google.email, accountType: "client" });
    if (!user) return NextResponse.json({ error: "No existing client account matches this Google email. Create a client account first." }, { status: 403 });
    if (user.isBanned) return NextResponse.json({ error: "This client account has been suspended. Contact TGO DevStudio support." }, { status: 403 });
    if (user.googleSub && user.googleSub !== google.sub) return NextResponse.json({ error: "This Google account is not linked to this client account." }, { status: 403 });

    if (!user.googleSub) user.googleSub = google.sub;
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      user.emailVerifiedAt = new Date();
    }
    if (user.twoFactorEnabled) {
      await user.save();
      return NextResponse.json({
        status: "2fa_required",
        tempToken: signTemp2FAToken({ userId: user._id.toString() }),
        googleAccount: { email: google.email, name: google.name, picture: google.picture },
      });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const access = signAccessToken({ userId: user._id.toString(), roleId: user.role.toString(), tokenVersion: user.refreshTokenVersion });
    const refresh = signRefreshToken({ userId: user._id.toString(), tokenVersion: user.refreshTokenVersion });
    const response = NextResponse.json({
      ok: true,
      googleAccount: { email: google.email, name: google.name, picture: google.picture },
      message: "Signed in successfully.",
    });
    setAuthCookies(response, access, refresh);
    rememberClientAccount(response, request, google.email);

    try {
      await Promise.all([
        ClientActivity.create({ clientId: user._id, actorId: user._id, actorType: "client", action: "client.login_google", summary: "Client signed in with Google." }),
        writePlatformAuditEvent({ actorType: "human", actorId: String(user._id), actorLabel: user.name, action: "client.login_google", module: "clients", targetType: "client", targetId: String(user._id), outcome: "success", metadata: { provider: "google" } }),
      ]);
    } catch (auditError) {
      console.error("Client Google sign-in audit write failed", auditError);
    }
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google sign-in failed." }, { status: 401 });
  }
}
