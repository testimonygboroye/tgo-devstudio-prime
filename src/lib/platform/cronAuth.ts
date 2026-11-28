import { createPublicKey, verify as verifySignature } from "node:crypto";
import type { NextRequest } from "next/server";

type GitHubJwk = JsonWebKey & { kid?: string; kty?: string; alg?: string };
type GitHubJwks = { keys: GitHubJwk[] };

let cachedJwks: { keys: GitHubJwk[]; expiresAt: number } | null = null;

async function getGitHubJwks() {
  if (cachedJwks && cachedJwks.expiresAt > Date.now()) return cachedJwks.keys;
  const response = await fetch("https://token.actions.githubusercontent.com/.well-known/jwks", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to retrieve GitHub Actions signing keys.");
  const body = await response.json() as GitHubJwks;
  if (!Array.isArray(body.keys)) throw new Error("GitHub Actions signing keys are malformed.");
  cachedJwks = { keys: body.keys, expiresAt: Date.now() + 60 * 60 * 1000 };
  return body.keys;
}

function decodeJsonPart(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>;
}

async function verifyGitHubActionsToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = decodeJsonPart(headerPart);
  const claims = decodeJsonPart(payloadPart);
  if (header.alg !== "RS256" || typeof header.kid !== "string") return false;

  const keys = await getGitHubJwks();
  const jwk = keys.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) return false;
  const publicKey = createPublicKey({ key: jwk, format: "jwk" });
  const validSignature = verifySignature(
    "RSA-SHA256",
    Buffer.from(headerPart + "." + payloadPart),
    publicKey,
    Buffer.from(signaturePart, "base64url")
  );
  if (!validSignature) return false;

  const now = Math.floor(Date.now() / 1000);
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const expectedWorkflow = "testimonygboroye/tgo-devstudio-prime/.github/workflows/platform-automation.yml@refs/heads/main";
  return claims.iss === "https://token.actions.githubusercontent.com"
    && audience.includes("tgo-platform-automation")
    && claims.repository === "testimonygboroye/tgo-devstudio-prime"
    && claims.repository_owner === "testimonygboroye"
    && claims.ref === "refs/heads/main"
    && claims.workflow_ref === expectedWorkflow
    && typeof claims.exp === "number" && claims.exp > now
    && typeof claims.iat === "number" && claims.iat <= now + 60
    && (typeof claims.nbf !== "number" || claims.nbf <= now + 30);
}

/**
 * Authorize either the legacy shared cron secret or a short-lived GitHub Actions
 * OIDC token bound to this repository, workflow file and main branch.
 */
export async function authorizePlatformCron(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const secret = process.env.PLATFORM_AUTOMATION_CRON_SECRET || process.env.CRON_SECRET;
  if (secret && authorization === "Bearer " + secret) return true;
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return false;
  try {
    return await verifyGitHubActionsToken(token);
  } catch (error) {
    console.error("[Platform Cron Auth] GitHub OIDC verification failed:", error);
    return false;
  }
}
