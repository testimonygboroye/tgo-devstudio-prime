import { connectToDatabase } from "@/lib/db";
import IntegrationConnection from "@/models/IntegrationConnection";
import IntegrationAccount from "@/models/IntegrationAccount";
import { decryptCredentials, encryptCredentials } from "@/lib/integrations/crypto";

export async function getVerifiedIntegrationCredentials(providerId: string): Promise<Record<string, string> | null> {
  await connectToDatabase();
  const row = await IntegrationConnection.findOne({ providerId, status: "connected" }).select("+credentialsCiphertext");
  let credentials: Record<string, string> | null = row && typeof row.credentialsCiphertext === "string"
    ? decryptCredentials(row.credentialsCiphertext)
    : null;

  // Paystack can be connected through the newer owner-scoped Integration Account Vault.
  // Only the founder's verified account with both read and write access may act as
  // the TGO merchant credential; client-owned connections are never used for checkout.
  if (providerId === "paystack" && (!credentials?.secretKey || !credentials?.webhookSecret)) {
    const account = await IntegrationAccount.findOne({
      providerId: "paystack", ownerType: "founder", status: "connected",
      readEnabled: true, writeEnabled: true,
    }).sort({ lastVerifiedAt: -1, updatedAt: -1 }).select("+credentialsCiphertext");
    if (account && typeof account.credentialsCiphertext === "string") {
      credentials = { ...(credentials || {}), ...decryptCredentials(account.credentialsCiphertext) };
    }
  }
  if (!credentials) return null;

  if (row && (providerId === "google_search_console" || providerId === "google_analytics")) {
    const expiresAt = Number(credentials.expiresAt || 0);
    if ((!credentials.refreshToken && (!Number.isFinite(expiresAt) || expiresAt <= Date.now() + 60_000))) {
      row.status = "error";
      row.lastError = "Google OAuth access token expired and no refresh token is stored. Reconnect the Google account with offline access.";
      await row.save();
      return null;
    }
    if (credentials.refreshToken && (!Number.isFinite(expiresAt) || expiresAt <= Date.now() + 60_000)) {
      const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        row.status = "error";
        row.lastError = "Google OAuth refresh requires GOOGLE_CLIENT_ID (or GOOGLE_OAUTH_CLIENT_ID) and GOOGLE_CLIENT_SECRET (or GOOGLE_OAUTH_CLIENT_SECRET).";
        await row.save();
        return null;
      }
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: credentials.refreshToken,
          grant_type: "refresh_token",
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      });
      const payload = await response.json().catch(() => ({})) as { access_token?: string; expires_in?: number; scope?: string; token_type?: string; error?: string };
      if (!response.ok || !payload.access_token) {
        row.status = "error";
        row.lastError = "Google OAuth token refresh failed: " + String(payload.error || "authorization_required").slice(0, 200);
        await row.save();
        return null;
      }
      credentials = {
        ...credentials,
        accessToken: payload.access_token,
        expiresAt: String(Date.now() + Number(payload.expires_in || 3600) * 1000),
        scope: String(payload.scope || credentials.scope || ""),
        tokenType: String(payload.token_type || "Bearer"),
      };
      row.credentialsCiphertext = encryptCredentials(credentials);
      row.lastVerifiedAt = new Date();
      row.lastError = "";
      await row.save();
    }
  }
  return credentials;
}
