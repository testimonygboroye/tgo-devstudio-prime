import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getSiteUrl } from "@/lib/siteUrl";
import IntegrationOAuthState from "@/models/IntegrationOAuthState";
import IntegrationApplication from "@/models/IntegrationApplication";
import IntegrationAccount from "@/models/IntegrationAccount";
import ClientProfile from "@/models/ClientProfile";
import { decryptCredentials, encryptCredentials } from "@/lib/integrations/crypto";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const redirectResult = (kind: "success" | "error", provider: string, message: string, returnOrigin = getSiteUrl()) => {
  const url = new URL("/admin/integrations", returnOrigin);
  url.searchParams.set("oauth", kind);
  url.searchParams.set("provider", provider);
  url.searchParams.set("message", message.slice(0, 180));
  return NextResponse.redirect(url);
};

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const params = request.nextUrl.searchParams;
  const code = String(params.get("code") || "");
  const state = String(params.get("state") || "");
  const providerError = String(params.get("error_description") || params.get("error") || "");
  if (!state || state.length > 200) return redirectResult("error", "unknown", "OAuth state is missing or invalid.");

  const stateHash = createHash("sha256").update(state).digest("hex");
  const stateRecord = await IntegrationOAuthState.findOneAndUpdate(
    { stateHash, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { returnDocument: "after" },
  ).select("+pkceVerifierCiphertext");
  if (!stateRecord) return redirectResult("error", "unknown", "This authorization request expired or has already been used.");

  const providerId = stateRecord.providerId;
  if (providerError) return redirectResult("error", providerId, "The provider authorization was cancelled or denied.", stateRecord.returnOrigin);
  if (!code || code.length > 4000) return redirectResult("error", providerId, "The provider did not return a valid authorization code.", stateRecord.returnOrigin);

  const application = await IntegrationApplication.findOne({
    _id: stateRecord.applicationId,
    providerId,
    ownerType: stateRecord.ownerType,
    ownerId: stateRecord.ownerId,
    active: true,
  }).select("+clientSecretCiphertext");
  if (!application?.clientSecretCiphertext) return redirectResult("error", providerId, "The registered OAuth application is unavailable or has no client secret.", stateRecord.returnOrigin);

  let secret = "";
  try { secret = decryptCredentials(application.clientSecretCiphertext).clientSecret || ""; }
  catch { return redirectResult("error", providerId, "The OAuth application secret could not be decrypted. Check integration encryption configuration.", stateRecord.returnOrigin); }
  if (!secret) return redirectResult("error", providerId, "The OAuth application secret is missing.", stateRecord.returnOrigin);

  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  const timeout = AbortSignal.timeout(15000);
  let token: Record<string, unknown> = {};
  let identity: Record<string, unknown> = {};
  let grantedPermissions: string[] = [];
  try {
    if (providerId === "github") {
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST", headers, signal: timeout,
        body: JSON.stringify({ client_id: application.clientId, client_secret: secret, code, redirect_uri: stateRecord.redirectUri }),
        cache: "no-store",
      });
      token = await response.json().catch(() => ({}));
      if (!response.ok || !token.access_token) throw new Error("GitHub token exchange failed (HTTP " + response.status + ").");
      const identityResponse = await fetch("https://api.github.com/user", {
        headers: { Authorization: "Bearer " + String(token.access_token), Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "TGO-DevStudio-Prime" },
        signal: timeout, cache: "no-store",
      });
      identity = await identityResponse.json().catch(() => ({}));
      if (!identityResponse.ok || !identity.id) throw new Error("GitHub account identity could not be verified.");
      const grantedHeader = identityResponse.headers.get("X-OAuth-Scopes") || String(token.scope || "");
      grantedPermissions = grantedHeader.split(/[ ,]+/).map(value => value.trim()).filter(Boolean);
    } else if (providerId === "google_workspace" || providerId === "google_cloud") {
      const form = new URLSearchParams({
        code, client_id: String(application.clientId), client_secret: secret,
        redirect_uri: stateRecord.redirectUri, grant_type: "authorization_code",\n        ...(stateRecord.pkceVerifierCiphertext ? { code_verifier: decryptCredentials(stateRecord.pkceVerifierCiphertext).verifier } : {}),
      });
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: form.toString(), signal: timeout, cache: "no-store",
      });
      token = await response.json().catch(() => ({}));
      if (!response.ok || !token.access_token) throw new Error("Google token exchange failed (HTTP " + response.status + ").");
      const identityResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: "Bearer " + String(token.access_token) }, signal: timeout, cache: "no-store",
      });
      identity = await identityResponse.json().catch(() => ({}));
      if (!identityResponse.ok || !identity.sub) throw new Error("Google account identity could not be verified.");
      grantedPermissions = String(token.scope || "").split(" ").filter(Boolean);
    } else {
      throw new Error("No OAuth callback adapter is registered for this provider.");
    }

    const now = new Date();
    const expiresAt = Number(token.expires_in) > 0 ? new Date(now.getTime() + Number(token.expires_in) * 1000).toISOString() : "";
    const encrypted = encryptCredentials({
      accessToken: String(token.access_token),
      refreshToken: String(token.refresh_token || ""),
      tokenType: String(token.token_type || "Bearer"),
      scope: String(token.scope || grantedPermissions.join(" ")),
      expiresAt,
    });
    const accountIdentity = String(identity.login || identity.email || identity.name || identity.id || identity.sub || "connected-account");
    const accountLabel = (providerId + " · " + accountIdentity).slice(0, 120);
    const client = stateRecord.ownerType === "client"
      ? await ClientProfile.findOne({ userId: stateRecord.ownerId }).select("organizationId").lean()
      : null;
    const account = await IntegrationAccount.findOneAndUpdate(
      { providerId, ownerType: stateRecord.ownerType, ownerId: stateRecord.ownerId, accountLabel },
      { $set: {
        providerAccountId: String(identity.id || identity.sub || ""),
        ...(client?.organizationId ? { organizationId: client.organizationId } : {}),
        authMethod: "oauth2", credentialsCiphertext: encrypted,
        credentialNames: ["accessToken", "refreshToken", "tokenType", "scope", "expiresAt"],
        requestedPermissions: stateRecord.scopes, grantedPermissions,
        readEnabled: true, writeEnabled: true, status: "connected",
        lastVerifiedAt: now, lastError: "", connectedBy: stateRecord.userId,
        disconnectedAt: undefined, revokedAt: undefined,
      }, $setOnInsert: { providerId, ownerType: stateRecord.ownerType, ownerId: stateRecord.ownerId, accountLabel } },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    await writePlatformAuditEvent({
      actorType: "human", actorId: String(stateRecord.userId), action: "integration.oauth.connected",
      module: "integrations", targetType: "IntegrationAccount", targetId: String(account._id), outcome: "success",
      metadata: { providerId, ownerType: stateRecord.ownerType, requestedPermissions: stateRecord.scopes, grantedPermissions },
    });
    return redirectResult("success", providerId, "Account connected successfully.", stateRecord.returnOrigin);
  } catch (error) {
    const safeMessage = (error instanceof Error ? error.message : "OAuth authorization failed.")
      .replace(/(?:AIza[0-9A-Za-z_-]{20,}|gh[opsu]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,})/g, "[redacted]")
      .slice(0, 180);
    await writePlatformAuditEvent({
      actorType: "system", actorId: String(stateRecord.userId), action: "integration.oauth.failed",
      module: "integrations", targetType: "IntegrationApplication", targetId: String(application._id), outcome: "failure",
      metadata: { providerId, ownerType: stateRecord.ownerType, error: safeMessage },
    }).catch(() => undefined);
    return redirectResult("error", providerId, "Account connection failed. Check the integration diagnostics.", stateRecord.returnOrigin);
  }
}
