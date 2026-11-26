import { createHash, randomBytes } from "node:crypto";\nimport { encryptCredentials } from "@/lib/integrations/crypto";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import { getSiteUrl } from "@/lib/siteUrl";
import ClientProfile from "@/models/ClientProfile";
import IntegrationApplication from "@/models/IntegrationApplication";
import IntegrationOAuthState from "@/models/IntegrationOAuthState";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const providers: Record<string, { authorizeUrl: string; defaultScopes: string[]; extraParams?: Record<string, string> }> = {
  github: { authorizeUrl: "https://github.com/login/oauth/authorize", defaultScopes: ["read:user", "user:email", "repo"] },
  "google_workspace": { authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth", defaultScopes: ["openid", "email", "profile"], extraParams: { access_type: "offline", prompt: "consent" } },
  "google_cloud": { authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth", defaultScopes: ["openid", "email", "profile"], extraParams: { access_type: "offline", prompt: "consent" } },
};

const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return fail("Authentication required.", 401);
  const founder = Boolean(session.role?.isFounderRole);
  const client = founder ? null : await ClientProfile.findOne({ userId: session.user._id }).select("organizationId").lean();
  if (!founder && !client) return fail("An authenticated founder or client account is required.", 403);

  const body = await request.json().catch(() => null) as null | Record<string, unknown>;
  const applicationId = String(body?.applicationId || "");
  if (!mongoose.isValidObjectId(applicationId)) return fail("A valid registered OAuth application is required.");

  await connectToDatabase();
  const ownerType = founder ? "founder" : "client";
  const ownerId = new mongoose.Types.ObjectId(String(session.user._id));
  const application = await IntegrationApplication.findOne({
    _id: applicationId, ownerType, ownerId, active: true, appType: "oauth_app",
  }).lean();
  if (!application) return fail("The OAuth application is unavailable in this account scope.", 404);

  const definition = providers[application.providerId];
  if (!definition) return fail("This provider does not yet have a verified OAuth adapter. Use its supported connection method instead.", 422);

  const redirectUri = new URL("/api/platform/integrations/oauth/callback", getSiteUrl()).toString();
  if (application.callbackUrl !== redirectUri) {
    return fail("The registered callback URL must exactly match: " + redirectUri, 409);
  }
  const clientId = String(application.clientId || "").trim();
  if (!clientId) return fail("The OAuth application is missing its client ID.", 409);

  const scopes = application.scopes?.length ? application.scopes : definition.defaultScopes;
  if (!scopes.length || scopes.some((scope: string) => !/^[a-zA-Z0-9:._/-]{1,180}$/.test(scope))) {
    return fail("The configured OAuth scopes are invalid.", 400);
  }

  const state = randomBytes(32).toString("base64url");
  const stateHash = createHash("sha256").update(state).digest("hex");
  await IntegrationOAuthState.create({
    stateHash, providerId: application.providerId, applicationId: application._id,
    ownerType, ownerId, userId: session.user._id, redirectUri, scopes,
    ...(usePkce ? { pkceVerifierCiphertext: encryptCredentials({ verifier }) } : {}),\n    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  const authorization = new URL(definition.authorizeUrl);
  authorization.searchParams.set("client_id", clientId);
  authorization.searchParams.set("redirect_uri", redirectUri);
  authorization.searchParams.set("response_type", "code");
  authorization.searchParams.set("scope", scopes.join(" "));
  authorization.searchParams.set("state", state);\n  if (usePkce) { authorization.searchParams.set("code_challenge", challenge); authorization.searchParams.set("code_challenge_method", "S256"); }
  for (const [key, value] of Object.entries(definition.extraParams || {})) authorization.searchParams.set(key, value);

  return NextResponse.json({ authorizationUrl: authorization.toString(), expiresInSeconds: 600 });
}
