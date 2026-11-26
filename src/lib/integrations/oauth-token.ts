import { Types } from "mongoose";
import IntegrationAccount from "@/models/IntegrationAccount";
import IntegrationApplication from "@/models/IntegrationApplication";
import { decryptCredentials, encryptCredentials } from "@/lib/integrations/crypto";

export async function getIntegrationOAuthAccessToken(input: {
  accountId: string;
  ownerType: "founder" | "client";
  ownerId: string;
}): Promise<{ accessToken: string; providerId: string; providerAccountId: string }> {
  if (!Types.ObjectId.isValid(input.accountId) || !Types.ObjectId.isValid(input.ownerId)) {
    throw new Error("A valid owner-scoped integration account is required.");
  }
  const account = await IntegrationAccount.findOne({
    _id: input.accountId, ownerType: input.ownerType, ownerId: input.ownerId,
    authMethod: "oauth2", status: "connected",
  }).select("+credentialsCiphertext");
  if (!account) throw new Error("The OAuth account is not connected in this owner scope.");
  let credentials = decryptCredentials(account.credentialsCiphertext);
  let accessToken = String(credentials.accessToken || "");
  if (!accessToken) throw new Error("The connected account has no access token.");

  const expiresAt = credentials.expiresAt ? new Date(credentials.expiresAt) : null;
  const needsRefresh = Boolean(expiresAt && expiresAt.getTime() <= Date.now() + 120000);
  if (needsRefresh) {
    if (!["google_workspace", "google_cloud", "google_search_console", "google_analytics"].includes(account.providerId)) {
      throw new Error("This provider's OAuth token refresh adapter is not available.");
    }
    const refreshToken = String(credentials.refreshToken || "");
    if (!refreshToken) throw new Error("The OAuth grant expired and no refresh token was issued. Reauthorize this account.");
    const application = await IntegrationApplication.findOne({
      providerId: account.providerId, ownerType: account.ownerType, ownerId: account.ownerId,
      active: true, appType: "oauth_app",
    }).select("+clientSecretCiphertext");
    if (!application?.clientSecretCiphertext) throw new Error("The active OAuth application configuration is unavailable.");
    const secret = decryptCredentials(application.clientSecretCiphertext).clientSecret || "";
    const clientId = String(application.clientId || "");
    if (!secret || !clientId) throw new Error("The OAuth application client ID or secret is missing.");
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        client_id: clientId, client_secret: secret,
        refresh_token: refreshToken, grant_type: "refresh_token",
      }).toString(),
      signal: AbortSignal.timeout(12000), cache: "no-store",
    });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok || !payload.access_token) {
      account.status = "error";
      account.lastError = "OAuth token refresh failed (HTTP " + response.status + "). Reauthorize the account if the provider grant was revoked.";
      await account.save();
      throw new Error(account.lastError);
    }
    accessToken = String(payload.access_token);
    credentials = {
      ...credentials,
      accessToken,
      refreshToken: String(payload.refresh_token || refreshToken),
      tokenType: String(payload.token_type || credentials.tokenType || "Bearer"),
      scope: String(payload.scope || credentials.scope || ""),
      expiresAt: new Date(Date.now() + Number(payload.expires_in || 3600) * 1000).toISOString(),
    };
    account.credentialsCiphertext = encryptCredentials(Object.fromEntries(Object.entries(credentials).map(([key,value])=>[key,String(value)])));
    account.lastVerifiedAt = new Date();
    account.lastError = "";
    await account.save();
  }
  return { accessToken, providerId: account.providerId, providerAccountId: account.providerAccountId || "" };
}
