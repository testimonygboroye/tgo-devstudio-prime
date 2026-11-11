import { connectToDatabase } from "@/lib/db";
import IntegrationConnection from "@/models/IntegrationConnection";
import { decryptCredentials } from "@/lib/integrations/crypto";
export async function getVerifiedIntegrationCredentials(providerId: string): Promise<Record<string, string> | null> {
  await connectToDatabase();
  const row = await IntegrationConnection.findOne({ providerId, status: "connected" }).select("+credentialsCiphertext").lean();
  if (!row || typeof row.credentialsCiphertext !== "string") return null;
  return decryptCredentials(row.credentialsCiphertext);
}
