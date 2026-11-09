import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const siteUrl = process.env.SITE_URL;
  if (!clientId || !siteUrl) return NextResponse.redirect(new URL("/client/login?error=google_unavailable", request.url));
  const state = randomBytes(32).toString("base64url");
  const callback = new URL("/api/client/auth/google/callback", siteUrl);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callback.toString());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  const response = NextResponse.redirect(url);
  response.cookies.set("tgo_client_oauth_state", state, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 600,
  });
  return response;
}
